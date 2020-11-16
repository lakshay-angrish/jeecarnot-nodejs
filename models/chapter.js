const mongoose = require("mongoose");
const Subtopic = require("./subtopic").schema;

const chapterSchema = new mongoose.Schema({
  code: {
    type: String,
    default: "code",
  },
  name: {
    type: String,
    default: "chapter",
  },
  class: {
    type: Number,
    min: 11,
    max: 12,
    default: 11,
  },
  remark: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["ongoing", "completed", "revision", "none"],
    default: "none",
  },
  subtopics: [Subtopic],
});

module.exports = mongoose.model("Chapter", chapterSchema);
