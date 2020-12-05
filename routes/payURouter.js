const router = require("express").Router();
const checkAuth = require("../methods/middlewares").isMenteeAuthenticated;
const payUController = require("../controllers/payUController");

router.get("/checkout", checkAuth, payUController.checkout);

router.post("/success", checkAuth, payUController.successCallback);
router.post("/failure", checkAuth, payUController.failureCallback);

router.post("/successWebhook", payUController.successWebhook);

module.exports = router;
