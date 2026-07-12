import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Smartphone, Tablet, Monitor, Copy, Check, Send, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import axios from "axios";
import { SuccessToast, ErrorToast } from "@/lib/toasts";
import { USER_API } from "@/lib/env";

interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  variables: { name: string; label: string; defaultValue: string; type: "text" | "textarea" }[];
  htmlGenerator: (vars: Record<string, string>) => string;
}

const FRONTEND_DOMAIN = window.location.origin;
const LOGO_URL = "/images/course-yuga-logo-dark-mode-5.png";

const TEMPLATES: TemplateDefinition[] = [
  {
    id: "VERIFICATION_OTP",
    name: "Email Verification OTP",
    description: "Sent to new users when registering to verify their email address.",
    variables: [
      { name: "otp", label: "Verification Code (OTP)", defaultValue: "582103", type: "text" },
    ],
    htmlGenerator: (vars) => `
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
          a { color: #0f3460; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo" onerror="this.src='https://placehold.co/180x50/16213e/ffffff?text=AKSAR'">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Verify Your Email</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Thank you for signing up with AKSAR! To complete your registration, please verify your email address using the code below:
            </p>
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your verification code:</p>
              <div class="otp-code">${vars.otp}</div>
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
  },
  {
    id: "PASSWORD_RESET_OTP",
    name: "Password Reset OTP",
    description: "Sent when users request to reset their password.",
    variables: [
      { name: "otp", label: "Reset Code (OTP)", defaultValue: "349182", type: "text" },
    ],
    htmlGenerator: (vars) => `
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
            <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo" onerror="this.src='https://placehold.co/180x50/16213e/ffffff?text=AKSAR'">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Reset Your Password</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              We received a request to reset your password for your AKSAR account. Use the code below to reset your password:
            </p>
            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your reset code:</p>
              <div class="otp-code">${vars.otp}</div>
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
  },
  {
    id: "VERIFICATION_SUCCESS",
    name: "Email Verification Success",
    description: "Welcome email sent when users verify their email successfully.",
    variables: [],
    htmlGenerator: () => `
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
            <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo" onerror="this.src='https://placehold.co/180x50/16213e/ffffff?text=AKSAR'">
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
              <a href="${FRONTEND_DOMAIN}/courses" class="button" style="color: white;">Browse Courses</a>
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
  },
  {
    id: "WELCOME_WITH_PASSWORD",
    name: "Social Auth Welcome Email",
    description: "Welcome email sent when registering via OAuth, containing a generated temporary password.",
    variables: [
      { name: "password", label: "Temporary Password", defaultValue: "Ak$ar_TeMp_982", type: "text" },
    ],
    htmlGenerator: (vars) => `
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
            <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo" onerror="this.src='https://placehold.co/180x50/16213e/ffffff?text=AKSAR'">
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
              <div class="password-code">${vars.password}</div>
            </div>
            <div class="warning">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Important:</strong> Please log in and change your password immediately for security reasons. This temporary password will expire in 24 hours.
              </p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${FRONTEND_DOMAIN}/login" class="button" style="color: white;">Log In Now</a>
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
  },
  {
    id: "COURSE_ENROLLMENT",
    name: "Course Enrollment Success",
    description: "Sent automatically to students when enrolling in a new course.",
    variables: [
      { name: "courseName", label: "Course Name", defaultValue: "Mastering Next.js & React Frameworks", type: "text" },
      { name: "courseUrl", label: "Course Link URL", defaultValue: `${FRONTEND_DOMAIN}/courses/nextjs-mastery`, type: "text" },
    ],
    htmlGenerator: (vars) => `
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
            <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo" onerror="this.src='https://placehold.co/180x50/16213e/ffffff?text=AKSAR'">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 Course Enrolled!</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Congratulations! You have successfully enrolled in:
            </p>
            <div class="course-box">
              <h2 class="course-name">${vars.courseName}</h2>
              <p style="color: #333; line-height: 1.6; margin: 0;">
                Your learning journey begins now. Access your course materials, videos, and assignments anytime.
              </p>
            </div>
            <p style="font-size: 16px; color: #333; line-height: 1.6; margin-top: 30px;">
              Ready to start learning? Click the button below to access your course:
            </p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${vars.courseUrl}" class="button" style="color: white;">Start Learning Now</a>
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
  },
  {
    id: "CERTIFICATE_ISSUED",
    name: "Certificate Issued",
    description: "Sent when a user completes a course and receives a certificate of completion.",
    variables: [
      { name: "courseName", label: "Completed Course Name", defaultValue: "Introduction to Advanced Algorithms", type: "text" },
      { name: "certificateUrl", label: "Certificate URL", defaultValue: `${FRONTEND_DOMAIN}/certificates/c-9821034`, type: "text" },
    ],
    htmlGenerator: (vars) => `
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
            <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo" onerror="this.src='https://placehold.co/180x50/16213e/ffffff?text=AKSAR'">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏆 Certificate Earned!</h1>
          </div>
          <div class="content">
            <div class="certificate-box">
              <div class="certificate-icon">🎓</div>
              <h2 class="course-name">${vars.courseName}</h2>
              <p style="color: #333; line-height: 1.6; margin: 0;">
                Congratulations! You have successfully completed this course and earned your certificate.
              </p>
            </div>
            <p style="font-size: 16px; color: #333; line-height: 1.6; margin-top: 30px;">
              Your hard work has paid off! View and download your certificate:
            </p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${vars.certificateUrl}" class="button" style="color: white;">View Certificate</a>
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
  },
  {
    id: "GENERAL_NOTIFICATION",
    name: "General Notification",
    description: "Sent for generic system alerts, news, promotions, or direct user messaging.",
    variables: [
      { name: "title", label: "Alert Title", defaultValue: "System Maintenance Scheduled", type: "text" },
      { name: "message", label: "Notification Message", defaultValue: "AKSAR services will undergo a scheduled maintenance on July 20th, from 2:00 AM to 4:00 AM UTC. Some features might be temporarily unavailable.", type: "textarea" },
      { name: "actionUrl", label: "CTA Action URL", defaultValue: `${FRONTEND_DOMAIN}/blog/system-maintenance`, type: "text" },
    ],
    htmlGenerator: (vars) => `
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
            <img src="${LOGO_URL}" alt="AKSAR Logo" class="logo" onerror="this.src='https://placehold.co/180x50/16213e/ffffff?text=AKSAR'">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📬 AKSAR Notification</h1>
          </div>
          <div class="content">
            <div class="notification-box">
              <h2 class="notification-title">${vars.title}</h2>
              <p style="color: #333; line-height: 1.6; margin: 0;">
                ${vars.message}
              </p>
            </div>
            ${vars.actionUrl ? `
            <div style="text-align: center; margin-top: 30px;">
              <a href="${vars.actionUrl}" class="button" style="color: white;">View Details</a>
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
  },
];

