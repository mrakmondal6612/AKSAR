"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationEmail = exports.sendGithubAuthPasswordMail = exports.sendGoogleAuthPasswordMail = exports.emailVerificationAlert = exports.sendResetPasswordVerification = exports.sendEmailVerification = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const dotenv_1 = __importDefault(require("dotenv"));
const mail_config_1 = require("../utils/mail.config");
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
const sendNotificationEmail = async (email, subject, message) => {
    try {
        const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f2f4f7; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 0; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); overflow: hidden; }
          .header { text-align: center; background-color: #2196F3; color: #ffffff; padding: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .logo { width: 120px; margin: 0 auto; display: block; }
          .content { padding: 30px; }
          .content p { font-size: 16px; line-height: 1.6; color: #555555; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #999999; background-color: #f4f4f4; }
          .footer p { margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.PUBLIC_FRONTEND_DOMAIN}/images/course-yuga-logo-light-mode-5.png" alt="Course-Yuga Logo" class="logo" />
            <h1>${subject}</h1>
          </div>
          <div class="content">
            <p>${message}</p>
            <p>Log in to your account to view more details and take action.</p>
          </div>
          <div class="footer">
            <p>© 2024 Course-Yuga. All rights reserved.</p>
            <p><a href="${process.env.PUBLIC_FRONTEND_DOMAIN}">Go to Course-Yuga</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
        const mailOptions = {
            from: `"Course Yuga" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: subject,
            html: htmlContent,
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
