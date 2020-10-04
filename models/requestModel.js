var mongoose = require("mongoose")
var requestSchema = mongoose.Schema({
    requestjwt: {
        type: String,
        default: ""
    },
    material: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: ""
    },
})
module.exports = requestSchema