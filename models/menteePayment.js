const mongoose = require("mongoose");

const menteePaymentSchema = new mongoose.Schema({
  menteeID: {
    type: String,
    required: true,
  },
  txnid: {
    type: String,
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  plan: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("MenteePayment", menteePaymentSchema);
