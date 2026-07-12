"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetSuccessEmail = exports.sendCertificateIssuedEmail = exports.sendCourseEnrollmentEmail = exports.sendNotificationEmail = exports.sendGithubAuthPasswordMail = exports.sendGoogleAuthPasswordMail = exports.emailVerificationAlert = exports.sendResetPasswordVerification = exports.sendEmailVerification = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const dotenv_1 = __importDefault(require("dotenv"));
const mail_config_1 = require("../utils/mail.config");
const emailTemplates_1 = require("./emailTemplates");
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
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Verify Your Email - AKSAR",
            html: emailTemplates_1.EMAIL_TEMPLATES.VERIFICATION_OTP(emailVerificationOTP),
        };
        await mail_config_1.transporter.sendMail(mailOptions);
        return { success: true, message: "Verification OTP sent successfully" };
    }
    catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
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
                passwordSendTime: Date.now() + 60000,
            },
        }, { new: true });
        console.log(`✅ Password Reset OTP Saved to DB: ${emailUser?.passwordResetOTP}`);
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Reset Your Password - AKSAR",
            html: emailTemplates_1.EMAIL_TEMPLATES.PASSWORD_RESET_OTP(passwordResetOTP),
        };
        await mail_config_1.transporter.sendMail(mailOptions);
        return { success: true, message: "Password reset OTP sent successfully" };
    }
    catch (error) {
        console.log(error);
        throw new Error("Failed to send password reset email");
    }
};
exports.sendResetPasswordVerification = sendResetPasswordVerification;
const emailVerificationAlert = async (email) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Email Verified Successfully - AKSAR",
            html: emailTemplates_1.EMAIL_TEMPLATES.VERIFICATION_SUCCESS(),
        };
        await mail_config_1.transporter.sendMail(mailOptions);
        console.log(`✅ Email Verification Alert sent to: ${email}`);
        return { success: true, message: "Verification alert sent successfully" };
    }
    catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to send verification alert");
    }
};
exports.emailVerificationAlert = emailVerificationAlert;
const sendGoogleAuthPasswordMail = async (email, password) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Welcome to AKSAR - Your Temporary Password",
            html: emailTemplates_1.EMAIL_TEMPLATES.WELCOME_WITH_PASSWORD(password),
        };
        await mail_config_1.transporter.sendMail(mailOptions);
        console.log(`🔐 Google Auth - Temporary Password sent to ${email}`);
        return { success: true, message: "Password sent successfully" };
    }
    catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to send email");
    }
};
exports.sendGoogleAuthPasswordMail = sendGoogleAuthPasswordMail;
const sendGithubAuthPasswordMail = async (email, password) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Welcome to AKSAR - Your Temporary Password",
            html: emailTemplates_1.EMAIL_TEMPLATES.WELCOME_WITH_PASSWORD(password),
        };
        await mail_config_1.transporter.sendMail(mailOptions);
        console.log(`🔐 GitHub Auth - Temporary Password sent to ${email}`);
        return { success: true, message: "Password sent successfully" };
    }
    catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to send email");
    }
};
exports.sendGithubAuthPasswordMail = sendGithubAuthPasswordMail;
const sendNotificationEmail = async (email, subject, message, actionUrl) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: subject,
            html: emailTemplates_1.EMAIL_TEMPLATES.GENERAL_NOTIFICATION(subject, message, actionUrl),
        };
        const mailResponse = await mail_config_1.transporter.sendMail(mailOptions);
        return mailResponse;
    }
    catch (error) {
        console.error('Error sending notification email:', error);
        throw new Error('Failed to send notification email');
    }
};
exports.sendNotificationEmail = sendNotificationEmail;
/**
 * Send Course Enrollment Email with link
 */
const sendCourseEnrollmentEmail = async (email, courseName, courseUrl) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Course Enrolled Successfully - AKSAR",
            html: emailTemplates_1.EMAIL_TEMPLATES.COURSE_ENROLLMENT(courseName, courseUrl),
        };
        await mail_config_1.transporter.sendMail(mailOptions);
        console.log(`✅ Course enrollment email sent to: ${email}`);
        return { success: true, message: "Course enrollment email sent successfully" };
    }
    catch (error) {
        console.error('Error sending course enrollment email:', error);
        throw new Error('Failed to send course enrollment email');
    }
};
exports.sendCourseEnrollmentEmail = sendCourseEnrollmentEmail;
/**
 * Send Certificate Issued Email with link
 */
const sendCertificateIssuedEmail = async (email, courseName, certificateUrl) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Certificate Earned - AKSAR",
            html: emailTemplates_1.EMAIL_TEMPLATES.CERTIFICATE_ISSUED(courseName, certificateUrl),
        };
        await mail_config_1.transporter.sendMail(mailOptions);
        console.log(`✅ Certificate email sent to: ${email}`);
        return { success: true, message: "Certificate email sent successfully" };
    }
    catch (error) {
        console.error('Error sending certificate email:', error);
        throw new Error('Failed to send certificate email');
    }
};
exports.sendCertificateIssuedEmail = sendCertificateIssuedEmail;
/**
 * Send Password Reset Success Email
 */
const sendPasswordResetSuccessEmail = async (email) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Password Reset Successful - AKSAR",
            html: emailTemplates_1.EMAIL_TEMPLATES.PASSWORD_RESET_SUCCESS(),
        };
        await mail_config_1.transporter.sendMail(mailOptions);
        console.log(`✅ Password reset success email sent to: ${email}`);
        return { success: true, message: "Password reset success email sent successfully" };
    }
    catch (error) {
        console.error('Error sending password reset success email:', error);
        throw new Error('Failed to send password reset success email');
    }
};
exports.sendPasswordResetSuccessEmail = sendPasswordResetSuccessEmail;
