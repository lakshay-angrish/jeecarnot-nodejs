require('dotenv').config()
//console.log(process.env) // only to verify
const { render }          = require('ejs')
const express             = require('express')
const router              = require('express').Router()
var mongoose              = require("mongoose")
var bodyparser            = require("body-parser")
const msg91OTP            = require('msg91-lib').msg91OTP ;
const jwt                 = require('jsonwebtoken');
const msg91otp            = new msg91OTP({
                                authKey: process.env.MSG91_AUTH,
                                templateId: process.env.MSG91_TEMPLATE
                            })
const secret              = process.env.secret_json
const mailgun             = require("mailgun-js");
const DOMAIN              = 'jeecarnot.com';
const mg                  = mailgun({
                                apiKey: process.env.MAILGUN_API,
                                domain: DOMAIN
                            });
var senderEmail           = 'JEECarnot <no-reply-test@carnot-test.com>'
var request               = require('request')
var flash                 = require('connect-flash')
var http                  = require('https')
var passport              = require("passport")
var localStrategy         = require('passport-local')
var localMongooseStrategy = require('passport-local-mongoose')
var Mentee                = require('../models/menteeModel') // i have added extra field of plan ID which would be unique to each transaction (can be transaction id)
var verificationSchema    = mongoose.Schema({
                                user: String
                            })
var Verification          = mongoose.model('Verification', verificationSchema)
var mongoose              = require('mongoose');
const { assert }          = require('console');
var mongoDB               = "mongodb://localhost:27017/carnot"
router.use(bodyparser.urlencoded({extended: true}))
mongoose.connect(mongoDB, {useUnifiedTopology:true ,useNewUrlParser: true})
var db                    = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
router.use(express.static('public'))
router.use(require("express-session")({
    secret: "secret handler",
    resave: false,
    saveUninitialized: false
}))
router.use(passport.initialize())
router.use(passport.session())
passport.use(new localStrategy(Mentee.authenticate()))
passport.serializeUser(Mentee.serializeUser(function(user, done) {
    done(null, user.id)
}))
passport.deserializeUser(Mentee.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user)
    })
}))
router.use(flash())


var _id=null;  // this will store current id after login or signup for the session. 
router.post('/mentee/register/otp',async function(req, res) {
    if (typeof(req.body.name)!='undefined'
    && typeof(req.body.email)!='undefined'
    && typeof(req.body.password)!='undefined'
    && typeof(req.body.phone)!='undefined') {
        number = req.body.phone
        const response = await msg91otp.send('+91'+number)  
        if (response.type=='success') {
            res.json({
                message: 'success',
            })
        } else {
            res.json({
                message:'failure'
            })
        }
    } else {
        res.send('form incomplete')
    }
})

