// models/VerificationCode.js
const mongoose = require('mongoose')

const VerificationCodeSchema = new mongoose.Schema({
    emailOrPhone: String,
    code: String,
    expiresAt: Date
})

module.exports = mongoose.model('VerificationCode', VerificationCodeSchema)
