import { Request, Response } from "express";
import { transporter } from "../../utils/mail.config";
import { EMAIL_TEMPLATES } from "../../helpers/emailTemplates";
import dotenv from "dotenv";

dotenv.config();

export async function handleSendTestEmailFunction(req: Request, res: Response) {
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
        htmlContent = EMAIL_TEMPLATES.VERIFICATION_OTP(variables.otp || "123456");
        subject = "Verify Your Email - AKSAR Test";
        break;
      case "PASSWORD_RESET_OTP":
        htmlContent = EMAIL_TEMPLATES.PASSWORD_RESET_OTP(variables.otp || "654321");
        subject = "Reset Your Password - AKSAR Test";
        break;
      case "VERIFICATION_SUCCESS":
        htmlContent = EMAIL_TEMPLATES.VERIFICATION_SUCCESS();
        subject = "Email Verified Successfully! - AKSAR Test";
        break;
      case "WELCOME_WITH_PASSWORD":
        htmlContent = EMAIL_TEMPLATES.WELCOME_WITH_PASSWORD(variables.password || "Temporary_Pass_123");
        subject = "Welcome to AKSAR! - AKSAR Test";
        break;
      case "COURSE_ENROLLMENT":
        htmlContent = EMAIL_TEMPLATES.COURSE_ENROLLMENT(
          variables.courseName || "Next.js Mastering",
          variables.courseUrl || "https://aksar.com/courses/nextjs"
        );
        subject = "🎉 Course Enrolled! - AKSAR Test";
        break;
      case "CERTIFICATE_ISSUED":
        htmlContent = EMAIL_TEMPLATES.CERTIFICATE_ISSUED(
          variables.courseName || "Next.js Mastering",
          variables.certificateUrl || "https://aksar.com/certificates/test"
        );
        subject = "🏆 Certificate Earned! - AKSAR Test";
        break;
      case "GENERAL_NOTIFICATION":
        htmlContent = EMAIL_TEMPLATES.GENERAL_NOTIFICATION(
          variables.title || "Test Title Alert",
          variables.message || "This is a test notification from the AKSAR SMTP testing tool.",
          variables.actionUrl || "https://aksar.com"
        );
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

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${to}`,
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send SMTP test email. Check server configuration.",
    });
  }
}
