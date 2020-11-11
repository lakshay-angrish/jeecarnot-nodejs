// const jwt = require('jsonwebtoken')

// let actions = {
//     sendVerificationEmail:async (user,senderEmail) => {
//         let token= jwt.sign({user},'tobechanged', {expiresIn: '24h'})
//         var link = 'localhost:3333/mentee/email/'+token
//         var emailData = {
//             from: senderEmail,
//             to: user.email,
//             subject:  'Verify your Email',
//             html: '<h1>Welcome to JEE CARNOT</h1><br><p>to verify your email pls click on link below</p><br><a href='+link+'>Verify Your Email</a>'
//         }
//         mg.messages().send(emailData, function (error, body) {
//             if (error) {
//                 console.log(error)
//             } else {
//                 console.log(body)
//             } 
//         });

// },

// }

require('dotenv').config()
const msg91OTP = require('msg91-lib').msg91OTP;
const jwt = require('jsonwebtoken');
const msg91otp = new msg91OTP({
    authKey: process.env.MSG91_AUTH,
    templateId: process.env.MSG91_TEMPLATE
})

let number='9671099771'
let otp='5705'
async function send() {
    try {
        const response = await msg91otp.send('+91' + number, {otp_expiry: 1})
        console.log('RES:',response)
    } catch (error) {
        console.log('ERR',error);
    }
}
async function retry() {
    try {
        const response = await msg91otp.retry("+91" + number);
        console.log('RES:',response)
    } catch (error) {
        console.log('ERR',error);

        // OTP COUNT MAXED
    }
}
async function verify() {
    try {
        const response = await msg91otp.verify('+91' + number, otp)
        console.log('RES:',response)
    } catch (error) {
        console.log('ERR',error);
    }
}

retry()
// actions.sendVerificationEmail({email:'nagino5075@mailpkc.com',id:'5f5dda6ed43adf2c749c97a2'},'JEECarnot <no-reply-test@carnot-test.com>')