const MailTemplatesManagement: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(TEMPLATES[0]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  // Test Email State
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize variables when template changes
  useEffect(() => {
    const initialVars: Record<string, string> = {};
    selectedTemplate.variables.forEach((v) => {
      initialVars[v.name] = v.defaultValue;
    });
    setVariableValues(initialVars);
  }, [selectedTemplate]);

  // Compiled HTML computed property
  const compiledHTML = selectedTemplate.htmlGenerator(variableValues);

  // Inject HTML into iframe whenever compiledHTML or device changes
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(compiledHTML);
        doc.close();
      }
    }
  }, [compiledHTML, previewDevice, activeTab]);

  const handleVariableChange = (name: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(compiledHTML);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      SuccessToast("HTML Code copied to clipboard!");
    } catch (err) {
      ErrorToast("Failed to copy code.");
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) {
      ErrorToast("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      const response = await axios.post(
        `${USER_API}/admin/send-test-email`,
        {
          templateId: selectedTemplate.id,
          to: recipientEmail,
          variables: variableValues,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        SuccessToast(`Test email successfully sent to ${recipientEmail}`);
      } else {
        throw new Error(response.data.message || "Failed to send email");
      }
    } catch (error: any) {
      console.error(error);
      ErrorToast(error.response?.data?.message || "Failed to send test email. Verify your SMTP settings.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 bg-[#080b11] p-4 lg:p-8 flex flex-col font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm mb-1 tracking-wider uppercase">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>AKSAR Engine</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            SMTP Mail Templates
          </h1>
          <p className="text-slate-400 mt-1 max-w-2xl text-sm md:text-base">
            Visualize, edit variables, view HTML, and test render AKSAR's system transactional email templates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Template Sidebar Selector */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              Templates list
            </h2>
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplate.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplate(tmpl);
                      setActiveTab("preview");
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                      isSelected
                        ? "bg-purple-600/10 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                        : "bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="font-bold text-sm md:text-base">{tmpl.name}</div>
                    <div className="text-[11px] md:text-xs mt-1 text-slate-500 line-clamp-1">
                      {tmpl.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variables & Test Email dispatch */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-400" />
              Live custom fields
            </h2>

            {selectedTemplate.variables.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-4 bg-slate-950/40 rounded-xl border border-slate-800/60">
                This template has no dynamic variables.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {selectedTemplate.variables.map((v) => (
                  <div key={v.name} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-400">{v.label}</label>
                    {v.type === "textarea" ? (
                      <textarea
                        value={variableValues[v.name] || ""}
                        onChange={(e) => handleVariableChange(v.name, e.target.value)}
                        className="bg-slate-950/80 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500 resize-none h-24 font-sans leading-relaxed"
                      />
                    ) : (
                      <input
                        type="text"
                        value={variableValues[v.name] || ""}
                        onChange={(e) => handleVariableChange(v.name, e.target.value)}
                        className="bg-slate-950/80 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-800 my-2" />

            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-purple-400" />
              SMTP Send Test
            </h2>
            <form onSubmit={handleSendTestEmail} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-400">Target Email Address</label>
                <input
                  type="email"
                  placeholder="test@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSending}
                className={`py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
                  isSending ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5"
                }`}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send Test Email
                  </>
                )}
              </button>
              <div className="text-[10px] text-slate-500 flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 text-purple-400/80 flex-shrink-0" />
                <span>Uses current transporter SMTP credentials configured in the server's environment variables.</span>
              </div>
            </form>
          </div>
        </div>

        {/* Live Preview / Code Frame */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          {/* Header Controls */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* View Mode Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800/80">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                  activeTab === "preview"
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Interactive Layout
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                  activeTab === "code"
                    ? "bg-purple-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                HTML Source Code
              </button>
            </div>

            {/* Device Layout Selectors (only for preview mode) */}
            {activeTab === "preview" && (
              <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800/80 items-center">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  title="Desktop View"
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    previewDevice === "desktop" ? "bg-slate-800 text-purple-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice("tablet")}
                  title="Tablet View"
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    previewDevice === "tablet" ? "bg-slate-800 text-purple-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  title="Mobile View"
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    previewDevice === "mobile" ? "bg-slate-800 text-purple-400" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Copy Code button (only for code mode) */}
            {activeTab === "code" && (
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-white rounded-xl border border-slate-800 flex items-center gap-2 text-xs font-bold transition-all duration-300"
              >
                {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                {isCopied ? "Copied!" : "Copy Code"}
              </button>
            )}
          </div>

          {/* Interactive Screen Display */}
          <div className="flex-1 flex justify-center items-start min-h-[600px] bg-slate-950/20 rounded-3xl border border-slate-800/40 p-4 transition-all duration-300">
            <AnimatePresence mode="wait">
              {activeTab === "preview" ? (
                <motion.div
                  key="preview-pane"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width:
                      previewDevice === "mobile"
                        ? "375px"
                        : previewDevice === "tablet"
                        ? "768px"
                        : "100%",
                  }}
                  className="h-[650px] bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-800/40 transition-all duration-300 flex flex-col"
                >
                  <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                      {previewDevice.toUpperCase()} PREVIEW MODE
                    </div>
                    <div className="w-5" />
                  </div>
                  <iframe
                    ref={iframeRef}
                    title="Mail Preview Frame"
                    className="w-full flex-1 border-none bg-slate-900"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="code-pane"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-[650px] bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-mono"
                >
                  <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center justify-between text-xs text-slate-400">
                    <span>source_template.html</span>
                  </div>
                  <textarea
                    readOnly
                    value={compiledHTML}
                    className="w-full flex-1 bg-slate-950 text-slate-300 p-4 text-xs font-mono border-none resize-none focus:outline-none focus:ring-0 leading-relaxed overflow-auto select-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailTemplatesManagement;
