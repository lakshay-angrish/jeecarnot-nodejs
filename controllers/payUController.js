require("dotenv").config();
const Mentee = require("../models/menteeModel");
const AssignMentor = require("../models/assignMentor");
const Payment = require("../models/menteePayment");
const UnresolvedPayments = require("../models/unresolvedMenteePayments");
const staticData = require("../staticData.json");
const crypto = require("crypto");
const admin = require("firebase-admin");
const serviceAccount = require("../firebase-adminSDK.json");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function sendNotifications(message, registrationTokens) {
  if (registrationTokens.length == 0) {
    console.log("tokens missing");
    return;
  }
  let response = await admin.messaging().sendMulticast({
    notification: {
      title: message.title,
      body: message.body,
      image: message.image,
    },
    tokens: registrationTokens,
  });
  console.log("Successfully sent message:", response);
}

exports.checkout = async (req, res, next) => {
  try {
    if (!req.query.planID) {
      throw new Error("Plan not provided");
    }

    let selectedPlan;
    const plans = staticData.plans;

    for (plan of plans) {
      if (plan.id == req.query.planID) {
        selectedPlan = plan;
        break;
      }
    }

    if (!selectedPlan) {
      throw new Error("Invalid planID");
    }

    const data = {
      key: process.env.MERCHANT_KEY,
      txnid: req.user._id + Date.now(),
      amount: selectedPlan.amount,
      planName: selectedPlan.name,
      firstName: req.user.name,
      email: req.user.email,
      mobile: req.user.phone,
      udf1: req.user._id,
      udf2: req.query.promoCode,
      udf3: plan.validity,
    };
    if (!req.query.promoCode) {
      data.udf2 = "";
    }

    let cryp = crypto.createHash("sha512");
    let text =
      data.key +
      "|" +
      data.txnid +
      "|" +
      data.amount +
      "|" +
      data.planName +
      "|" +
      data.firstName +
      "|" +
      data.email +
      "|" +
      data.udf1 +
      "|" +
      data.udf2 +
      "|" +
      data.udf3 +
      "||||||||" +
      process.env.MERCHANT_SALT;

    cryp.update(text);
    data.hash = cryp.digest("hex");

    res.render("checkout", { data: data });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      type: "error",
      message: error.message,
    });
  }
};

exports.successCallback = async (req, res, next) => {
  res.status(200).json({
    type: "success",
    message: "Transaction Successful",
  });
};

exports.failureCallback = async (req, res, next) => {
  res.status(200).json({
    type: "failure",
    message: "Transaction Failure",
  });
};

exports.webhook = async (req, res, next) => {
  try {
    const data = req.body;
    let cryp = crypto.createHash("sha512");
    let text =
      process.env.MERCHANT_SALT +
      "|" +
      data.status +
      "||||||||" +
      data.udf3 +
      "|" +
      data.udf2 +
      "|" +
      data.udf1 +
      "|" +
      data.email +
      "|" +
      data.firstname +
      "|" +
      data.productinfo +
      "|" +
      data.amount +
      "|" +
      data.txnid +
      "|" +
      data.key;

    cryp.update(text);
    const hash = cryp.digest("hex");

    if (hash != data.hash) {
      throw new Error("Unauthorized Request");
    }

    const menteeID = data.udf1;
    let mentee = await Mentee.findById(menteeID);

    if (!mentee) {
      throw new Error("Mentee not found");
    }

    let paymentData = {
      isConsentPayment: req.body.isConsentPayment,
      mihpayid: req.body.mihpayid,
      mode: req.body.mode,
      status: req.body.status,
      unmappedstatus: req.body.unmappedstatus,
      txnid: req.body.txnid,
      amount: req.body.amount,
      addedon: req.body.addedon,
      productinfo: req.body.productinfo,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      address1: req.body.address1,
      address2: req.body.address2,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      zipcode: req.body.zipcode,
      email: req.body.email,
      phone: req.body.phone,
      udf1: req.body.udf1,
      udf2: req.body.udf2,
      udf3: req.body.udf3,
      udf4: req.body.udf4,
      udf5: req.body.udf5,
      udf6: req.body.udf6,
      udf7: req.body.udf7,
      udf8: req.body.udf8,
      udf9: req.body.udf9,
      udf10: req.body.udf10,
      field1: req.body.field1,
      field2: req.body.field2,
      field3: req.body.field3,
      field4: req.body.field4,
      field5: req.body.field5,
      field6: req.body.field6,
      field7: req.body.field7,
      field8: req.body.field8,
      field9: req.body.field9,
      giftCardIssued: req.body.giftCardIssued,
      PG_TYPE: req.body.PG_TYPE,
      encryptedPaymentId: req.body.encryptedPaymentId,
      bank_ref_num: req.body.bank_ref_num,
      bankcode: req.body.bankcode,
      error: req.body.error,
      error_Message: req.body.error_Message,
      name_on_card: req.body.name_on_card,
      cardnum: req.body.cardnum,
      amount_split: req.body.amount_split,
      payuMoneyId: req.body.payuMoneyId,
      discount: req.body.discount,
      net_amount_debit: req.body.net_amount_debit,
    };

    if (req.body.status != "success" && req.body.status != "failure") {
      let unresolvedPayment = new UnresolvedPayments(paymentData);
      await unresolvedPayment.save();
      return res.status(200).json({
        type: "unresolved",
        message: "unresolved transaction",
      });
    }

    if (req.body.status == "failure") {
      return res.status(200).json({
        type: "failed",
        message: "failed transaction",
      });
    }

    let recipients = [];
    recipients = [...mentee.mobileTokens];
    if (mentee.webToken) recipients.push(mentee.webToken);

    await sendNotifications(
      {
        title: "Payment Successful",
        body: "Amount of: Rs." + data.amount + " paid for: " + data.productinfo,
      },
      recipients
    );

    let assign = new AssignMentor({
      menteeID: menteeID,
    });

    await assign.save();

    let payment = new Payment(paymentData);

    await payment.save();

    let membershipExpiresOn = mentee.membershipExpiresOn;

    let today = new Date();
    today = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    );

    let validity = parseInt(data.udf3);

    if (
      !membershipExpiresOn ||
      membershipExpiresOn.getTime() <= today.getTime()
    ) {
      membershipExpiresOn = new Date(
        Date.UTC(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + validity
        )
      );
    } else {
      membershipExpiresOn = new Date(membershipExpiresOn);
      membershipExpiresOn = new Date(
        Date.UTC(
          membershipExpiresOn.getFullYear(),
          membershipExpiresOn.getMonth(),
          membershipExpiresOn.getDate() + validity
        )
      );
    }

    console.log(membershipExpiresOn);

    await Mentee.findByIdAndUpdate(menteeID, {
      membershipExpiresOn: membershipExpiresOn,
      $push: {
        payments: payment._id,
      },
    });

    res.status(200).json({
      type: "success",
      message: "Transaction Successful",
      body: req.body,
    });
  } catch (error) {
    res.status(500).json({
      type: "error",
      message: error.message,
    });
  }
};
