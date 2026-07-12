"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMS_TEMPLATES = exports.sendCertificateIssuedSMS = exports.sendCourseEnrollmentSMS = exports.sendNotificationSMS = exports.sendWelcomeSMS = exports.verifyPhoneOTP = exports.sendPasswordResetOTP = exports.sendPhoneVerificationOTP = exports.generateOTP = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const User_model_1 = __importDefault(require("../models/User.model"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
// SMS Templates
const SMS_TEMPLATES = {
    PHONE_VERIFICATION: (otp) => `Your AKSAR verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`,
    PASSWORD_RESET: (otp) => `Your AKSAR password reset code is: ${otp}. This code will expire in 10 minutes. If you did not request this, please ignore this message.`,
    WELCOME: (name) => `Welcome to AKSAR, ${name}! Your account has been successfully created. Start learning today!`,
    NOTIFICATION: (message) => `AKSAR Notification: ${message}`,
    COURSE_ENROLLMENT: (courseName) => `You have successfully enrolled in "${courseName}" on AKSAR. Start learning now!`,
    CERTIFICATE_ISSUED: (courseName) => `Congratulations! You have earned a certificate for "${courseName}" on AKSAR. View it in your dashboard.`,
};
exports.SMS_TEMPLATES = SMS_TEMPLATES;
/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;
/**
 * Send SMS via MSG91 (India)
 */
const sendSMSViaMSG91 = async (phoneNumber, message) => {
    const authKey = process.env.MSG91_AUTH_KEY;
    const senderId = process.env.MSG91_SENDER_ID || "AKSAR";
    if (!authKey) {
        throw new Error("MSG91_AUTH_KEY not configured");
    }
    const cleanPhone = phoneNumber.replace(/^\+/, ""); // Remove + from phone number
    try {
        const response = await axios_1.default.post("https://control.msg91.com/api/v5/flow/", {
            template_id: process.env.MSG91_TEMPLATE_ID || "",
            sender: senderId,
            short_url: "0",
            mobiles: cleanPhone,
            VAR1: message,
        }, {
            headers: {
                "authkey": authKey,
                "Content-Type": "application/json",
            },
        });
        return response.data;
    }
    catch (error) {
        // Fallback to simple SMS API
        try {
            const response = await axios_1.default.get(`https://api.msg91.com/api/v5/otp?authkey=${authKey}&template_id=${process.env.MSG91_TEMPLATE_ID || ""}&mobile=${cleanPhone}&otp=${message}`);
            return response.data;
        }
        catch (fallbackError) {
            throw new Error(`MSG91 API failed: ${fallbackError.message}`);
        }
    }
};
/**
 * Send SMS via Textlocal (International)
 */