router.post('/mentee/register/verify', async (req, res) => {
    if (typeof(req.body.name)!='undefined'
    && typeof(req.body.email)!='undefined'
    && typeof(req.body.password)!='undefined'
    && typeof(req.body.phone)!='undefined') {
        try {
            //const response= await msg91otp.verify('+91'+req.body.phone, req.body.otp)
            
            if (response.type=='success') {
         // if (true) {
                Mentee.register(new Mentee({
                    name: req.body.name,
                    username: req.body.email,
                    phone: req.body.phone,
                }),  
                req.body.password, function(err, newMentee) {
                    if (err) {
                        console.log(err)
                        res.redirect('/mentee/register')
                    } else {
                        console.log(newMentee)
                        console.log('redirecting to: '+'/mentee/'+newMentee._id.toString()+'/profile-complete')
                        _id = newMentee._id.toString()
                        req.flash('id', newMentee._id.toString())
                        var user = {
                            email: newMentee.username,
                            id: newMentee._id
                        }
                        console.log('now entering jwt loop')
                        jwt.sign({user}, secret, {expiresIn: '24h'}, (err, token) => {
                            console.log('entered jwt loop')
                            if (err) {
                                console.log('encountered error')
                                console.log(err)
                            }
                            else {
                                console.log('no error 1')
                                var link = 'localhost:3333/mentee/email/'+token.toString()
                                var emailData = {
                                    from: senderEmail,
                                    to: user.email,
                                    subject:  'Verify your Email',
                                    html: '<h1>Welcome to JEE CARNOT</h1><br><p>to verify your email pls click on link below</p><br><a href='+link+'>Verify Your Email</a>'
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

                        res.redirect('/mentee/profile-complete')
                    }
                })
            } else {
                res.json({
                    message:'failure'
                })
            }
        } catch (error) {
            console.log(error);
            res.redirect('/mentee/register')
        }
    } else {
        res.redirect('/mentee/register')
    }
    
})

router.post('/mentee/register/resend',async (req, res)=> {
    if (typeof(req.body.name)!='undefined'
    && typeof(req.body.email)!='undefined'
    && typeof(req.body.password)!='undefined'
    && typeof(req.body.phone)!='undefined') {
        const response = await msg91otp.retry("+91"+req.phone);
        if (response.message=='success') {
            res.json({
                message: 'success'
            })
        } else {
            res.json({
                message: 'error'
            })
        }
    }
})
 // throughout the code i will be treating email as the username for simplicity purposes
router.get('/mentee/profile-complete', authentication, (req, res)=> {
        res.send('ask more details') // this is where the page asking to complete profile comes. req has user details which can be used preload parts of form.
    
})

router.get('/mentee/register', (req, res) =>{
    res.send('this is mentee registeration page') // this is where mentee mentee do registeration and phone verification
})

router.get('/mentee/login', (req, res)=> {
        res.send('login') // this is the login page
    
})

router.put('/mentee/profile-complete',authentication, (req, res) => {
    var tmp_id = req.flash('id')[0]
    req.body.info.plan = 'none' // Just to ensure that someone does not pass in plan as data in req
    Mentee.findByIdAndUpdate(tmp_id, req.body.info, (err, updated)=> {
        if (err) {
            req.flash('id', tmp_id)
            res.redirect('/mentee/profile-complete')
        } else {
            req.flash('id', tmp_id)
            res.redirect('/mentee/payments')
        }
    })
})
// remember email field of mentee login must be named username and not email
router.post('/mentee/login', passport.authenticate('local', {failureRedirect: '/mentee/login'}), (req, res) => {
    if (typeof(req.user) !='undefined') {
        _id = req.user._id.toString()
        req.flash('id', req.user._id.toString())
        res.redirect('/mentee/email-verification')
    } 
        
})

router.get('/mentee/home', authentication, (req, res)=> {

    var tmp_id = req.flash('id')[0]
    res.send('student home with id: '+tmp_id)
})

router.get('/mentee/email/:ver', (req, res) => {
    jwt.verify(req.params.ver, secret, (err, authData) => {
        if (err) {
            res.send("Unable to verify try again")
        } else {
            Mentee.findByIdAndUpdate(authData.user.id, {emailVerification: true}, (err, updated) => {
                if (err) {
                    res.send("Unable to verify try again")
                } else {
                    res.send('verified email thank you')
                }

            })
        }
    })
})

// I had the option to use passport.authenticate however using that would automatically create user object in the next request which would limit use of the function
function authentication(req, res, next) {
    //console.log('status of authentication is '+req.isAuthenticated)
    if (req.isAuthenticated) {
        return next()
    } else {
        res.redirect('/mentee/login')
    }
}
// when actually implementing on website remember to change local host to website name
function emailVerification(data) {
    var user = {
        email: data.username,
        id: data._id
    }
    jwt.sign({user}, secret, {expiresIn: '24h'}, (err, token) => {
        if (err) {
            console.log(err)
            return -1
        }
        var link = 'localhost:3333/mentee/email/'+token.toString()
        var emailData = {
            from: senderEmail,
            to: email,
            subject:  'Verify your Email',
            html: '<h1>Welcome to JEE CARNOT</h1><br><p>to verify your email pls click on link below</p><br><a href='+link+'>Verify Your Email</a>'
        }
        mg.messages().send(emailData, function (error, body) {
            if (error) {
                console.log(error)
                return -2
            } else {
                console.log(body);
                return 1
            } 
        });
    })
}
module.exports = router