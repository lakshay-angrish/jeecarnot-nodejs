require('dotenv').config()
//console.log(process.env) // only to verify
const {
    render
} = require('ejs')
const express = require('express')
require('dotenv').config()
const router = require('express').Router()
var mongoose = require("mongoose")
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
var request = require('request')
var http = require('https')
var passport = require("passport")
var localStrategy = require('passport-local')
var customStrategy = require('passport-custom')
var localMongooseStrategy = require('passport-local-mongoose')
var Mentee = require('../models/menteeModel') // i have added extra field of plan ID which would be unique to each transaction (can be transaction id)
var mongoose = require('mongoose');
var Notifications = require("../models/notificationModel.js")
const {
    assert
} = require('console');
var mongoDB = "mongodb://localhost:27017/carnot"
router.use(bodyparser.urlencoded({
    extended: true
}))
mongoose.connect(mongoDB, {
    useUnifiedTopology: true,
    useNewUrlParser: true
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
        //const response = await msg91otp.verify('+91' + req.body.phone, req.body.otp)
        //if (response.type == 'success') {
        if (true) { // for testing purposes use this if loop.
            console.log(req.body.email)
            Mentee.register(new Mentee({
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                }),
                req.body.password,
                function (err, newMentee) {
                    if (err) {
                        console.log(err)
                        res.json({
                            type: 'failure',
                            err: 'errorRegistering'
                        })
                    } else {
                        console.log(newMentee)
                        console.log('redirecting to: ' + '/mentee/' + newMentee._id.toString() + '/profile-complete')
                        var user = {
                            email: newMentee.email,
                            id: newMentee._id
                        }
                        console.log('now entering jwt loop')
                        jwt.sign({
                            user
                        }, secret, {
                            expiresIn: '24h'
                        }, (err, token) => {
                            console.log('entered jwt loop')
                            if (err) {
                                console.log('encountered error')
                                console.log(err)
                            } else {
                                console.log('no error 1')
                                var link = 'localhost:3333/mentee/email/' + token.toString()
                                var emailData = {
                                    from: senderEmail,
                                    to: user.email,
                                    subject: 'Verify your Email',
                                    html: '<h1>Welcome to JEE CARNOT</h1><br><p>to verify your email pls click on link below</p><br><a href=' + link + '>Verify Your Email</a>'
                                }
                                mg.messages().send(emailData, function (error, body) {
                                    if (error) {
                                        console.log(error)
                                    } else {
                                        console.log(body)
                                    }
                                });
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
            type: 'success'
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

router.put('/mentee/profile-complete', authentication, (req, res) => {
    req.body.plan = 'none' // Just to ensure that someone does not pass in plan as data in req
    req.body.planID = ""
    Mentee.findByIdAndUpdate(req.user._id, req.body, (err, updated) => {
        if (err) {
            res.json({
                result: 'failure',
                err: 'updateFailed'
            })
        } else {
            updated.profileVerification = true;
            updated.save((err)=> {
                if (err) {
                    res.json({
                        result: "failure",
                        err: "updateFailed"
                    })
                } else {
                    res.json({
                        result: 'success'
                    })
                }
            })
        }
    })
})

router.post('/mentee/login', passport.authenticate('local', {
    failureRedirect: '/mentee/login'
}), (req, res) => {
    if (typeof (req.user) != 'undefined') {
        console.log("successful login")
        res.json({
            type: 'success'
        })
    } else {
        console.log('req user is undefined')
        res.json({
            type: 'failure',
            err: 'userUndefined'
        })
    }
})

router.post('/mentee/phonelogin', (req, res, next) => {
    if (req.body.phone != undefined && req.body.password != undefined) {
        Mentee.findOne({
            phone: req.body.phone
        }, (err, ment) => {
            if (err) {
                res.json({
                    type: 'failure',
                    err: err
                })
            } else if (ment) {
                req.body.email = ment.email
                return next()
            }
        })
    } else {
        res.json({
            type: 'failure',
            err: 'incomplete'
        })
    }
}, passport.authenticate('local', {
    failureRedirect: '/mentee/login',
    successRedirect: '/mentee/home'
}))

router.post('/mentee/otplogin', async (req, res) => {
    console.log(req.body.phone)
    console.log(req.body.phone != undefined)
    console.log(req.body.phone.length)
    if (req.body.phone != undefined && req.body.phone.length == 10) {
        var response;
        try {
            response = await msg91otp.verify('+91' + req.body.phone, req.body.otp)
            if (response.type == 'success') {
                Mentee.findOne({
                    phone: req.body.phone
                }, (err, user) => {
                    console.log(user)
                    console.log(err)
                    if (err) {
                        console.log(err)
                        res.json({
                            type: 'failure',
                            err: err
                        })
                    } else if (user) {
                        console.log(user)
                        req.logIn(user, (erri) => {
                            if (erri) {
                                console.log(erri)
                            }
                        })
                        res.json({
                            type: 'success'
                        })
                    } else {
                        res.json({
                            type: "failure",
                            err: 'undefinedUser'
                        })
                    }
                })
            }
        } catch (error) {
            console.log(error);
            res.json({
                type: 'failure',
                err: 'failedVerification'
            })
        }

    } else {
        res.send('form incomplete')
    }
})

router.post("/mentee/login/api/send-otp", async (req, res) => {
    if (req.body.phone != undefined && req.body.phone.length == 10) {
        var response;
        Mentee.findOne({
            phone: req.body.phone
        }, async (err, res) => {
            if (err) {
                console.log(err);
                res.json({
                    type: 'failure',
                    err: err
                })
            } else if (res == null) {
                res.json({
                    type: 'failure',
                    err: 'noNumberInData'
                })
            } else {
                try {
                    response = await msg91otp.send('+91' + req.body.phone, {
                        otp_expiry: 10
                    })
                    if (response.type == 'success') {
                        res.json({
                            type: 'success',
                            response
                        })
                    }
                } catch (e) {
                    console.log(e)
                    response = e
                    res.json({
                        type: 'failure',
                        err: response
                    })
                }
            }
        })
    } else {
        res.json({
            type: 'failure',
            err: 'incompleteForm'
        })
    }
})

router.post("/mentee/login/api/resend-otp", async (req, res) => {
    if (req.body.phone != undefined && req.body.phone.length == 10) {
        try {
            var response = await msg91otp.retry('+91' + req.body.phone, {
                otp_expiry: 10
            })
            res.json({
                type: 'success',
                err: response
            })
        } catch (e) {
            console.log(e)
            res.json({
                type: 'failure',
                err: e
            })
        }
    } else {
        res.json({
            type: 'failure',
            err: 'incompleteForm'
        })
    }
})

router.get('/mentee/home', authentication, (req, res) => {
    res.json({
        message: 'id: ' + req.user._id
    })
})

router.get('/mentee/email/:ver', (req, res) => {
    jwt.verify(req.params.ver, secret, (err, authData) => {
        if (err) {
            res.send("Unable to verify try again")
        } else {
            Mentee.findByIdAndUpdate(authData.user.id, {
                emailVerification: true
            }, (err, updated) => {
                if (err) {
                    res.send("Unable to verify try again")
                } else {
                    res.send('verified email thank you')
                }
            })
        }
    })
})

router.get('/mentee/logout', (req, res) => {
    req.logOut();
    res.json({
        message: 'loggedOut'
    })
})
// I had the option to use passport.authenticate however using that would automatically create user object in the next request which would limit use of the function
router.post('/mentee/profile/is-email-verified', authentication, (req, res) => {
    if (req.user.emailVerification) {
        res.json({
            result: "authorized"
        })
    } else {
        res.json({
            result: "unauthorized"
        })
    }
})

router.post("/mentee/profile/is-profile-complete", authentication, (req, res) => {
    if (req.user.profileVerification) {
        res.json({
            result: "authorized"
        })
    } else {
        res.json({
            result: "unauthorized"
        })
    }
})

router.get("/mentee/dashboard/notifications/fetch-all", authentication, (req, res) => {
    Mentee.findById(req.user._id, (err, docu) => {
        if (err) {
            res.json({
                message: "Error Encountered"
            })
        } else {
            res.json({
                notif: docu.notifications
            })
        }
    })
})

router.get("/mentee/create-notifications", authentication, (req, res) => {
    Mentee.findById(req.user._id, (err, docu) => {
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
            Mentee.findByIdAndUpdate(req.user._id, {
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
})

router.post("/mentee/dashhboard/notifications/delete-one", authentication, (req, res) => {
    Mentee.findById(req.user._id, (err, docu) => {
        if (err) {
            res.json({
                message: "failed"
            })
        } else {
            docu.notifications.id(req.body.notificationid).remove()
        }
        docu.save((err) => {
            if (err) {
                res.json({
                    message: "save error"
                })
            } else {
                res.json({
                    message: "success"
                })
            }
        })
    })
})

router.post("/mentee/dashhboard/notifications/mark-as-read", (req, res) => {
    Mentee.findById(req.user._id, (err, docu) => {
        if (err) {
            res.json({
                message: "failed"
            })
        } else {
            docu.notifications.id(req.body.notificationid).read = true
        }
        docu.save((err) => {
            if (err) {
                res.json({
                    message: "save error"
                })
            } else {
                res.json({
                    message: "success"
                })
            }
        })
    })
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

function formFill(req, res, next) {
    if (typeof (req.body.name) != 'undefined' &&
        typeof (req.body.email) != 'undefined' && validate(req.body.email) &&
        typeof (req.body.password) != 'undefined' &&
        typeof (req.body.phone) != 'undefined' &&
        req.body.phone.length == 10) {
        Mentee.findOne({
            phone: req.body.phone
        }, (err, found) => {
            if (err) {
                console.log('encountered an error')
                console.log(err)
                res.json({
                    type: 'failure',
                    err: 'unknown 1'
                })
            } else if (found) {
                console.log('aldready registered')
                res.json({
                    type: 'failure',
                    err: 'duplicateMobile'
                })
            }
        })
        Mentee.findOne({
            email: req.body.email
        }, (err, fnd) => {
            if (err) {
                res.json({
                    type: 'failure',
                    err: 'unknown 2'
                })
            } else if (fnd) {
                res.json({
                    type: 'failure',
                    err: 'duplicateEmail'
                })
            } else {
                return next()
            }
        })
    } else if (req.body.phone.length != 10) {
        console.log('wrong number');
        res.json({
            type: 'failure',
            err: 'invalidNumber'
        })
    } else {
        console.log('form incomplete');
        res.json({
            type: 'failure',
            err: "incomplete"
        })
    }
}
// when actually implementing on website remember to change local host to website name
module.exports = router