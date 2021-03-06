const Tracker = require("../models/tracker");
const Chapter = require("../models/chapter");
const Subtopic = require("../models/subtopic");
const chapterData = require("../chapterData.json");

exports.updateSubtopic = async (req, res, next) => {
  try {
    if (
      !req.body.chapterCode ||
      !req.body.subtopicName ||
      !req.body.status ||
      req.body.status.length != 3
    ) {
      throw new Error(
        "chapterCode, subtopicName and status(with status.length == 3) must be supplied"
      );
    }
    let tracker = await Tracker.findOne({ menteeID: req.user._id }).exec();

    if (!tracker) {
      tracker = new Tracker({ menteeID: req.user._id });
      await tracker.save();
      console.log("tracker not found");
    } else {
      console.log("tracker found");
    }

    if (!chapterData[req.body.chapterCode]) {
      console.log("chapter not found");
      throw new Error("Invalid Chapter Code");
    }

    let chapterIndex = -1;
    for (i in tracker.chapters) {
      if (tracker.chapters[i].code == req.body.chapterCode) {
        chapterIndex = i;
        console.log("chapter found");
        break;
      }
    }

    if (chapterIndex == -1) {
      console.log("chapter not found");
      tracker.chapters.push(
        new Chapter({
          code: req.body.chapterCode,
          name: chapterData[req.body.chapterCode].name,
          class: chapterData[req.body.chapterCode].class,
          subtopics: chapterData[req.body.chapterCode].subtopics.map(
            (subtopic) => new Subtopic({ ...subtopic })
          ),
        })
      );
      chapterIndex = tracker.chapters.length - 1;
    }

    let subtopicIndex = -1;
    for (subtopic of tracker.chapters[chapterIndex].subtopics) {
      if (subtopic.name == req.body.subtopicName) {
        console.log("subtopic found");
        subtopic.theory = req.body.status[0];
        subtopic.level1 = req.body.status[1];
        subtopic.level2 = req.body.status[2];
        subtopicIndex = i;
        break;
      }
    }

    if (subtopicIndex == -1) {
      console.log("subtopic not found");
      tracker.chapters[chapterIndex].subtopics.push(
        new Subtopic({
          name: req.body.subtopicName,
          theory: req.body.status[0],
          level1: req.body.status[1],
          level2: req.body.status[2],
        })
      );
      subtopicIndex = tracker.chapters[chapterIndex].subtopics.length - 1;
    }

    await tracker.save();

    res.status(200).json({
      type: "success",
      description: "Tracker Updated",
    });
  } catch (error) {
    res.status(500).json({
      type: "failure",
      error: error.message,
    });
  }
};

exports.addRemark = async (req, res, next) => {
  try {
    if (!req.body.chapterCode || !req.body.remark) {
      throw new Error("chapterCode and subtopicName must be supplied");
    }
    let tracker = await Tracker.findOne({ menteeID: req.user._id }).exec();

    if (!tracker) {
      tracker = new Tracker({ menteeID: req.user._id });
      await tracker.save();
      console.log("tracker not found");
    } else {
      console.log("tracker found");
    }

    if (!chapterData[req.body.chapterCode]) {
      console.log("chapter not found");
      throw new Error("Invalid Chapter Code");
    }

    let chapterIndex = -1;
    for (i in tracker.chapters) {
      if (tracker.chapters[i].code == req.body.chapterCode) {
        chapterIndex = i;
        console.log("chapter found");
        tracker.chapters[i].remark = req.body.remark;
        break;
      }
    }

    if (chapterIndex == -1) {
      console.log("chapter not found");
      tracker.chapters.push(
        new Chapter({
          code: req.body.chapterCode,
          name: chapterData[req.body.chapterCode].name,
          class: chapterData[req.body.chapterCode].class,
          remark: req.body.remark,
          subtopics: chapterData[req.body.chapterCode].subtopics.map(
            (subtopic) => new Subtopic({ ...subtopic })
          ),
        })
      );
    }

    await tracker.save();

    res.status(200).json({
      type: "success",
      description: "Tracker Updated",
    });
  } catch (error) {
    res.status(500).json({
      type: "failure",
      error: error.message,
    });
  }
};

exports.resetChapter = async (req, res, next) => {
  try {
    if (!req.body.chapterCode) {
      throw new Error("chapterCode must be supplied");
    }
    let tracker = await Tracker.findOne({ menteeID: req.user._id }).exec();

    if (!tracker) {
      tracker = new Tracker({ menteeID: req.user._id });
      await tracker.save();
      console.log("tracker not found");
    } else {
      console.log("tracker found");
    }

    if (!chapterData[req.body.chapterCode]) {
      console.log("chapter not found");
      throw new Error("Invalid Chapter Code");
    }

    for (i in tracker.chapters) {
      if (tracker.chapters[i].code == req.body.chapterCode) {
        console.log("chapter found");
        tracker.chapters[i] = new Chapter({
          code: req.body.chapterCode,
          name: chapterData[req.body.chapterCode].name,
          class: chapterData[req.body.chapterCode].class,
          subtopics: chapterData[req.body.chapterCode].subtopics.map(
            (subtopic) => new Subtopic({ ...subtopic })
          ),
        });
        break;
      }
    }

    await tracker.save();

    res.status(200).json({
      type: "success",
      description: "Chapter Reset",
    });
  } catch (error) {
    res.status(500).json({
      type: "failure",
      error: error.message,
    });
  }
};

exports.markChapterForRevision = async (req, res, next) => {
  try {
    if (!req.body.chapterCode) {
      throw new Error("chapterCode must be supplied");
    }
    let tracker = await Tracker.findOne({ menteeID: req.user._id }).exec();

    if (!tracker) {
      tracker = new Tracker({ menteeID: req.user._id });
      await tracker.save();
      console.log("tracker not found");
    } else {
      console.log("tracker found");
    }

    if (!chapterData[req.body.chapterCode]) {
      console.log("chapter not found");
      throw new Error("Invalid Chapter Code");
    }

    let chapterIndex = -1;
    for (i in tracker.chapters) {
      if (tracker.chapters[i].code == req.body.chapterCode) {
        chapterIndex = i;
        console.log("chapter found");
        tracker.chapters[i].status = "revision";
        break;
      }
    }

    if (chapterIndex == -1) {
      console.log("chapter not found");
      tracker.chapters.push(
        new Chapter({
          code: req.body.chapterCode,
          name: chapterData[req.body.chapterCode].name,
          class: chapterData[req.body.chapterCode].class,
          status: "revision",
          subtopics: chapterData[req.body.chapterCode].subtopics.map(
            (subtopic) => new Subtopic({ ...subtopic })
          ),
        })
      );
    }

    await tracker.save();

    res.status(200).json({
      type: "success",
      description: "Chapter Marked for Revision",
    });
  } catch (error) {
    res.status(500).json({
      type: "failure",
      error: error.message,
    });
  }
};
