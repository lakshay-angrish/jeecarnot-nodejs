var mongoose = require("mongoose")
var passportLocalMongoose = require("passport-local-mongoose")
var MentorSchema = mongoose.Schema({
    name: String,
    password: String,
    username: String,
    phone: String,
    whatsapp: String
})
MenteeSchema.plugin(passportLocalMongoose, {
    usernameField: 'email'
})

module.exports = mongoose.model('Mentor', MenteeSchema)