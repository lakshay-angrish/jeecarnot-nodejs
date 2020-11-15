const mongoose = require("mongoose");
const Chapter = require("./chapter").schema;

const trackerSchema = new mongoose.Schema({
  menteeID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mentee",
    required: true,
  },
  chapters: [Chapter],
});

module.exports = mongoose.model("Tracker", trackerSchema);
