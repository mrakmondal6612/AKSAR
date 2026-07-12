import { Request, Response } from "express";
import User from "../../models/User.model"
import bcrypt from "bcryptjs";
import {checkPasswordConstraints } from "../../validchecks/checkAuthConstraints";
import {sendResetPasswordVerification, sendPasswordResetSuccessEmail } from "../../helpers/mailer";

export async function handleResetPasswordFunction(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email is required" });
      }
      
      const user = await User.findOne({ email: email });
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "User does not exist with this email" });
      }
      
      // Remove email verification check - allow password reset for unverified emails too
  
      if (user && user.passwordSendTime) {
        const emailTime = Number(user.passwordSendTime);
        const currentTime = Date.now();
        const remainingTime = emailTime - currentTime;
        if (remainingTime > 0) {
          const hours = Math.floor(remainingTime / (1000 * 60 * 60));
          const minutes = Math.floor(
            (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
          return res.status(429).json({
            success: false,
            message: `Please try again after ${hours} hours ${minutes} minutes ${seconds} seconds`,
          });
        }
      }
  
      await sendResetPasswordVerification(user.email, user._id);
  
      return res
        .status(200)
        .json({ message: "Password reset OTP sent successfully to your email", success: true });
    } catch (error) {
      console.error("Error in handleResetPasswordFunction:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
  
  export async function handleResetPasswordVerificationOTP(
    req: Request,
    res: Response
  ) {
    try {
      const { otp, newPassword, email } = req.body;
  
      if (!otp || !newPassword || !email) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required: otp, newPassword, email" });
      }
  
      const isValidPassword = checkPasswordConstraints(newPassword);
      if (!isValidPassword) {
        return res
          .status(400)
          .json({ 
            success: false, 
            message: "Invalid password format. Password must be at least 8 characters with uppercase, lowercase, number, and special character" 
          });
      }
  
      const user = await User.findOne({ email, passwordResetOTP: otp });
  
      if (!user) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid OTP or email address" });
      }
  
      if (user && user.passwordResetOTPExpires) {
        const emailTime = Number(user.passwordResetOTPExpires);
        const currentTime = Date.now();
        const remainingTime = emailTime - currentTime;
        if (remainingTime < 0) {
          return res.status(400).json({ success: false, message: "OTP has expired. Please request a new OTP" });
        }
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 10);
  
      await User.findByIdAndUpdate(user._id, {
        $set: {
          password: hashedPassword,
        },
        $unset: {
          passwordResetOTP: "",
          passwordResetOTPExpires: "",
          passwordSendTime: "",
        },
      });

      // Send password reset success email
      await sendPasswordResetSuccessEmail(user.email);

      return res
        .status(200)
        .json({ success: true, message: "Password changed successfully. You can now log in with your new password" });
    } catch (error) {
      console.error("Error in handleResetPasswordVerificationOTP:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }