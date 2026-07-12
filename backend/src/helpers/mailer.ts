import User from "../models/User.model";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { transporter } from "../utils/mail.config";
import { EMAIL_TEMPLATES } from "./emailTemplates";
import https from "https";

dotenv.config();

/**
 * Native helper to make HTTPS POST requests without external dependencies (like fetch or axios).
 */
const postRequest = (url: string, headers: Record<string, string>, body: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP Error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(JSON.stringify(body));
    req.end();
  });
};

/**
 * Universal mailer helper supporting Brevo API, Resend API, and Nodemailer SMTP.
 */
const sendMail = async (mailOptions: { from?: string; to: string; subject: string; html: string }) => {
  if (process.env.BREVO_API_KEY) {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.PUBLIC_GMAIL || "mrakmondal6612@gmail.com";
    return await postRequest(
      "https://api.brevo.com/v3/smtp/email",
      {
        "api-key": process.env.BREVO_API_KEY,
      },
      {
        sender: { name: "AKSAR", email: senderEmail },
        to: [{ email: mailOptions.to }],
        subject: mailOptions.subject,
        htmlContent: mailOptions.html,
      }
    );
  } else if (process.env.RESEND_API_KEY) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    return await postRequest(
      "https://api.resend.com/emails",
      {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      {
        from: `AKSAR <${fromEmail}>`,
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      }
    );
  } else {
    return await transporter.sendMail(mailOptions);
  }
};

export const sendEmailVerification = async (
  email: string,
  userId: mongoose.Types.ObjectId
) => {
  try {
    const emailVerificationOTP = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    console.log(`📧 Email Verification OTP for ${email}: ${emailVerificationOTP}`);

    const emailUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          emailVerificationOTP: emailVerificationOTP,
          emailVerificationOTPExpires: Date.now() + 600000,
          emailSendTime: Date.now() + 120000,
        },
      },
      { new: true }
    );

    console.log(`✅ OTP Saved to DB: ${emailUser?.emailVerificationOTP}`);

    const mailOptions = {
      from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
      to: email,
      subject: "Verify Your Email - AKSAR",
      html: EMAIL_TEMPLATES.VERIFICATION_OTP(emailVerificationOTP),
    };

    try {
      await sendMail(mailOptions);
    } catch (mailError) {
      console.warn(`⚠️ failed to send verification email to ${email}. You can check the OTP in the console log above.`, mailError);
    }

    return { success: true, message: "Verification OTP sent successfully" };
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

export const sendResetPasswordVerification = async (
  email: string,
  userId: mongoose.Types.ObjectId
) => {
  try {
    const passwordResetOTP = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    
    console.log(`🔐 Password Reset OTP for ${email}: ${passwordResetOTP}`);

    const emailUser = await User.findByIdAndUpdate(userId, {
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
      html: EMAIL_TEMPLATES.PASSWORD_RESET_OTP(passwordResetOTP),
    };

    try {
      await sendMail(mailOptions);
    } catch (mailError) {
      console.warn(`⚠️ SMTP failed to send password reset email to ${email}. You can check the OTP in the console log.`, mailError);
    }

    return { success: true, message: "Password reset OTP sent successfully" };
  } catch (error) {
    console.log(error);
    throw new Error("Failed to send password reset email");
  }
};

export const emailVerificationAlert = async (email: string) => {
  try {
    const mailOptions = {
      from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
      to: email,
      subject: "Email Verified Successfully - AKSAR",
      html: EMAIL_TEMPLATES.VERIFICATION_SUCCESS(),
    };

    try {
      await sendMail(mailOptions);
      console.log(`✅ Email Verification Alert sent to: ${email}`);
    } catch (mailError) {
      console.warn(`⚠️ SMTP failed to send email verification alert to ${email}.`, mailError);
    }
    return { success: true, message: "Verification alert sent successfully" };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, message: "Failed to send verification alert" };
  }
};

export const sendGoogleAuthPasswordMail = async (email: string, password: string) => {
  try {
    const mailOptions = {
      from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
      to: email,
      subject: "Welcome to AKSAR - Your Temporary Password",
      html: EMAIL_TEMPLATES.WELCOME_WITH_PASSWORD(password),
    };

    await sendMail(mailOptions);

    console.log(`🔐 Google Auth - Temporary Password sent to ${email}`);
    return { success: true, message: "Password sent successfully" };
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to send email");
  }
};

export const sendGithubAuthPasswordMail = async (email: string, password: string) => {
  try {
    const mailOptions = {
      from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
      to: email,
      subject: "Welcome to AKSAR - Your Temporary Password",
      html: EMAIL_TEMPLATES.WELCOME_WITH_PASSWORD(password),
    };

    await sendMail(mailOptions);

    console.log(`🔐 GitHub Auth - Temporary Password sent to ${email}`);
    return { success: true, message: "Password sent successfully" };
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to send email");
  }
};

export const sendNotificationEmail = async (email: string, subject: string, message: string, actionUrl?: string) => {
  try {
    const mailOptions = {
      from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
      to: email,
      subject: subject,
      html: EMAIL_TEMPLATES.GENERAL_NOTIFICATION(subject, message, actionUrl),
    };

    const mailResponse = await sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw new Error('Failed to send notification email');
  }
};

/**
 * Send Course Enrollment Email with link
 */
export const sendCourseEnrollmentEmail = async (email: string, courseName: string, courseUrl: string) => {
  try {
    const mailOptions = {
      from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
      to: email,
      subject: "Course Enrolled Successfully - AKSAR",
      html: EMAIL_TEMPLATES.COURSE_ENROLLMENT(courseName, courseUrl),
    };

    await sendMail(mailOptions);
    console.log(`✅ Course enrollment email sent to: ${email}`);
    return { success: true, message: "Course enrollment email sent successfully" };
  } catch (error) {
    console.error('Error sending course enrollment email:', error);
    throw new Error('Failed to send course enrollment email');
  }
};

/**
 * Send Certificate Issued Email with link
 */
export const sendCertificateIssuedEmail = async (email: string, courseName: string, certificateUrl: string) => {
  try {
    const mailOptions = {
      from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
      to: email,
      subject: "Certificate Earned - AKSAR",
      html: EMAIL_TEMPLATES.CERTIFICATE_ISSUED(courseName, certificateUrl),
    };

    await sendMail(mailOptions);
    console.log(`✅ Certificate email sent to: ${email}`);
    return { success: true, message: "Certificate email sent successfully" };
  } catch (error) {
    console.error('Error sending certificate email:', error);
    throw new Error('Failed to send certificate email');
  }
};

/**
 * Send Password Reset Success Email
 */
export const sendPasswordResetSuccessEmail = async (email: string) => {
  try {
    const mailOptions = {
      from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
      to: email,
      subject: "Password Reset Successful - AKSAR",
      html: EMAIL_TEMPLATES.PASSWORD_RESET_SUCCESS(),
    };

    await sendMail(mailOptions);

    console.log(`✅ Password reset success email sent to: ${email}`);
    return { success: true, message: "Password reset success email sent successfully" };
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    throw new Error('Failed to send password reset success email');
  }
};
