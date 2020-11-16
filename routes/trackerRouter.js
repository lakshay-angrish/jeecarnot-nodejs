const router = require("express").Router();
const checkAuth = require("../methods/middlewares").isMenteeAuthenticated;
const trackerController = require("../controllers/trackerController");

router.post("/update-subtopic", checkAuth, trackerController.updateSubtopic);

router.post("/add-remark", checkAuth, trackerController.addRemark);

router.post("/reset-chapter", checkAuth, trackerController.resetChapter);

router.post(
  "/mark-for-revision",
  checkAuth,
  trackerController.markChapterForRevision
);

module.exports = router;
