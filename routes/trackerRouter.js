const router = require("express").Router();
const checkAuth = require("../methods/middlewares").isMenteeAuthenticated;
const trackerController = require("../controllers/trackerController")

router.post("/update-subtopic", checkAuth, trackerController.updateSubtopic);

module.exports = router;
