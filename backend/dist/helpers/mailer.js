"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendGithubAuthPasswordMail = exports.sendGoogleAuthPasswordMail = exports.emailVerificationAlert = exports.sendResetPasswordVerification = exports.sendEmailVerification = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const sendEmailVerification = async (email, userId) => {
    try {
        const emailVerificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`📧 Email Verification OTP for ${email}: ${emailVerificationOTP}`);
        const emailUser = await User_model_1.default.findByIdAndUpdate(userId, {
            $set: {
                emailVerificationOTP: emailVerificationOTP,
                emailVerificationOTPExpires: Date.now() + 600000,
                emailSendTime: Date.now() + 120000,
            },
        }, { new: true });
        console.log(`✅ OTP Saved to DB: ${emailUser?.emailVerificationOTP}`);
        return { success: true, message: "OTP logged to console" };
    }
    catch (error) {
        console.log(error);
        throw new Error();
    }
};
exports.sendEmailVerification = sendEmailVerification;
const sendResetPasswordVerification = async (email, userId) => {
    try {
        const passwordResetOTP = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`🔐 Password Reset OTP for ${email}: ${passwordResetOTP}`);
        const emailUser = await User_model_1.default.findByIdAndUpdate(userId, {
            $set: {
                passwordResetOTP: passwordResetOTP,
                passwordResetOTPExpires: Date.now() + 600000,
                passwordSendTime: Date.now() + 3600000,
            },
        }, { new: true });
        console.log(`✅ Password Reset OTP Saved to DB: ${emailUser?.passwordResetOTP}`);
        return { success: true, message: "OTP logged to console" };
    }
    catch (error) {
        console.log(error);
        throw new Error();
    }
};
exports.sendResetPasswordVerification = sendResetPasswordVerification;
const emailVerificationAlert = async (email) => {
    try {
        console.log(`✅ Email Verification Alert for: ${email}`);
        return { success: true, message: "Alert logged to console" };
    }
    catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to process");
    }
};
exports.emailVerificationAlert = emailVerificationAlert;
const sendGoogleAuthPasswordMail = async (email, password) => {
    try {
        console.log(`🔐 Google Auth - Temporary Password for ${email}: ${password}`);
        return { success: true, message: "Password logged to console" };
    }
    catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to send email");
    }
};
exports.sendGoogleAuthPasswordMail = sendGoogleAuthPasswordMail;
const sendGithubAuthPasswordMail = async (email, password) => {
    try {
        console.log(`🔐 GitHub Auth - Temporary Password for ${email}: ${password}`);
        return { success: true, message: "Password logged to console" };
    }
    catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to send email");
    }
};
exports.sendGithubAuthPasswordMail = sendGithubAuthPasswordMail;
