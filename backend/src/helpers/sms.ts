import { transporter } from "../utils/mail.config";
import dotenv from "dotenv";
import User from "../models/User.model";
import mongoose from "mongoose";
import axios from "axios";

dotenv.config();

// SMS Templates
const SMS_TEMPLATES = {
  PHONE_VERIFICATION: (otp: string) => 
    `Your AKSAR verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`,
  
  PASSWORD_RESET: (otp: string) => 
    `Your AKSAR password reset code is: ${otp}. This code will expire in 10 minutes. If you did not request this, please ignore this message.`,
  
  WELCOME: (name: string) => 
    `Welcome to AKSAR, ${name}! Your account has been successfully created. Start learning today!`,
  
  NOTIFICATION: (message: string) => 
    `AKSAR Notification: ${message}`,
  
  COURSE_ENROLLMENT: (courseName: string) => 
    `You have successfully enrolled in "${courseName}" on AKSAR. Start learning now!`,
  
  CERTIFICATE_ISSUED: (courseName: string) => 
    `Congratulations! You have earned a certificate for "${courseName}" on AKSAR. View it in your dashboard.`,
};

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send SMS via MSG91 (India)
 */
const sendSMSViaMSG91 = async (phoneNumber: string, message: string): Promise<any> => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID || "AKSAR";
  
  if (!authKey) {
    throw new Error("MSG91_AUTH_KEY not configured");
  }

  const cleanPhone = phoneNumber.replace(/^\+/, ""); // Remove + from phone number

  try {
    const response = await axios.post(
      "https://control.msg91.com/api/v5/flow/",
      {
        template_id: process.env.MSG91_TEMPLATE_ID || "",
        sender: senderId,
        short_url: "0",
        mobiles: cleanPhone,
        VAR1: message,
      },
      {
        headers: {
          "authkey": authKey,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    // Fallback to simple SMS API
    try {
      const response = await axios.get(
        `https://api.msg91.com/api/v5/otp?authkey=${authKey}&template_id=${process.env.MSG91_TEMPLATE_ID || ""}&mobile=${cleanPhone}&otp=${message}`
      );
      return response.data;
    } catch (fallbackError: any) {
      throw new Error(`MSG91 API failed: ${fallbackError.message}`);
    }
  }
};

/**
 * Send SMS via Textlocal (International)
 */
const sendSMSViaTextlocal = async (phoneNumber: string, message: string): Promise<any> => {
  const apiKey = process.env.TEXTLOCAL_API_KEY;
  const sender = process.env.TEXTLOCAL_SENDER || "AKSAR";
  
  if (!apiKey) {
    throw new Error("TEXTLOCAL_API_KEY not configured");
  }

  try {
    const response = await axios.post(
      "https://api.textlocal.in/send/",
      new URLSearchParams({
        apikey: apiKey,
        numbers: phoneNumber.replace(/^\+/, ""),
        sender: sender,
        message: message,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(`Textlocal API failed: ${error.message}`);
  }
};

/**
 * Send SMS via generic HTTP API (custom gateway)
 */
const sendSMSViaGeneric = async (phoneNumber: string, message: string): Promise<any> => {
  const apiUrl = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;
  
  if (!apiUrl) {
    throw new Error("SMS_API_URL not configured");
  }

  try {
    const response = await axios.post(
      apiUrl,
      {
        phone: phoneNumber,
        message: message,
        api_key: apiKey,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(`Generic SMS API failed: ${error.message}`);
  }
};

/**
 * Send Phone Verification OTP via SMS
 */
export const sendPhoneVerificationOTP = async (
  phoneNumber: string,
  userId: string | mongoose.Types.ObjectId
) => {
  try {
    const otp = generateOTP();
    
    console.log(`📱 Phone Verification OTP for ${phoneNumber}: ${otp}`);

    // Save OTP to database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          phoneVerificationOTP: otp,
          phoneVerificationOTPExpires: Date.now() + 600000, // 10 minutes
          phoneSendTime: Date.now() + 120000, // 2 minutes cooldown
        },
      },
      { new: true }
    );

    console.log(`✅ Phone Verification OTP Saved to DB: ${user?.phoneVerificationOTP}`);

    // Send SMS via configured gateway
    const smsProvider = process.env.SMS_PROVIDER || "msg91";
    const message = SMS_TEMPLATES.PHONE_VERIFICATION(otp);

    let smsResult;
    switch (smsProvider.toLowerCase()) {
      case "msg91":
        smsResult = await sendSMSViaMSG91(phoneNumber, message);
        break;
      case "textlocal":
        smsResult = await sendSMSViaTextlocal(phoneNumber, message);
        break;
      case "generic":
        smsResult = await sendSMSViaGeneric(phoneNumber, message);
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${smsProvider}`);
    }

    console.log(`✅ SMS sent via ${smsProvider}:`, smsResult);

    return { success: true, message: "Phone verification OTP sent successfully" };
  } catch (error: any) {
    console.error("Error sending phone verification SMS:", error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send Password Reset OTP via SMS
 */
export const sendPasswordResetOTP = async (
  phoneNumber: string,
  userId: string | mongoose.Types.ObjectId
) => {
  try {
    const otp = generateOTP();
    
    console.log(`🔐 Password Reset OTP for ${phoneNumber}: ${otp}`);

    // Save OTP to database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          passwordResetOTP: otp,
          passwordResetOTPExpires: Date.now() + 600000, // 10 minutes
          passwordSendTime: Date.now() + 3600000, // 1 hour cooldown
        },
      },
      { new: true }
    );

    console.log(`✅ Password Reset OTP Saved to DB: ${user?.passwordResetOTP}`);

    // Send SMS via configured gateway
    const smsProvider = process.env.SMS_PROVIDER || "msg91";
    const message = SMS_TEMPLATES.PASSWORD_RESET(otp);

    let smsResult;
    switch (smsProvider.toLowerCase()) {
      case "msg91":
        smsResult = await sendSMSViaMSG91(phoneNumber, message);
        break;
      case "textlocal":
        smsResult = await sendSMSViaTextlocal(phoneNumber, message);
        break;
      case "generic":
        smsResult = await sendSMSViaGeneric(phoneNumber, message);
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${smsProvider}`);
    }

    console.log(`✅ SMS sent via ${smsProvider}:`, smsResult);

    return { success: true, message: "Password reset OTP sent successfully" };
  } catch (error: any) {
    console.error("Error sending password reset SMS:", error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Verify Phone OTP
 */
export const verifyPhoneOTP = async (
  userId: string | mongoose.Types.ObjectId,
  otp: string,
  type: "phoneVerification" | "passwordReset" = "phoneVerification"
) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const otpField = type === "phoneVerification" 
      ? "phoneVerificationOTP" 
      : "passwordResetOTP";
    
    const expiresField = type === "phoneVerification" 
      ? "phoneVerificationOTPExpires" 
      : "passwordResetOTPExpires";

    const storedOTP = user[otpField as keyof typeof user];
    const expiresAt = user[expiresField as keyof typeof user];

    if (!storedOTP) {
      throw new Error("OTP not found. Please request a new OTP.");
    }

    if (Date.now() > (expiresAt as number)) {
      throw new Error("OTP has expired. Please request a new OTP.");
    }

    if (storedOTP !== otp) {
      throw new Error("Invalid OTP. Please try again.");
    }

    // Clear OTP after successful verification
    await User.findByIdAndUpdate(userId, {
      $unset: { [otpField]: 1, [expiresField]: 1 },
    });

    return { success: true, message: "OTP verified successfully" };
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    throw new Error(error.message || "Failed to verify OTP");
  }
};

/**
 * Send Welcome SMS
 */
export const sendWelcomeSMS = async (phoneNumber: string, name: string) => {
  try {
    const smsProvider = process.env.SMS_PROVIDER || "msg91";
    const message = SMS_TEMPLATES.WELCOME(name);

    let smsResult;
    switch (smsProvider.toLowerCase()) {
      case "msg91":
        smsResult = await sendSMSViaMSG91(phoneNumber, message);
        break;
      case "textlocal":
        smsResult = await sendSMSViaTextlocal(phoneNumber, message);
        break;
      case "generic":
        smsResult = await sendSMSViaGeneric(phoneNumber, message);
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${smsProvider}`);
    }

    console.log(`✅ Welcome SMS sent via ${smsProvider}`);
    return { success: true, message: "Welcome SMS sent successfully" };
  } catch (error: any) {
    console.error("Error sending welcome SMS:", error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send Notification SMS
 */
export const sendNotificationSMS = async (phoneNumber: string, message: string) => {
  try {
    const smsProvider = process.env.SMS_PROVIDER || "msg91";
    const smsMessage = SMS_TEMPLATES.NOTIFICATION(message);

    let smsResult;
    switch (smsProvider.toLowerCase()) {
      case "msg91":
        smsResult = await sendSMSViaMSG91(phoneNumber, smsMessage);
        break;
      case "textlocal":
        smsResult = await sendSMSViaTextlocal(phoneNumber, smsMessage);
        break;
      case "generic":
        smsResult = await sendSMSViaGeneric(phoneNumber, smsMessage);
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${smsProvider}`);
    }

    console.log(`✅ Notification SMS sent via ${smsProvider}`);
    return { success: true, message: "Notification SMS sent successfully" };
  } catch (error: any) {
    console.error("Error sending notification SMS:", error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send Course Enrollment SMS
 */
export const sendCourseEnrollmentSMS = async (phoneNumber: string, courseName: string) => {
  try {
    const smsProvider = process.env.SMS_PROVIDER || "msg91";
    const message = SMS_TEMPLATES.COURSE_ENROLLMENT(courseName);

    let smsResult;
    switch (smsProvider.toLowerCase()) {
      case "msg91":
        smsResult = await sendSMSViaMSG91(phoneNumber, message);
        break;
      case "textlocal":
        smsResult = await sendSMSViaTextlocal(phoneNumber, message);
        break;
      case "generic":
        smsResult = await sendSMSViaGeneric(phoneNumber, message);
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${smsProvider}`);
    }

    console.log(`✅ Course enrollment SMS sent via ${smsProvider}`);
    return { success: true, message: "Course enrollment SMS sent successfully" };
  } catch (error: any) {
    console.error("Error sending course enrollment SMS:", error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Send Certificate Issued SMS
 */
export const sendCertificateIssuedSMS = async (phoneNumber: string, courseName: string) => {
  try {
    const smsProvider = process.env.SMS_PROVIDER || "msg91";
    const message = SMS_TEMPLATES.CERTIFICATE_ISSUED(courseName);

    let smsResult;
    switch (smsProvider.toLowerCase()) {
      case "msg91":
        smsResult = await sendSMSViaMSG91(phoneNumber, message);
        break;
      case "textlocal":
        smsResult = await sendSMSViaTextlocal(phoneNumber, message);
        break;
      case "generic":
        smsResult = await sendSMSViaGeneric(phoneNumber, message);
        break;
      default:
        throw new Error(`Unsupported SMS provider: ${smsProvider}`);
    }

    console.log(`✅ Certificate issued SMS sent via ${smsProvider}`);
    return { success: true, message: "Certificate issued SMS sent successfully" };
  } catch (error: any) {
    console.error("Error sending certificate issued SMS:", error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

export { SMS_TEMPLATES };
