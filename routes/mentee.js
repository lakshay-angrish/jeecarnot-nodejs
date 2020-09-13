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
passport.serializeUser(Mentee.serializeUser(function(user, done) {
    done(null, user.id)
}))
passport.deserializeUser(Mentee.deserializeUser(function (id, done) {
    User.findById(id, function(err, user) {
        done(err, user)
    })
}))

router.post('/mentee/register', formFill, async function (req, res) {
    try {
        var number = req.body.phone
        //console.log(number.length)
        const response = await msg91otp.send('+91' + number, {
            otp_expiry: 10
        })
        if (response.type == 'success') {
            res.json({
                message: 'success',
            })
        } else {
            res.json({
                message: 'failure'
            })
        }
    } catch (err) {
        console.log("error in try");
        res.json({
            message: "error in TRY"
        })
    }
})

router.post('/mentee/register/verify', formFill, async (req, res) => {
    try {
        const response = await msg91otp.verify('+91' + req.body.phone, req.body.otp)
        if (response.type == 'success') {
            //if (true) { // for testing purposes use this if loop.
            Mentee.register(new Mentee({
                    name: req.body.name,
                    username: req.body.email,
                    phone: req.body.phone,
                }),
                req.body.password,
                function (err, newMentee) {
                    if (err) {
                        console.log(err)
                        res.redirect('/mentee/register')
                    } else {
                        console.log(newMentee)
                        console.log('redirecting to: ' + '/mentee/' + newMentee._id.toString() + '/profile-complete')
                        var user = {
                            email: newMentee.username,
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
                        res.redirect('/mentee/profile-complete')
                    }
                })
        } else {
            res.json({
                message: 'failure'
            })
        }
    } catch (error) {
        console.log(error);
        res.redirect('/mentee/register')
    }
})

router.post('/mentee/register/resend', formFill, async (req, res) => {
    try {
        const response = await msg91otp.retry("+91" + req.body.phone);
        res.json({
            message: response.message
        })
    } catch (error) {
        console.log(error);
        res.json({
            message: 'error in TRY'
        })
    }
})
// throughout the code i will be treating email as the username for simplicity purposes
router.get('/mentee/profile-complete', authentication, (req, res) => {
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
    req.body.info.plan = 'none' // Just to ensure that someone does not pass in plan as data in req
    Mentee.findByIdAndUpdate(req.user._id, req.body.info, (err, updated) => {
        if (err) {
            res.redirect('/mentee/profile-complete')
        } else {
            res.redirect('/mentee/payments')
        }
    })
})
// remember email field of mentee login must be named username and not email
router.post('/mentee/login', passport.authenticate('local', {
    failureRedirect: '/mentee/login'
}), (req, res) => {
    if (typeof (req.user) != 'undefined') {
        console.log("successful login")
        res.redirect('/mentee/home')
    } else {
        console.log('req user is undefined')
        res.redirect('/mentee/login')
    }

})

router.post('/mentee/phonelogin', (req, res, next)=> {
    if (req.body.phone!=undefined && req.body.password!=undefined) {
        Mentee.findOne({phone: req.body.phone}, (err, ment)=> {
            if (err) {
                res.json({
                    err
                })
            } else if (ment) {
                req.body.username = ment.username
                return next()
            }
        })
    } else {
        res.send('incomplete form')
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
        if (req.body.otp != undefined) {
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
                        } else if (user) {
                            console.log(user)
                            req.logIn(user, (erri) => {
                                if (erri) {
                                    console.log(erri)
                                }
                            })
                        }
                        res.redirect('/mentee/home')
                    })
                }
            } catch (error) {
                console.log(error);
                res.send(error.message)
            }
        } else if (req.body.retry != undefined) { // retry can be a bool 
            console.log(req.body.resend)
            try {
                var response = await msg91otp.retry('+91' + req.body.phone, {
                    otp_expiry: 10
                })
                res.json({
                    message: 'resent success',
                    response
                })
            } catch (e) {
                console.log(e)
                res.send(e.message)
            }
            
        } else {
            var response;
            try {
                response = await msg91otp.send('+91' + req.body.phone, {
                    otp_expiry: 10
                })
            } catch (e) {
                console.log(e)
                response = e
            }
            res.json({
                message: 'sent otp',
                response
            })
        }   
    } else {
        res.send('form incomplete')
    }
})

router.get('/mentee/home', authentication, (req, res) => {
    res.send('student home with id: ' + req.user._id)
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
    res.redirect('/')
})
// I had the option to use passport.authenticate however using that would automatically create user object in the next request which would limit use of the function
function authentication(req, res, next) {
    //console.log('status of authentication is '+req.isAuthenticated)
    if (req.isAuthenticated()) {
        return next()
    } else {
        console.log("unable to authenticate " + req.isAuthenticated())
        res.redirect('/mentee/login')
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
                res.redirect('/mentee/register')
            } else if (found) {
                console.log('aldready registered')
                res.send('aldready registered')
            }
        })
        Mentee.findOne({
            username: req.body.email
        }, (err, fnd) => {
            if (err) {
                console.log('encountered unexpected error')
            } else if (fnd) {
                res.send('email aldready registered')
            } else {
                return next()
            }
        })
    } else if (req.body.phone.length != 10) {
        console.log('wrong number');
        res.json({
            message: 'wrong number'
        })
    } else {
        console.log('form incomplete');
        res.json({
            message: 'incomplete form'
        })
    }
}
// when actually implementing on website remember to change local host to website name
module.exports = router