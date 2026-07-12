"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSMSNotification = exports.testSMSPasswordReset = exports.testSMSVerification = void 0;
const sms_1 = require("../../helpers/sms");
/**
 * Test SMS connection and send verification OTP
 */
const testSMSVerification = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const userId = req.userId;
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }
        const result = await (0, sms_1.sendPhoneVerificationOTP)(phoneNumber, userId);
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Error in testSMSVerification:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to send verification SMS"
        });
    }
};
exports.testSMSVerification = testSMSVerification;
/**
 * Test SMS password reset OTP
 */
const testSMSPasswordReset = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const userId = req.userId;
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }
        const result = await (0, sms_1.sendPasswordResetOTP)(phoneNumber, userId);
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Error in testSMSPasswordReset:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to send password reset SMS"
        });
    }
};
exports.testSMSPasswordReset = testSMSPasswordReset;
/**
 * Test SMS notification
 */
const testSMSNotification = async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: "Phone number and message are required"
            });
        }
        const result = await (0, sms_1.sendNotificationSMS)(phoneNumber, message);
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Error in testSMSNotification:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to send notification SMS"
        });
    }
};
exports.testSMSNotification = testSMSNotification;
