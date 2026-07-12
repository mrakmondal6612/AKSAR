"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSendTestEmailFunction = handleSendTestEmailFunction;
const mail_config_1 = require("../../utils/mail.config");
const emailTemplates_1 = require("../../helpers/emailTemplates");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function handleSendTestEmailFunction(req, res) {
    try {
        const { templateId, to, variables } = req.body;
        if (!templateId || !to) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: templateId and to (email address) are required.",
            });
        }
        let htmlContent = "";
        let subject = "Test Email from AKSAR Dashboard";
        switch (templateId) {
            case "VERIFICATION_OTP":
                htmlContent = emailTemplates_1.EMAIL_TEMPLATES.VERIFICATION_OTP(variables.otp || "123456");
                subject = "Verify Your Email - AKSAR Test";
                break;
            case "PASSWORD_RESET_OTP":
                htmlContent = emailTemplates_1.EMAIL_TEMPLATES.PASSWORD_RESET_OTP(variables.otp || "654321");
                subject = "Reset Your Password - AKSAR Test";
                break;
            case "VERIFICATION_SUCCESS":
                htmlContent = emailTemplates_1.EMAIL_TEMPLATES.VERIFICATION_SUCCESS();
                subject = "Email Verified Successfully! - AKSAR Test";
                break;
            case "WELCOME_WITH_PASSWORD":
                htmlContent = emailTemplates_1.EMAIL_TEMPLATES.WELCOME_WITH_PASSWORD(variables.password || "Temporary_Pass_123");
                subject = "Welcome to AKSAR! - AKSAR Test";
                break;
            case "COURSE_ENROLLMENT":
                htmlContent = emailTemplates_1.EMAIL_TEMPLATES.COURSE_ENROLLMENT(variables.courseName || "Next.js Mastering", variables.courseUrl || "https://aksar.com/courses/nextjs");
                subject = "🎉 Course Enrolled! - AKSAR Test";
                break;
            case "CERTIFICATE_ISSUED":
                htmlContent = emailTemplates_1.EMAIL_TEMPLATES.CERTIFICATE_ISSUED(variables.courseName || "Next.js Mastering", variables.certificateUrl || "https://aksar.com/certificates/test");
                subject = "🏆 Certificate Earned! - AKSAR Test";
                break;
            case "GENERAL_NOTIFICATION":
                htmlContent = emailTemplates_1.EMAIL_TEMPLATES.GENERAL_NOTIFICATION(variables.title || "Test Title Alert", variables.message || "This is a test notification from the AKSAR SMTP testing tool.", variables.actionUrl || "https://aksar.com");
                subject = "📬 AKSAR Notification - AKSAR Test";
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: `Unknown email template ID: ${templateId}`,
                });
        }
        const mailOptions = {
            from: `"AKSAR Admin" <${process.env.PUBLIC_GMAIL || process.env.MAILER_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        };
        await mail_config_1.transporter.sendMail(mailOptions);
        return res.status(200).json({
            success: true,
            message: `Test email sent successfully to ${to}`,
        });
    }
    catch (error) {
        console.error("Error sending test email:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send SMTP test email. Check server configuration.",
        });
    }
}
