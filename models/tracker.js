const mongoose = require("mongoose");

const trackerSchema = new mongoose.Schema({
  menteeID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mentee",
    required: true,
  },
});

module.exports = mongoose.model("Tracker", trackerSchema);
