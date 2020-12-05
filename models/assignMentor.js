const mongoose = require("mongoose");

const assignMentorSchema = new mongoose.Schema({
  menteeID: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("AssignMentor", assignMentorSchema);
