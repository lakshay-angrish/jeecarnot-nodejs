require("dotenv").config();
const Mentee = require("../models/menteeModel");
const AssignMentor = require("../models/assignMentor");
const Payment = require("../models/menteePayment");
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
      salt: process.env.MERCHANT_SALT,
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
      data.salt;

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
    let mentee = await Mentee.findByIdAndUpdate(menteeID, {
      validity: data.udf3,
    });

    if (!mentee) {
      throw new Error("Mentee not found");
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

    let payment = new Payment({
      menteeID: menteeID,
      amountPaid: data.amount,
      plan: data.productinfo,
      txnid: data.txnid,
    });

    await payment.save();

    await Mentee.findByIdAndUpdate(menteeID, {
      $push: {
        payments: payment._id,
      },
    });

    res.status(200).json({
      type: "success",
      data: {
        txnid: data.txnid,
        name: data.firstname,
        amount: data.amount,
        plan: data.productinfo,
      },
    });
  } catch (error) {
    res.status(500).json({
      type: "error",
      message: error.message,
    });
  }
};

exports.failureCallback = async (req, res, next) => {
  res.status(200).json({
    type: "failure",
    message: "Transaction Failure",
  });
};
