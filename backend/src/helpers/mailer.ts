import User from "../models/User.model";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { transporter } from "../utils/mail.config";
import { EMAIL_TEMPLATES } from "./emailTemplates";

dotenv.config();

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
      await transporter.sendMail(mailOptions);
    } catch (mailError) {
      console.warn(`⚠️ SMTP failed to send verification email to ${email}. You can check the OTP in the console log above.`, mailError);
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
      await transporter.sendMail(mailOptions);
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
      await transporter.sendMail(mailOptions);
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

    await transporter.sendMail(mailOptions);

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

    await transporter.sendMail(mailOptions);

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

    const mailResponse = await transporter.sendMail(mailOptions);
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

    await transporter.sendMail(mailOptions);
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

    await transporter.sendMail(mailOptions);
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

    await transporter.sendMail(mailOptions);

    console.log(`✅ Password reset success email sent to: ${email}`);
    return { success: true, message: "Password reset success email sent successfully" };
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    throw new Error('Failed to send password reset success email');
  }
};

