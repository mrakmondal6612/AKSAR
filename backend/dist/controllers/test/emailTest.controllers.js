"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestEmail = exports.testEmailConnection = void 0;
const mail_config_1 = require("../../utils/mail.config");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const testEmailConnection = async (req, res) => {
    try {
        // Verify SMTP connection
        await mail_config_1.transporter.verify();
        res.status(200).json({
            success: true,
            message: "SMTP connection verified successfully",
            config: {
                host: process.env.MAILER_HOST,
                port: process.env.MAILER_PORT,
                user: process.env.MAILER_USER,
            }
        });
    }
    catch (error) {
        console.error("SMTP Connection Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to connect to SMTP server",
            error: error.message
        });
    }
};
exports.testEmailConnection = testEmailConnection;
const sendTestEmail = async (req, res) => {
    try {
        const { to } = req.body;
        if (!to) {
            return res.status(400).json({
                success: false,
                message: "Recipient email is required"
            });
        }
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: to,
            subject: "Test Email - AKSAR SMTP",
            html: `
        <div style="font-family: Arial, sans-serif; color: #222;">
          <h2>Test Email Successful!</h2>
          <p>If you received this email, your SMTP configuration is working correctly.</p>
          <p><strong>Configuration Details:</strong></p>
          <ul>
            <li>Host: ${process.env.MAILER_HOST}</li>
            <li>Port: ${process.env.MAILER_PORT}</li>
            <li>From: ${process.env.PUBLIC_GMAIL}</li>
          </ul>
          <p>Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
        };
        const info = await mail_config_1.transporter.sendMail(mailOptions);
        console.log("Test email sent:", info.messageId);
        res.status(200).json({
            success: true,
            message: "Test email sent successfully",
            messageId: info.messageId,
            to: to
        });
    }
    catch (error) {
        console.error("Error sending test email:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send test email",
            error: error.message
        });
    }
};
exports.sendTestEmail = sendTestEmail;
