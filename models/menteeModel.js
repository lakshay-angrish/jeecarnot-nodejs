var mongoose = require("mongoose")
var passportLocalMongoose = require("passport-local-mongoose")

var MenteeSchema = mongoose.Schema({
    name: String,
    password: String,
    username: String,
    phone: String,
    emailVerification: {
        type: Boolean,
        default: false
    },
    alternatephone: {
        type: String,
        default: ''
    },
    parentname: {
        type: String,
        default: ''
    },
    parentPhone: {
        type: String,
        default: ''
    },
    class: {
        type: String,
            default: ''
    },
    lastAttemptJeeYear: {
        type: String,
        default: ''
    },
    lastAttemptJeepercentile: {
        type: String,
        default: ''
    },
    targetYear: {
        type: String,
        default: ''
    },
    modePreparation: {
        type: String,
        default: 'self'
    },
    otherTargetExams: {
        type: String,
        default: ''
    },
    firstHear: {
        type: String,
        default: ''
    },
    whyWant: {
        type: String,
        default: ''
    },
    expectations: {
        type: String,
        default: ''
    },
    language: {
        type: String,
        default: 'english'
    },
    plan: {
        type: String,
        default: 'none'
    },
    planID: {
        type: String,
        default: 'none'
    }
})

MenteeSchema.plugin(passportLocalMongoose, {usernameField: 'email'})

module.exports = mongoose.model('Mentee', MenteeSchema)