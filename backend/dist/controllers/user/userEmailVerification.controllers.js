"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEmailVerificationOTP = handleEmailVerificationOTP;
exports.handleResendVerficationOTPFunction = handleResendVerficationOTPFunction;
const mailer_1 = require("../../helpers/mailer");
const User_model_1 = __importDefault(require("../../models/User.model"));
async function handleEmailVerificationOTP(req, res) {
    try {
        const { otp, email } = req.body;
        console.log(`🔍 Verifying OTP - Email: ${email}, OTP Received: ${otp}`);
        const user = await User_model_1.default.findOne({ email: email });
        if (!user) {
            console.log(`❌ User not found: ${email}`);
            return res
                .status(400)
                .json({ success: false, message: "user doesn't exists" });
        }
        console.log(`📝 Stored OTP: ${user?.emailVerificationOTP}, Received OTP: ${otp}`);
        const storedOtp = user?.emailVerificationOTP ? user.emailVerificationOTP.toString().trim() : "";
        const receivedOtp = otp ? otp.toString().trim() : "";
        // Check expiry if present
        if (user?.emailVerificationOTPExpires) {
            const expires = new Date(user.emailVerificationOTPExpires).getTime();
            if (!isNaN(expires) && Date.now() > expires) {
                console.log(`⏰ OTP expired for ${email}`);
                return res.status(400).json({ success: false, message: "OTP expired" });
            }
        }
        if (storedOtp !== receivedOtp) {
            console.log(`❌ OTP Mismatch! Stored: ${storedOtp} (string), Received: ${receivedOtp} (string)`);
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }
        console.log(`✅ OTP Verified Successfully!`);
        const userId = user._id;
        const updateUseremailVerificationStatus = await User_model_1.default.findByIdAndUpdate(userId, {
            $set: {
                emailVerificationStatus: true,
            },
            $unset: {
                emailSendTime: "",
                emailVerificationOTP: "",
                emailVerificationOTPExpires: "",
            },
        });
        await updateUseremailVerificationStatus.save();
        return res
            .status(200)
            .json({ success: true, message: "OTP verified successfully" });
    }
    catch (error) {
        console.error("Error in OTP verification:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
}
async function handleResendVerficationOTPFunction(req, res) {
    try {
        const { email } = req.body;
        const user = await User_model_1.default.findOne({ email: email });
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "user doesn't exists" });
        }
        if (user && user.emailVerificationStatus) {
            return res
                .status(400)
                .json({ success: false, message: "email already Verified exists" });
        }
        if (user?.emailSendTime) {
            const emailTime = Number(user.emailSendTime);
            const currentTime = Date.now();
            const remainingTime = emailTime - currentTime;
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
            if (remainingTime > 0) {
                return res.status(404).json({
                    success: false,
                    message: `try after ${minutes}min ${seconds}s`,
                });
            }
        }
        await (0, mailer_1.sendEmailVerification)(user.email, user._id);
        return res
            .status(200)
            .json({ message: "verification mail send successfully", success: true });
    }
    catch (error) {
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
}
