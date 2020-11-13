const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema({
  trackerID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
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
    enum: ["ongoing", "completed", "none"],
    default: "none",
  },
});

module.exports = mongoose.model("Chapter", chapterSchema);
