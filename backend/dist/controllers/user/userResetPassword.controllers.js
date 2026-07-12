"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleResetPasswordFunction = handleResetPasswordFunction;
exports.handleResetPasswordVerificationOTP = handleResetPasswordVerificationOTP;
const User_model_1 = __importDefault(require("../../models/User.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const checkAuthConstraints_1 = require("../../validchecks/checkAuthConstraints");
const mailer_1 = require("../../helpers/mailer");
async function handleResetPasswordFunction(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res
                .status(400)
                .json({ success: false, message: "Email is required" });
        }
        const user = await User_model_1.default.findOne({ email: email });
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "User does not exist with this email" });
        }
        // Remove email verification check - allow password reset for unverified emails too
        if (user && user.passwordSendTime) {
            const emailTime = Number(user.passwordSendTime);
            const currentTime = Date.now();
            const remainingTime = emailTime - currentTime;
            if (remainingTime > 0) {
                const hours = Math.floor(remainingTime / (1000 * 60 * 60));
                const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
                return res.status(429).json({
                    success: false,
                    message: `Please try again after ${hours} hours ${minutes} minutes ${seconds} seconds`,
                });
            }
        }
        await (0, mailer_1.sendResetPasswordVerification)(user.email, user._id);
        return res
            .status(200)
            .json({ message: "Password reset OTP sent successfully to your email", success: true });
    }
    catch (error) {
        console.error("Error in handleResetPasswordFunction:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
}
async function handleResetPasswordVerificationOTP(req, res) {
    try {
        const { otp, newPassword, email } = req.body;
        if (!otp || !newPassword || !email) {
            return res
                .status(400)
                .json({ success: false, message: "All fields are required: otp, newPassword, email" });
        }
        const isValidPassword = (0, checkAuthConstraints_1.checkPasswordConstraints)(newPassword);
        if (!isValidPassword) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Invalid password format. Password must be at least 8 characters with uppercase, lowercase, number, and special character"
            });
        }
        const user = await User_model_1.default.findOne({ email, passwordResetOTP: otp });
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid OTP or email address" });
        }
        if (user && user.passwordResetOTPExpires) {
            const emailTime = Number(user.passwordResetOTPExpires);
            const currentTime = Date.now();
            const remainingTime = emailTime - currentTime;
            if (remainingTime < 0) {
                return res.status(400).json({ success: false, message: "OTP has expired. Please request a new OTP" });
            }
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await User_model_1.default.findByIdAndUpdate(user._id, {
            $set: {
                password: hashedPassword,
            },
            $unset: {
                passwordResetOTP: "",
                passwordResetOTPExpires: "",
                passwordSendTime: "",
            },
        });
        return res
            .status(200)
            .json({ success: true, message: "Password changed successfully. You can now log in with your new password" });
    }
    catch (error) {
        console.error("Error in handleResetPasswordVerificationOTP:", error);
        return res
            .status(500)
            .json({ success: false, message: "Internal Server Error" });
    }
}
