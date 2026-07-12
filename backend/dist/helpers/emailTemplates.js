"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_TEMPLATES = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const FRONTEND_DOMAIN = process.env.PUBLIC_FRONTEND_DOMAIN || "https://aksar.com";
const LOGO_URL = `${FRONTEND_DOMAIN}/images/course-yuga-logo-dark-mode-5.png`;
/**
 * Enhanced Email Templates with Logo and Professional Design
 */
exports.EMAIL_TEMPLATES = {
    /**
     * Email Verification OTP Template
     */
    VERIFICATION_OTP: (otp) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - AKSAR</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #1a1a2e; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .content { padding: 40px 30px; background-color: #ffffff; }
        .otp-box { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0; border: 3px solid #0f3460; }
        .otp-code { font-size: 36px; font-weight: bold; color: #0f3460; letter-spacing: 8px; }
        .footer { background-color: #16213e; padding: 30px; text-align: center; font-size: 12px; color: #e0e0e0; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #0f3460 0%, #16213e 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        a { color: #0f3460; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Verify Your Email</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thank you for signing up with AKSAR! To complete your registration, please verify your email address using the code below:
          </p>
          <div class="otp-box">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your verification code:</p>
            <div class="otp-code">${otp}</div>
          </div>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            This code will expire in <strong>10 minutes</strong>. If you did not create an account with AKSAR, please ignore this email.
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Need help? Contact us at <a href="mailto:support@aksar.com" style="color: #0f3460;">support@aksar.com</a>
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">&copy; 2024 AKSAR. All rights reserved.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${FRONTEND_DOMAIN}" style="color: #ffffff; text-decoration: none;">AKSAR</a> | 
            <a href="${FRONTEND_DOMAIN}/privacy" style="color: #ffffff; text-decoration: none;">Privacy Policy</a> | 
            <a href="${FRONTEND_DOMAIN}/terms" style="color: #ffffff; text-decoration: none;">Terms of Service</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
    /**
     * Password Reset OTP Template
     */
    PASSWORD_RESET_OTP: (otp) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - AKSAR</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #1a1a2e; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .content { padding: 40px 30px; background-color: #ffffff; }
        .otp-box { background: linear-gradient(135deg, #fff3cd 0%, #ffe8a1 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0; border: 3px solid #0f3460; }
        .otp-code { font-size: 36px; font-weight: bold; color: #0f3460; letter-spacing: 8px; }
        .footer { background-color: #16213e; padding: 30px; text-align: center; font-size: 12px; color: #e0e0e0; }
        a { color: #0f3460; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Reset Your Password</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We received a request to reset your password for your AKSAR account. Use the code below to reset your password:
          </p>
          <div class="otp-box">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your reset code:</p>
            <div class="otp-code">${otp}</div>
          </div>
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            This code will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email and your password will remain unchanged.
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Need help? Contact us at <a href="mailto:support@aksar.com" style="color: #0f3460;">support@aksar.com</a>
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">&copy; 2024 AKSAR. All rights reserved.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${FRONTEND_DOMAIN}" style="color: #ffffff; text-decoration: none;">AKSAR</a> | 
            <a href="${FRONTEND_DOMAIN}/privacy" style="color: #ffffff; text-decoration: none;">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
    /**
     * Email Verification Success Template
     */
    VERIFICATION_SUCCESS: () => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verified - AKSAR</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #1a1a2e; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .content { padding: 40px 30px; background-color: #ffffff; }
        .success-box { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0; border: 3px solid #0f3460; }
        .success-icon { font-size: 48px; margin-bottom: 15px; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #0f3460 0%, #16213e 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { background-color: #16213e; padding: 30px; text-align: center; font-size: 12px; color: #e0e0e0; }
        a { color: #0f3460; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Email Verified Successfully!</h1>
        </div>
        <div class="content">
          <div class="success-box">
            <div class="success-icon">✅</div>
            <h2 style="color: #0f3460; margin: 0 0 15px 0;">Welcome to AKSAR!</h2>
            <p style="color: #333; line-height: 1.6; margin: 0;">
              Your email has been successfully verified. You can now access all features of AKSAR.
            </p>
          </div>
          <p style="font-size: 16px; color: #333; line-height: 1.6; margin-top: 30px;">
            Start your learning journey today by exploring our courses:
          </p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${FRONTEND_DOMAIN}/courses" class="button">Browse Courses</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If you have any questions, feel free to contact us at <a href="mailto:support@aksar.com" style="color: #0f3460;">support@aksar.com</a>
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">&copy; 2024 AKSAR. All rights reserved.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${FRONTEND_DOMAIN}" style="color: #ffffff; text-decoration: none;">AKSAR</a> | 
            <a href="${FRONTEND_DOMAIN}/privacy" style="color: #ffffff; text-decoration: none;">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
    /**
     * Welcome Email with Temporary Password (OAuth)
     */
    WELCOME_WITH_PASSWORD: (password) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to AKSAR</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #1a1a2e; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .content { padding: 40px 30px; background-color: #ffffff; }
        .password-box { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; text-align: center; border-radius: 10px; margin: 30px 0; border: 3px solid #0f3460; }
        .password-code { font-size: 28px; font-weight: bold; color: #0f3460; letter-spacing: 4px; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #0f3460 0%, #16213e 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .footer { background-color: #16213e; padding: 30px; text-align: center; font-size: 12px; color: #e0e0e0; }
        a { color: #0f3460; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to AKSAR!</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thank you for signing up with AKSAR! Your account has been successfully created using your social media account.
          </p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Here is your temporary password to log in:
          </p>
          <div class="password-box">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your temporary password:</p>
            <div class="password-code">${password}</div>
          </div>
          <div class="warning">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Important:</strong> Please log in and change your password immediately for security reasons. This temporary password will expire in 24 hours.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${FRONTEND_DOMAIN}/login" class="button">Log In Now</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Need help? Contact us at <a href="mailto:support@aksar.com" style="color: #0f3460;">support@aksar.com</a>
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">&copy; 2024 AKSAR. All rights reserved.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${FRONTEND_DOMAIN}" style="color: #ffffff; text-decoration: none;">AKSAR</a> | 
            <a href="${FRONTEND_DOMAIN}/privacy" style="color: #ffffff; text-decoration: none;">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
    /**
     * Course Enrollment Template with Link
     */
    COURSE_ENROLLMENT: (courseName, courseUrl) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Course Enrolled - AKSAR</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #1a1a2e; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .content { padding: 40px 30px; background-color: #ffffff; }
        .course-box { background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); padding: 30px; border-radius: 10px; margin: 30px 0; border-left: 5px solid #0f3460; }
        .course-name { font-size: 24px; font-weight: bold; color: #0f3460; margin: 0 0 15px 0; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #0f3460 0%, #16213e 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { background-color: #16213e; padding: 30px; text-align: center; font-size: 12px; color: #e0e0e0; }
        a { color: #0f3460; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Course Enrolled!</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Congratulations! You have successfully enrolled in:
          </p>
          <div class="course-box">
            <h2 class="course-name">${courseName}</h2>
            <p style="color: #333; line-height: 1.6; margin: 0;">
              Your learning journey begins now. Access your course materials, videos, and assignments anytime.
            </p>
          </div>
          <p style="font-size: 16px; color: #333; line-height: 1.6; margin-top: 30px;">
            Ready to start learning? Click the button below to access your course:
          </p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${courseUrl}" class="button">Start Learning Now</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            If you have any questions, feel free to contact us at <a href="mailto:support@aksar.com" style="color: #0f3460;">support@aksar.com</a>
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">&copy; 2024 AKSAR. All rights reserved.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${FRONTEND_DOMAIN}" style="color: #ffffff; text-decoration: none;">AKSAR</a> | 
            <a href="${FRONTEND_DOMAIN}/privacy" style="color: #ffffff; text-decoration: none;">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
    /**
     * Certificate Issued Template with Link
     */
    CERTIFICATE_ISSUED: (courseName, certificateUrl) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate Earned - AKSAR</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #1a1a2e; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .content { padding: 40px 30px; background-color: #ffffff; }
        .certificate-box { background: linear-gradient(135deg, #fff3cd 0%, #ffe8a1 100%); padding: 30px; border-radius: 10px; margin: 30px 0; border-left: 5px solid #0f3460; text-align: center; }
        .certificate-icon { font-size: 64px; margin-bottom: 15px; }
        .course-name { font-size: 24px; font-weight: bold; color: #0f3460; margin: 0 0 15px 0; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #0f3460 0%, #16213e 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { background-color: #16213e; padding: 30px; text-align: center; font-size: 12px; color: #e0e0e0; }
        a { color: #0f3460; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏆 Certificate Earned!</h1>
        </div>
        <div class="content">
          <div class="certificate-box">
            <div class="certificate-icon">🎓</div>
            <h2 class="course-name">${courseName}</h2>
            <p style="color: #333; line-height: 1.6; margin: 0;">
              Congratulations! You have successfully completed this course and earned your certificate.
            </p>
          </div>
          <p style="font-size: 16px; color: #333; line-height: 1.6; margin-top: 30px;">
            Your hard work has paid off! View and download your certificate:
          </p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${certificateUrl}" class="button">View Certificate</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Share your achievement on LinkedIn and add it to your resume!
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Need help? Contact us at <a href="mailto:support@aksar.com" style="color: #0f3460;">support@aksar.com</a>
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">&copy; 2024 AKSAR. All rights reserved.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${FRONTEND_DOMAIN}" style="color: #ffffff; text-decoration: none;">AKSAR</a> | 
            <a href="${FRONTEND_DOMAIN}/privacy" style="color: #ffffff; text-decoration: none;">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
    /**
     * General Notification Template
     */
    GENERAL_NOTIFICATION: (title, message, actionUrl) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notification - AKSAR</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #1a1a2e; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); padding: 40px 30px; text-align: center; }
        .logo { max-width: 180px; height: auto; margin-bottom: 20px; }
        .content { padding: 40px 30px; background-color: #ffffff; }
        .notification-box { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; border-radius: 10px; margin: 30px 0; border-left: 5px solid #0f3460; }
        .notification-title { font-size: 20px; font-weight: bold; color: #0f3460; margin: 0 0 15px 0; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #0f3460 0%, #16213e 100%); color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { background-color: #16213e; padding: 30px; text-align: center; font-size: 12px; color: #e0e0e0; }
        a { color: #0f3460; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📬 AKSAR Notification</h1>
        </div>
        <div class="content">
          <div class="notification-box">
            <h2 class="notification-title">${title}</h2>
            <p style="color: #333; line-height: 1.6; margin: 0;">
              ${message}
            </p>
          </div>
          ${actionUrl ? `
          <div style="text-align: center; margin-top: 30px;">
            <a href="${actionUrl}" class="button">View Details</a>
          </div>
          ` : ''}
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Log in to your AKSAR dashboard to view more details.
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            Need help? Contact us at <a href="mailto:support@aksar.com" style="color: #0f3460;">support@aksar.com</a>
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">&copy; 2024 AKSAR. All rights reserved.</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${FRONTEND_DOMAIN}" style="color: #ffffff; text-decoration: none;">AKSAR</a> | 
            <a href="${FRONTEND_DOMAIN}/privacy" style="color: #ffffff; text-decoration: none;">Privacy Policy</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
};
