const router = require("express").Router();
const Tracker = require("../models/tracker");
const Chapter = require("../models/chapter");
const Subtopic = require("../models/subtopic");

router.post("/tracker/api/update", async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: "User not authenticated",
    });
  }

  if (!req.body.chapterCode || !req.body.subtopicName) {
    return res.status(500).json({
      error: "chapterCode and subtopicName must be supplied",
    });
  }

  try {
    let tracker = await Tracker.findOne({ menteeID: req.user._id }).exec();

    if (!tracker) {
      tracker = new Tracker({ menteeID: req.user._id });
      await tracker.save();
      console.log("tracker not found");
    } else {
      console.log("tracker found");
    }

    let chapter = await Chapter.findOne({
      trackerID: tracker._id,
      code: req.body.chapterCode,
    }).exec();

    if (!chapter) {
      chapter = new Chapter({
        trackerID: tracker._id,
        code: req.body.chapterCode,
        class: req.body.chapterClass,
        name: req.body.chapterName,
      });
      await chapter.save();
      console.log("chapter not found");
    } else {
      console.log("chapter found");
    }

    let subtopic = await Subtopic.findOne({
      chapterID: chapter._id,
      name: req.body.subtopicName,
    }).exec();

    if (!subtopic) {
      subtopic = new Subtopic({
        chapterID: chapter._id,
        name: req.body.subtopicName,
      });
      await subtopic.save();
      console.log("subtopic not found");
    } else {
      console.log("subtopic found");
    }

    let { theory, level1, level2 } = subtopic;
    if (req.body.subtopicTheory) {
      theory = req.body.subtopicTheory;
      console.log("theory received");
    }
    if (req.body.subtopicLevel1) {
      level1 = req.body.subtopicLevel1;
      console.log("level1 received");
    }
    if (req.body.subtopicLevel2) {
      level2 = req.body.subtopicLevel2;
      console.log("level2 received");
    }

    let { status, remark } = chapter;
    if (req.body.chapterStatus) {
      status = req.body.chapterStatus;
      console.log("status received");
    }
    if (req.body.chapterRemark) {
      remark = req.body.chapterRemark;
      console.log("remark received");
    }

    await Chapter.findByIdAndUpdate(chapter._id, {
      $set: {
        status: status,
        remark: remark,
      },
    });

    await Subtopic.findByIdAndUpdate(subtopic._id, {
      $set: {
        theory: theory,
        level1: level1,
        level2: level2,
      },
    });

    res.status(200).json({
      status: "Tracker Updated",
    });
  } catch (error) {
    return res.json({
      error: error.message,
    });
  }
});

module.exports = router;
