import { sendPhoneVerificationOTP, sendPasswordResetOTP, sendNotificationSMS } from "../../helpers/sms";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { Response } from "express";

/**
 * Test SMS connection and send verification OTP
 */
export const testSMSVerification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.userId;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const result = await sendPhoneVerificationOTP(phoneNumber, userId);
    
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error in testSMSVerification:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send verification SMS"
    });
  }
};

/**
 * Test SMS password reset OTP
 */
export const testSMSPasswordReset = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.userId;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const result = await sendPasswordResetOTP(phoneNumber, userId);
    
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error in testSMSPasswordReset:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send password reset SMS"
    });
  }
};

/**
 * Test SMS notification
 */
export const testSMSNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: "Phone number and message are required"
      });
    }

    const result = await sendNotificationSMS(phoneNumber, message);
    
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error in testSMSNotification:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send notification SMS"
    });
  }
};
