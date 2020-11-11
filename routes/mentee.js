require('dotenv').config()
//console.log(process.env) // only to verify
const {
    render
} = require('ejs')
const express = require('express')
require('dotenv').config()
const router = require('express').Router()
var bodyparser = require("body-parser")
const msg91OTP = require('msg91-lib').msg91OTP;
const jwt = require('jsonwebtoken');
const msg91otp = new msg91OTP({
    authKey: process.env.MSG91_AUTH,
    templateId: process.env.MSG91_TEMPLATE
})
const secret = process.env.secret_json
const mailgun = require("mailgun-js");
const DOMAIN = 'jeecarnot.com';
const mg = mailgun({
    apiKey: process.env.MAILGUN_API,
    domain: DOMAIN
});
var senderEmail = 'JEECarnot <no-reply-test@carnot-test.com>'
var passport = require("passport")
var localStrategy = require('passport-local')
var localMongooseStrategy = require('passport-local-mongoose')
var Mentee = require('../models/menteeModel') // i have added extra field of plan ID which would be unique to each transaction (can be transaction id)
var Mentor = require("../models/mentorModel")
var Feedback = require("../models/feedbackModel")
var Request = require("../models/requestModel")
var Help = require("../models/helpModel")
var mongoose = require('mongoose');
const {
    assert
} = require('console');
var mongoDB = "mongodb://localhost:27017/carnot"
router.use(bodyparser.urlencoded({
    extended: true
}))
mongoose.connect(mongoDB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
})
var db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
router.use(express.static('public'))
router.use(require("express-session")({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
router.use(passport.initialize())
router.use(passport.session())
passport.use(Mentee.createStrategy())
// passport.use(new localStrategy(Mentee.authenticate()))
passport.serializeUser(Mentee.serializeUser(function (user, done) {
    done(null, user.id)
}))
passport.deserializeUser(Mentee.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user)
    })
}))

router.post('/mentee/register/api/send-otp', formFill, async (req, res) => {
    try {
        var number = req.body.phone
        //console.log(number.length)
        const response = await msg91otp.send('+91' + number, {
            otp_expiry: 10
        })
        if (response.type == 'success') {
            res.json({
                type: 'success',
            })
        } else {
            res.json({
                type: 'failure',
                err: "duplicate number"
            })
        }
    } catch (err) {
        console.log("error in try");
        res.json({
            type: "failure",
        })
    }
})

router.post('/mentee/register', formFill, async (req, res) => {
    try {
        const response = await msg91otp.verify('+91' + req.body.phone, req.body.otp)
        if (response.type == 'success') {
            //if (true) { // for testing purposes use this if loop.
            console.log(req.body.email)
            Mentee.register(new Mentee({
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                }),
                req.body.password,
                function (err, newMentee) {
                    if (err) {
                        res.json({
                            type: 'failure',
                            err: 'errorRegistering'
                        })
                    } else {
                        var user = {
                            email: newMentee.email,
                            id: newMentee._id
                        }
                        jwt.sign({
                            user
                        }, secret, {
                            expiresIn: '24h'
                        }, async (err, token) => {
                            if (!err) {
                                var link = 'localhost:3333/mentee/email/' + token.toString()
                                var emailData = {
                                    from: senderEmail,
                                    to: user.email,
                                    subject: 'Verify your Email',
                                    html: '<h1>Welcome to JEE CARNOT</h1><br><p>to verify your email pls click on link below</p><br><a href=' + link + '>Verify Your Email</a>'
                                }
                                var sentEmail = await mg.messages().send(emailData)
                            }
                        })
                        req.logIn(newMentee, (erri) => {
                            if (erri) {
                                console.log(erri)
                            }
                        })
                        res.json({
                            type: 'success',
                        })
                    }
                })
        } else {
            res.json({
                type: 'failure',
                err: 'failedVerification'
            })
        }
    } catch (error) {
        console.log(error);
        res.json({
            type: 'failure',
            err: 'unknown'
        })
    }
})

router.post('/mentee/register/api/resend-otp', formFill, async (req, res) => {
    try {
        const response = await msg91otp.retry("+91" + req.body.phone);
        res.json({
            type: 'success',
            response
        })
    } catch (error) {
        console.log(error);
        res.json({
            type: 'failure',
            err: 'resendError'
        })
    }
})

router.get('/mentee/complete-profile', authentication, (req, res) => {
    res.send('ask more details') // this is where the page asking to complete profile comes. req has user details which can be used preload parts of form.
})

router.get('/mentee/register', (req, res) => {
    res.render("register") // this is where mentee mentee do registeration and phone verification
})

router.get('/mentee/login', (req, res, next) => {

    if (req.isAuthenticated()) {
        console.log('user aldready authenticated')
        res.redirect('/mentee/home')
    } else {
        return next()
    }
}, (req, res) => {
    res.render('login') // this is the login page

})

