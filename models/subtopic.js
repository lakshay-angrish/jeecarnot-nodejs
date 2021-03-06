const mongoose = require("mongoose");

const subtopicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: "subtopic",
  },
  theory: {
    type: Boolean,
    default: false,
  },
  level1: {
    type: Boolean,
    default: false,
  },
  level2: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Subtopic", subtopicSchema);
