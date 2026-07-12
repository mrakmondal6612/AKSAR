import { transporter } from "../../utils/mail.config";
import dotenv from "dotenv";

dotenv.config();

export const testEmailConnection = async (req: any, res: any) => {
  try {
    // Verify SMTP connection
    await transporter.verify();
    
    res.status(200).json({
      success: true,
      message: "SMTP connection verified successfully",
      config: {
        host: process.env.MAILER_HOST,
        port: process.env.MAILER_PORT,
        user: process.env.MAILER_USER,
      }
    });
  } catch (error: any) {
    console.error("SMTP Connection Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to connect to SMTP server",
      error: error.message
    });
  }
};

export const sendTestEmail = async (req: any, res: any) => {
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

    const info = await transporter.sendMail(mailOptions);
    
    console.log("Test email sent:", info.messageId);
    
    res.status(200).json({
      success: true,
      message: "Test email sent successfully",
      messageId: info.messageId,
      to: to
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message
    });
  }
};
