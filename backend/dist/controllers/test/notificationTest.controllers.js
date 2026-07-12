"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestNotification = void 0;
const mail_config_1 = require("../../utils/mail.config");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Send test notification via email (simulates SMS notification)
 */
const sendTestNotification = async (req, res) => {
    try {
        const { to, message, type = "general" } = req.body;
        if (!to || !message) {
            return res.status(400).json({
                success: false,
                message: "Recipient email and message are required"
            });
        }
        let subject = "AKSAR Notification";
        let htmlContent = "";
        switch (type) {
            case "otp":
                subject = "AKSAR - Verification OTP";
                htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Verification Code</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
              <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
                Your AKSAR verification code is:
              </p>
              <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; border: 2px dashed #667eea; margin-bottom: 20px;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${message}</span>
              </div>
              <p style="font-size: 14px; color: #888; margin: 0;">
                This code will expire in 10 minutes. Do not share this code with anyone.
              </p>
            </div>
          </div>
        `;
                break;
            case "course_enrollment":
                subject = "AKSAR - Course Enrollment";
                htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Course Enrolled!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
                You have successfully enrolled in:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #11998e; margin-bottom: 20px;">
                <p style="font-size: 18px; font-weight: bold; color: #11998e; margin: 0;">${message}</p>
              </div>
              <p style="font-size: 14px; color: #888; margin: 0;">
                Start learning now! Log in to your AKSAR dashboard to access your course.
              </p>
            </div>
          </div>
        `;
                break;
            case "certificate":
                subject = "AKSAR - Certificate Issued";
                htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🏆 Certificate Earned!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
                Congratulations! You have earned a certificate for:
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f5576c; margin-bottom: 20px;">
                <p style="font-size: 18px; font-weight: bold; color: #f5576c; margin: 0;">${message}</p>
              </div>
              <p style="font-size: 14px; color: #888; margin: 0;">
                View and download your certificate from your AKSAR dashboard.
              </p>
            </div>
          </div>
        `;
                break;
            case "password_reset":
                subject = "AKSAR - Password Reset";
                htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🔑 Password Reset</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
              <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
                Your password reset code is:
              </p>
              <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; border: 2px dashed #ee5a24; margin-bottom: 20px;">
                <span style="font-size: 32px; font-weight: bold; color: #ee5a24; letter-spacing: 5px;">${message}</span>
              </div>
              <p style="font-size: 14px; color: #888; margin: 0;">
                This code will expire in 10 minutes. If you did not request this, please ignore this email.
              </p>
            </div>
          </div>
        `;
                break;
            default: // general notification
                htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📬 AKSAR Notification</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
              <p style="font-size: 16px; color: #555; margin-bottom: 15px;">
                ${message}
              </p>
              <p style="font-size: 14px; color: #888; margin: 0;">
                Log in to your AKSAR dashboard to view more details.
              </p>
            </div>
          </div>
        `;
        }
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        };
        const info = await mail_config_1.transporter.sendMail(mailOptions);
        console.log("Test notification sent:", info.messageId);
        res.status(200).json({
            success: true,
            message: "Test notification sent successfully",
            messageId: info.messageId,
            to: to,
            type: type
        });
    }
    catch (error) {
        console.error("Error sending test notification:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send test notification",
            error: error.message
        });
    }
};
exports.sendTestNotification = sendTestNotification;
