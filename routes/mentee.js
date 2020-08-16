const { render }          = require('ejs')
const router              = require('express').Router()
const msg91OTP            = require('msg91-lib').msg91OTP ;
const msg91otp            = new msg91OTP({
    authKey: "338499A89m6vbGDkHw5f37897eP1",
    templateId: "5f379520d6fc0554d25f1b63"
})
var http                  = require('https')
var passport              = require("passport")
var localStrategy         = require('passport-local')
var localMongooseStrategy = require('passport-local-mongoose')
var Mentee                = require('../models/mentee') // i have added extra field of plan ID which would be unique to each transaction (can be transaction id)
var mongoose              = require('mongoose')
var mongoDB               = "mongodb://localhost:27017/carnot"
mongoose.connect(mongoDB, {useUnifiedTopology:true ,useNewUrlParser: true})
var db                    = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
router.use(require("express-session")({
    secret: "secret handler",
    resave: false,
    saveUninitialized: false
}))
router.use(passport.initialize())
router.use(passport.session())
passport.use(new localStrategy(Mentee.authenticate()))
passport.serializeUser(Mentee.serializeUser())
passport.deserializeUser(Mentee.deserializeUser())


router.post('/mentee/register/otp',async function(req, res) {
    number = req.body.phone
    console.log(number)
    console.log(req)
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
    console.log(response)  
})


router.post('/mentee/register/verify', async (req, res) => {
    
    try {
        const response= await msg91otp.verify('+91'+req.body.phone, req.body.otp)
        if (response.type=='success') {
            Mentee.register(new Mentee({
                name: req.body.name,
                username: req.body.email,
                phone: req.body.phone,
            }),
            req.body.password, function(err, newMentee) {
                if (err) {
                    res.redirect('/mentee/register')
                } else {
                    res.redirect('/mentee/'+newMentee._id+'/profile-complete')
                }
            })
        } else {
            res.json({
                message:'failure'
            })
        }
      } catch (error) {
        console.log(error.toJson());
        res.redirect('/mentee/register')
      }
    
})


router.post('/mentee/register/resend',async (req, res)=> {
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
})
 // throughout the code i will be treating email as the username for simplicity purposes

router.get('/mentee/:id/profile-complete', (req, res)=> {
    if (req.isAuthenticated) {
        res.send('ask more details') // this is where the page asking to complete profile comes. req has user details which can be used preload parts of form.
    }
})


router.get('/mentee/register', (req, res) =>{
    res.send('this is mentee registeration page') // this is where mentee mentee do registeration and phone verification
})


router.get('/mentee/login', (req, res)=> {
    if (req.isAuthenticated) {
        res.redirect('/mentee/'+req.user._id+'/home') // this is the home page unique to each student
    } else {
        res.send('login') // this is the login page
    }
})

router.put('/mentee/:id/profile-complete', (req, res) => {
    req.body.info.plan = 'none' // Just to ensure that someone does not pass in plan as data in req
    Mentee.findByIdAndUpdate(req.params.id, req.body.info, (err, updated)=> {
        if (err) {
            res.redirect('/mentee/'+req.params.id+'/profile-complete')
        } else {
            res.redirect('/mentee/:id/payments')
        }
    })
})
router.post('/mentee/login', passport.authenticate('local', {
    successRedirect: '/mentee/login',
    failureRedirect: '/mentee/login'
}))

module.exports = router