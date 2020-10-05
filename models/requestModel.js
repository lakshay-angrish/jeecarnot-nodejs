var mongoose = require("mongoose")
var requestSchema = mongoose.Schema({
    menteeID: {
        type: String,
        default: ""
    },
    material: [String],
    status: {
        type: String,
        default: "0"
    },
})
module.exports = mongoose.model("Request", requestSchema)