const sendSMSViaTextlocal = async (phoneNumber, message) => {
    const apiKey = process.env.TEXTLOCAL_API_KEY;
    const sender = process.env.TEXTLOCAL_SENDER || "AKSAR";
    if (!apiKey) {
        throw new Error("TEXTLOCAL_API_KEY not configured");
    }
    try {
        const response = await axios_1.default.post("https://api.textlocal.in/send/", new URLSearchParams({
            apikey: apiKey,
            numbers: phoneNumber.replace(/^\+/, ""),
            sender: sender,
            message: message,
        }), {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        return response.data;
    }
    catch (error) {
        throw new Error(`Textlocal API failed: ${error.message}`);
    }
};
/**
 * Send SMS via generic HTTP API (custom gateway)
 */
const sendSMSViaGeneric = async (phoneNumber, message) => {
    const apiUrl = process.env.SMS_API_URL;
    const apiKey = process.env.SMS_API_KEY;
    if (!apiUrl) {
        throw new Error("SMS_API_URL not configured");
    }
    try {
        const response = await axios_1.default.post(apiUrl, {
            phone: phoneNumber,
            message: message,
            api_key: apiKey,
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        return response.data;
    }
    catch (error) {
        throw new Error(`Generic SMS API failed: ${error.message}`);
    }
};
/**
 * Send Phone Verification OTP via SMS
 */
const sendPhoneVerificationOTP = async (phoneNumber, userId) => {
    try {
        const otp = (0, exports.generateOTP)();
        console.log(`📱 Phone Verification OTP for ${phoneNumber}: ${otp}`);
        // Save OTP to database
        const user = await User_model_1.default.findByIdAndUpdate(userId, {
            $set: {
                phoneVerificationOTP: otp,
                phoneVerificationOTPExpires: Date.now() + 600000, // 10 minutes
                phoneSendTime: Date.now() + 120000, // 2 minutes cooldown
            },
        }, { new: true });
        console.log(`✅ Phone Verification OTP Saved to DB: ${user?.phoneVerificationOTP}`);
        // Send SMS via configured gateway
        const smsProvider = process.env.SMS_PROVIDER || "msg91";
        const message = SMS_TEMPLATES.PHONE_VERIFICATION(otp);
        let smsResult;
        switch (smsProvider.toLowerCase()) {
            case "msg91":
                smsResult = await sendSMSViaMSG91(phoneNumber, message);
                break;
            case "textlocal":
                smsResult = await sendSMSViaTextlocal(phoneNumber, message);
                break;
            case "generic":
                smsResult = await sendSMSViaGeneric(phoneNumber, message);
                break;
            default:
                throw new Error(`Unsupported SMS provider: ${smsProvider}`);
        }
        console.log(`✅ SMS sent via ${smsProvider}:`, smsResult);
        return { success: true, message: "Phone verification OTP sent successfully" };
    }
    catch (error) {
        console.error("Error sending phone verification SMS:", error);
        throw new Error(`Failed to send SMS: ${error.message}`);
    }
};
exports.sendPhoneVerificationOTP = sendPhoneVerificationOTP;
/**
 * Send Password Reset OTP via SMS
 */
const sendPasswordResetOTP = async (phoneNumber, userId) => {
    try {
        const otp = (0, exports.generateOTP)();
        console.log(`🔐 Password Reset OTP for ${phoneNumber}: ${otp}`);
        // Save OTP to database
        const user = await User_model_1.default.findByIdAndUpdate(userId, {
            $set: {
                passwordResetOTP: otp,
                passwordResetOTPExpires: Date.now() + 600000, // 10 minutes
                passwordSendTime: Date.now() + 3600000, // 1 hour cooldown
            },
        }, { new: true });
        console.log(`✅ Password Reset OTP Saved to DB: ${user?.passwordResetOTP}`);
        // Send SMS via configured gateway
        const smsProvider = process.env.SMS_PROVIDER || "msg91";
        const message = SMS_TEMPLATES.PASSWORD_RESET(otp);
        let smsResult;
        switch (smsProvider.toLowerCase()) {
            case "msg91":
                smsResult = await sendSMSViaMSG91(phoneNumber, message);
                break;
            case "textlocal":
                smsResult = await sendSMSViaTextlocal(phoneNumber, message);
                break;
            case "generic":
                smsResult = await sendSMSViaGeneric(phoneNumber, message);
                break;
            default:
                throw new Error(`Unsupported SMS provider: ${smsProvider}`);
        }
        console.log(`✅ SMS sent via ${smsProvider}:`, smsResult);
        return { success: true, message: "Password reset OTP sent successfully" };
    }
    catch (error) {
        console.error("Error sending password reset SMS:", error);
        throw new Error(`Failed to send SMS: ${error.message}`);
    }
};
exports.sendPasswordResetOTP = sendPasswordResetOTP;
/**
 * Verify Phone OTP
 */
const verifyPhoneOTP = async (userId, otp, type = "phoneVerification") => {
    try {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        const otpField = type === "phoneVerification"
            ? "phoneVerificationOTP"
            : "passwordResetOTP";
        const expiresField = type === "phoneVerification"
            ? "phoneVerificationOTPExpires"
            : "passwordResetOTPExpires";
        const storedOTP = user[otpField];
        const expiresAt = user[expiresField];
        if (!storedOTP) {
            throw new Error("OTP not found. Please request a new OTP.");
        }
        if (Date.now() > expiresAt) {
            throw new Error("OTP has expired. Please request a new OTP.");
        }
        if (storedOTP !== otp) {
            throw new Error("Invalid OTP. Please try again.");
        }
        // Clear OTP after successful verification
        await User_model_1.default.findByIdAndUpdate(userId, {
            $unset: { [otpField]: 1, [expiresField]: 1 },
        });
        return { success: true, message: "OTP verified successfully" };
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        throw new Error(error.message || "Failed to verify OTP");
    }
};
exports.verifyPhoneOTP = verifyPhoneOTP;
/**
 * Send Welcome SMS
 */
const sendWelcomeSMS = async (phoneNumber, name) => {
    try {
        const smsProvider = process.env.SMS_PROVIDER || "msg91";
        const message = SMS_TEMPLATES.WELCOME(name);
        let smsResult;
        switch (smsProvider.toLowerCase()) {
            case "msg91":
                smsResult = await sendSMSViaMSG91(phoneNumber, message);
                break;
            case "textlocal":
                smsResult = await sendSMSViaTextlocal(phoneNumber, message);
                break;
            case "generic":
                smsResult = await sendSMSViaGeneric(phoneNumber, message);
                break;
            default:
                throw new Error(`Unsupported SMS provider: ${smsProvider}`);
        }
        console.log(`✅ Welcome SMS sent via ${smsProvider}`);
        return { success: true, message: "Welcome SMS sent successfully" };
    }
    catch (error) {
        console.error("Error sending welcome SMS:", error);
        throw new Error(`Failed to send SMS: ${error.message}`);
    }
};
exports.sendWelcomeSMS = sendWelcomeSMS;
/**
 * Send Notification SMS
 */
const sendNotificationSMS = async (phoneNumber, message) => {
    try {
        const smsProvider = process.env.SMS_PROVIDER || "msg91";
        const smsMessage = SMS_TEMPLATES.NOTIFICATION(message);
        let smsResult;
        switch (smsProvider.toLowerCase()) {
            case "msg91":
                smsResult = await sendSMSViaMSG91(phoneNumber, smsMessage);
                break;
            case "textlocal":
                smsResult = await sendSMSViaTextlocal(phoneNumber, smsMessage);
                break;
            case "generic":
                smsResult = await sendSMSViaGeneric(phoneNumber, smsMessage);
                break;
            default:
                throw new Error(`Unsupported SMS provider: ${smsProvider}`);
        }
        console.log(`✅ Notification SMS sent via ${smsProvider}`);
        return { success: true, message: "Notification SMS sent successfully" };
    }
    catch (error) {
        console.error("Error sending notification SMS:", error);
        throw new Error(`Failed to send SMS: ${error.message}`);
    }
};
exports.sendNotificationSMS = sendNotificationSMS;
/**
 * Send Course Enrollment SMS
 */
const sendCourseEnrollmentSMS = async (phoneNumber, courseName) => {
    try {
        const smsProvider = process.env.SMS_PROVIDER || "msg91";
        const message = SMS_TEMPLATES.COURSE_ENROLLMENT(courseName);
        let smsResult;
        switch (smsProvider.toLowerCase()) {
            case "msg91":
                smsResult = await sendSMSViaMSG91(phoneNumber, message);
                break;
            case "textlocal":
                smsResult = await sendSMSViaTextlocal(phoneNumber, message);
                break;
            case "generic":
                smsResult = await sendSMSViaGeneric(phoneNumber, message);
                break;
            default:
                throw new Error(`Unsupported SMS provider: ${smsProvider}`);
        }
        console.log(`✅ Course enrollment SMS sent via ${smsProvider}`);
        return { success: true, message: "Course enrollment SMS sent successfully" };
    }
    catch (error) {
        console.error("Error sending course enrollment SMS:", error);
        throw new Error(`Failed to send SMS: ${error.message}`);
    }
};
exports.sendCourseEnrollmentSMS = sendCourseEnrollmentSMS;
/**
 * Send Certificate Issued SMS
 */
const sendCertificateIssuedSMS = async (phoneNumber, courseName) => {
    try {
        const smsProvider = process.env.SMS_PROVIDER || "msg91";
        const message = SMS_TEMPLATES.CERTIFICATE_ISSUED(courseName);
        let smsResult;
        switch (smsProvider.toLowerCase()) {
            case "msg91":
                smsResult = await sendSMSViaMSG91(phoneNumber, message);
                break;
            case "textlocal":
                smsResult = await sendSMSViaTextlocal(phoneNumber, message);
                break;
            case "generic":
                smsResult = await sendSMSViaGeneric(phoneNumber, message);
                break;
            default:
                throw new Error(`Unsupported SMS provider: ${smsProvider}`);
        }
        console.log(`✅ Certificate issued SMS sent via ${smsProvider}`);
        return { success: true, message: "Certificate issued SMS sent successfully" };
    }
    catch (error) {
        console.error("Error sending certificate issued SMS:", error);
        throw new Error(`Failed to send SMS: ${error.message}`);
    }
};
exports.sendCertificateIssuedSMS = sendCertificateIssuedSMS;