router.put('/mentee/profile-complete', authentication, async (req, res) => {
    try {
        var updateQuery = await Mentee.findByIdAndUpdate(req.user._id, {
            profileVerification: true,
            alternatephone: req.body.alternatephone,
            parentname: req.body.parentname,
            parentPhone: req.body.parentphone,
            class: req.body.class,
            lastAttemptJeeYear: req.body.lastAttemptJeeYear,
            lastAttemptJeepercentile: req.body.lastAttemptJeepercentile,
            targetYear: req.body.targetYear,
            modePrepartion: req.body.modePrepartion,
            otherTargetExams: req.body.otherTargetExams,
            firstHear: req.body.firstHear,
            whyWant: req.body.whyWant,
            expectations: req.body.expectations,
            language: req.body.language,
            materialRequirement: req.body.materialRequirement
            // plan: "none",
            // planID: "",
        }
        // ,
        // (err, updated) => {
        //     if (err) {
        //         res.json({
        //             result: 'failure',
        //             err: 'updateFailed'
        //         })
        //     } else {
        //         res.json({
        //             result: 'success'
        //         })
        //     }
        // }
        )
        res.json({
            result: 'success'
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post('/mentee/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) { // critical error 
            // logger.error('err is not null, unknown error occured while logging in',{body:req.body},{info:info},{err:err})
            res.json({
                type: 'failure',
                err: 'errIsNotNull'
            })
        } else {
            if (user) {
                req.logIn(user, error => {
                    if (!error)
                        res.json({
                            type: 'success'
                        })
                    else
                        res.json({
                            type: 'failure',
                            err: 'errorInReq.Login'
                        })
                })
            } else {
                if (info.name == 'IncorrectUsernameError' || info.name == 'IncorrectPasswordError')
                    res.json({
                        type: 'failure',
                        err: 'incorrectCredentials',
                    })
                else {
                    // critical error 
                    // logger.error('unknown error occured while logging in',{body:req.body},{info:info},{err:err})
                    res.json({
                        type: 'failure',
                        err: 'unknown'
                    })
                }
            }
        }
    })(req, res, next)
})

router.post('/mentee/phonelogin', async (req, res, next) => {
    try {
        let ment = await Mentee.findOne({
            phone: req.body.phone
        })
        req.body.email = ment.email
        return next()
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
}, passport.authenticate('local', {
    failureRedirect: '/mentee/login',
    successRedirect: '/mentee/home'
}))

router.post('/mentee/otplogin', async (req, res) => {
    try {
        let response = await msg91otp.verify('+91' + req.body.phone, req.body.otp)
        console.log(response)
        if (response.type == "success") {
            let ment = await Mentee.findOne({
                phone: req.body.phone
            })
            req.logIn(ment, (err)=>{
                if (err) {
                    console.log(err)
                    return res.json({
                        result: "failure",
                        err
                    })
                }
                return res.json({
                    result: "success"
                })
            })
            
        } else {
        return res.json({
            result: "failed verification"
        })
    }
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post("/mentee/login/api/send-otp", async (req, res) => {
    try {
        if (req.body.phone == undefined || req.body.phone.length != 10)
            return res.json({
                result: "form incomplete"
            })
        let ment = await Mentee.findOne({
            phone: req.body.phone
        })
        if (ment) {
            let response = await msg91otp.send('+91' + req.body.phone, {
                otp_expiry: 10
            })
            return res.json({
                result: "success",
                response
            })
        } else {
            return res.json({
                result: "new user"
            })
        }
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post("/mentee/login/api/resend-otp", async (req, res) => {
    try {
        if (req.body.phone == undefined || req.body.phone.length != 10)
            return res.json({
                result: "form incomplete"
            })
        let response = await msg91otp.retry('+91' + req.body.phone, {
            otp_expiry: 10
        })
        return res.json({
            result: "success",
            response
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.get('/mentee/home', authentication, (req, res) => {
    try {
        res.json({
            message: 'id: ' + req.user._id
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.get('/mentee/email/:ver', async (req, res) => {
    try {
        let chk = await jwt.verify(req.params.ver, secret)
        let ment = await Mentee.findByIdAndUpdate(chk.user.id, {
            emailVerification: true
        })
        return res.json({
            result: "success"
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.get('/mentee/logout', (req, res) => {
    try {
        req.logOut();
        res.json({
            message: 'loggedOut'
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})
// I had the option to use passport.authenticate however using that would automatically create user object in the next request which would limit use of the function
router.post('/mentee/profile/is-email-verified', authentication, async (req, res) => {
    try {
        let ment = await Mentee.findById(req.user._id)
        if (ment.emailVerification) {
            res.json({
                result: "authorized"
            })
        } else {
            res.json({
                result: "unauthorized",
            })
        }
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post("/mentee/profile/is-profile-complete", authentication, (req, res) => {
    try {
        if (req.user.profileVerification) {
            res.json({
                result: "authorized"
            })
        } else {
            res.json({
                result: "unauthorized"
            })
        }
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.get("/mentee/dashboard/my-mentor-details", authentication, async (req, res) => {
    try {
        let mentee = await Mentee.findById(req.user._id)
        let mentor = await Mentor.findById(mentee.mentorID)
        if (mentor)
            return res.json({
                mentorName: mentor.name,
                mentorPhone: mentor.phone,
                mentorEmail: mentor.email,
                mentorId: mentor._id,
                result: "success"
            })
        return res.json({
            result: "no mentor"
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.get("/mentee/dashboard/notifications/fetch-all", authentication, async (req, res) => {
    try {
        let ment = await Mentee.findById(req.user._id)
        return res.json({
            result: "success",
            notifications: ment.notifications
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.get("/mentee/create-notifications", authentication, async (req, res) => {
    try {
        var findQuery = await Mentee.findById(req.user._id, async (err, docu) => {
            if (err) {
                res.json({
                    message: "error"
                })
            } else {
                var arr = docu.notifications
                arr.push({
                    title: "hero",
                    description: "Testing",
                    button: "Cool"
                })
                var updateQuery = await Mentee.findByIdAndUpdate(req.user._id, {
                    notifications: arr
                }, (err, call) => {
                    if (err) {
                        res.json({
                            message: "update error"
                        })
                    } else {
                        res.json({
                            message: 'success'
                        })
                    }
                })

            }
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post("/mentee/dashboard/notifications/delete-one", authentication, async (req, res) => {
    try {
        let ment = await Mentee.findById(req.user._id)
        let notifys = ment.notifications
        notifys.id(req.body.notificationid).remove()
        await ment.updateOne({
            notifications: notifys
        })
        return res.json({
            result: "success"
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post("/mentee/dashboard/notifications/mark-as-read", authentication, async (req, res) => {
    try {
        let ment = await Mentee.findById(req.user._id)
        let notifys = ment.notifications
        notifys.id(req.body.notificationid).read = true
        await ment.updateOne({
            notifications: notifys
        })
        return res.json({
            result: "success"
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post("/mentee/submit-feedback", authentication, async (req, res) => {
    try {
        req.body.feedback.menteeId=req.user._id;
        req.body.feedback.mentorId=req.user.mentorID;
        var feedbackCreate = await Feedback.create(req.body.feedback)
        if (!feedbackCreate)
            return res.json({
                result: "error"
            })
        return res.json({
            result: "success"
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post("/mentee/account/change-password", authentication, async (req, res) => {
    try {
        if (req.body.oldPassword == undefined || req.body.newPassword == undefined)
            return res.json({
                result: "form incomplete"
            })
        let ment = await Mentee.findById(req.user._id)
        let newment = await ment.changePassword(req.body.oldPassword, req.body.newPassword)
        if (newment)
            return res.json({
                result: "success"
            })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post("/mentee/dashboard/material-request", authentication, async (req, res) => {
    try {
        if (!req.body.material)
            return res.json({
                result: "form incomplete"
            })
        var requests = req.body.material
        var past = []
        let ment = await Mentee.findById(req.user._id);
        for (let request of requests) {
            if (ment.access.indexOf(request) == -1) {
                let doc = await Request.create({
                    menteeID: req.user._id,
                    material: request,
                })
                await ment.updateOne({
                    $push: {
                        requests: doc._id
                    }
                })
            }
        }
        return res.json({
            result: "success"
        })
    } catch (error) {
        return res.json({
            result: "unexpected error",
            error
        })
    }
})

router.get("/mentee/dashboard/past-material-requests", authentication, async (req, res) => {
    try {
        let detArr = []
        let ment = await Mentee.findById(req.user._id);
        let prev = ment.requests
        for (let request of prev) {
            detArr.push(await Request.findById(request));
        }
        return res.json({
            pastrequest: detArr,
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post("/mentee/helpdesk/new-ticket", authentication, async (req, res) => {
    try {
        if (!req.body.subject && !req.body.description)
            return res.json({
                result: "form incomplete"
            })
        let helpForm = await Help.create({
            menteeID: req.user._id,
            subject: req.body.subject,
            description: req.body.description,
        })
        let ment = await Mentee.findById(req.user._id)
        await ment.updateOne({
            $push: {
                tickets: helpForm._id
            }
        })
        return res.json({
            result: "success"
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.get("/mentee/helpdesk/past-tickets", authentication, async (req, res) => {
    try {
        let ment = await Mentee.findById(req.user._id)
        let helpIDs = ment.tickets
        let detArr = []
        for (let hID of helpIDs) {
            let help = await Help.findById(hID)
            detArr.push(help)
        }
        return res.json({
            pasttickets: detArr,
            result: "success"
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post("/mentee/library/get-access-token", authentication, async (req, res) => {
    try {
        let ment = await Mentee.findById(req.user._id)
        let accessible = ment.access
        if (accessible.indexOf(req.body.material) == -1)
            return res.json({
                result: "forbidden"
            })
        let token = jwt.sign({
            user: req.user._id,
            material: req.body.material
        }, secret, {
            expiresIn: "1hr"
        })
        if (token)
            return res.json({
                result: "success",
                token: token
            })

    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.get("/mentee/library/material/view/:ver", authentication, (req, res) => {
    try {
        let chk = jwt.verify(req.params.ver, secret)
        if (!chk || chk.user != req.user._id)
            return res.json({
                result: "forbidden"
            })
        
        // TODO: send the requested material file to view
        return res.json({
            result: "success",
            material: chk.material
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.get("mentee/library/material/download/:ver", authentication, (req, res) => {
    try {
        let chk = jwt.verify(req.params.ver, secret)
        if (!chk || chk.user != req.user._id)
        return res.json({
            result: "forbidden"
        })
        // TODO: send the requested material file for download
        return res.json({
            result: "success",
            material: chk.material
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.post("/mentee/approve/request", authentication, async (req, res) => {
    try {
        var findQuery = await Mentee.findById(req.user._id, async (error, doc) => {
            if (error) {
                res.json({
                    result: "error",
                })
            } else {
                doc.materialAccess.push(req.body.approve)
                var saver = await doc.save((err) => {
                    if (err) {
                        res.json({
                            result: "error"
                        })
                    } else {
                        res.json({
                            result: "success"
                        })
                    }
                })
            }
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

router.get("/mentee/account/payment-history", authentication, async (req, res) => {
    try {
        var findQuery = await Mentee.findById(req.user._id, (error, doc) => {
            if (error) {
                res.json({
                    result: "error",
                    error
                })
            } else {
                var paymentIDs = doc.payments
                var paymentArr = []
                var len = paymentIDs.length
                var selection = true
                if (len - 1 >= 0) {
                    paymentIDs.forEach(async element => {
                        var helpFind = await Payment.findById(element, (err, det) => {
                            if (err) {
                                selection = false
                                return;
                            } else {
                                paymentArr.push(det)
                            }
                            if (element == paymentIDs[len - 1]) {
                                if (selection) {
                                    res.json({
                                        payments: paymentArr,
                                        result: "success"
                                    })
                                } else {
                                    res.json({
                                        result: "error",
                                        err
                                    })
                                }
                            }
                        })
                    });
                } else {
                    res.json({
                        payments: []
                    })
                }
            }
        })
    } catch (error) {
        res.json({
            result: "unexpected error",
            error
        })
    }
})

function authentication(req, res, next) {
    //console.log('status of authentication is '+req.isAuthenticated)
    if (req.isAuthenticated()) {
        return next()
    } else {
        console.log("unable to authenticate " + req.isAuthenticated())
        res.json({
            type: 'failure',
            err: 'failedAuthentication'
        })
    }
}

const validate = (email) => {
    const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i

    return expression.test(String(email).toLowerCase())
}

async function formFill(req, res, next) {
    try {
        if (typeof (req.body.name) != 'undefined' &&
            typeof (req.body.email) != 'undefined' && validate(req.body.email) &&
            typeof (req.body.password) != 'undefined' &&
            typeof (req.body.phone) != 'undefined' &&
            req.body.phone.length == 10) {
            let mobileSrch = await Mentee.findOne({
                phone: req.body.phone
            })
            if (mobileSrch) {
                console.log("mobile duplicate")
                console.log(mobileSrch)
                return res.json({
                    type: "failure",
                    error: "duplicate mobile"
                })
            }
            let emailSrch = await Mentee.findOne({
                email: req.body.email
            })
            if (emailSrch) {
                console.log("email duplicate")
                console.log(emailSrch)
                return res.json({
                    type: "error",
                    error: "duplicate email"
                })
            }
            console.log("verified form")
            return next()
        } else if (req.body.phone.length != 10) {
            console.log('wrong number');
            return res.json({
                type: 'failure',
                err: 'invalidNumber'
            })
        } else {
            console.log('form incomplete');
            return res.json({
                type: 'failure',
                err: "incomplete"
            })
        }
    } catch (error) {
        res.json({
            type: "error in form",
            err: error
        })
    }
}
// when actually implementing on website remember to change local host to website name
module.exports = router