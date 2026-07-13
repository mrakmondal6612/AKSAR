"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetSuccessEmail = exports.sendCertificateIssuedEmail = exports.sendCourseEnrollmentEmail = exports.sendNotificationEmail = exports.sendGithubAuthPasswordMail = exports.sendGoogleAuthPasswordMail = exports.emailVerificationAlert = exports.sendResetPasswordVerification = exports.sendEmailVerification = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const dotenv_1 = __importDefault(require("dotenv"));
const mail_config_1 = require("../utils/mail.config");
const emailTemplates_1 = require("./emailTemplates");
const https_1 = __importDefault(require("https"));
dotenv_1.default.config();
/**
 * Native helper to make HTTPS POST requests without external dependencies (like fetch or axios).
 */
const postRequest = (url, headers, body) => {
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
        const req = https_1.default.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    }
                    catch {
                        resolve(data);
                    }
                }
                else {
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
const sendMail = async (mailOptions) => {
    if (process.env.BREVO_API_KEY) {
        const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.PUBLIC_GMAIL || "mrakmondal6612@gmail.com";
        return await postRequest("https://api.brevo.com/v3/smtp/email", {
            "api-key": process.env.BREVO_API_KEY,
        }, {
            sender: { name: "AKSAR", email: senderEmail },
            to: [{ email: mailOptions.to }],
            subject: mailOptions.subject,
            htmlContent: mailOptions.html,
        });
    }
    else if (process.env.RESEND_API_KEY) {
        const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
        return await postRequest("https://api.resend.com/emails", {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        }, {
            from: `AKSAR <${fromEmail}>`,
            to: mailOptions.to,
            subject: mailOptions.subject,
            html: mailOptions.html,
        });
    }
    else {
        return await mail_config_1.transporter.sendMail(mailOptions);
    }
};
const sendEmailVerification = async (email, userId) => {
    try {
        const emailVerificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`📧 Email Verification OTP for ${email}: ${emailVerificationOTP}`);
        const emailUser = await User_model_1.default.findByIdAndUpdate(userId, {
            $set: {
                emailVerificationOTP: emailVerificationOTP,
                emailVerificationOTPExpires: Date.now() + 600000,
                emailSendTime: Date.now() + 120000,
            },
        }, { new: true });
        console.log(`✅ OTP Saved to DB: ${emailUser?.emailVerificationOTP}`);
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Verify Your Email - AKSAR",
            html: emailTemplates_1.EMAIL_TEMPLATES.VERIFICATION_OTP(emailVerificationOTP),
        };
        try {
            await sendMail(mailOptions);
        }
        catch (mailError) {
            console.warn(`⚠️ failed to send verification email to ${email}. You can check the OTP in the console log above.`, mailError);
        }
        return { success: true, message: "Verification OTP sent successfully" };
    }
    catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
    }
};
exports.sendEmailVerification = sendEmailVerification;
const sendResetPasswordVerification = async (email, userId) => {
    try {
        const passwordResetOTP = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`🔐 Password Reset OTP for ${email}: ${passwordResetOTP}`);
        const emailUser = await User_model_1.default.findByIdAndUpdate(userId, {
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
            html: emailTemplates_1.EMAIL_TEMPLATES.PASSWORD_RESET_OTP(passwordResetOTP),
        };
        try {
            await sendMail(mailOptions);
        }
        catch (mailError) {
            console.warn(`⚠️ SMTP failed to send password reset email to ${email}. You can check the OTP in the console log.`, mailError);
        }
        return { success: true, message: "Password reset OTP sent successfully" };
    }
    catch (error) {
        console.log(error);
        throw new Error("Failed to send password reset email");
    }
};
exports.sendResetPasswordVerification = sendResetPasswordVerification;
const emailVerificationAlert = async (email) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Email Verified Successfully - AKSAR",
            html: emailTemplates_1.EMAIL_TEMPLATES.VERIFICATION_SUCCESS(),
        };
        try {
            await sendMail(mailOptions);
            console.log(`✅ Email Verification Alert sent to: ${email}`);
        }
        catch (mailError) {
            console.warn(`⚠️ SMTP failed to send email verification alert to ${email}.`, mailError);
        }
        return { success: true, message: "Verification alert sent successfully" };
    }
    catch (error) {
        console.error("Error:", error);
        return { success: false, message: "Failed to send verification alert" };
    }
};
exports.emailVerificationAlert = emailVerificationAlert;
const sendGoogleAuthPasswordMail = async (email, password) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Welcome to AKSAR - Your Temporary Password",
            html: emailTemplates_1.EMAIL_TEMPLATES.WELCOME_WITH_PASSWORD(password),
        };
        await sendMail(mailOptions);
        console.log(`🔐 Google Auth - Temporary Password sent to ${email}`);
        return { success: true, message: "Password sent successfully" };
    }
    catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to send email");
    }
};
exports.sendGoogleAuthPasswordMail = sendGoogleAuthPasswordMail;
const sendGithubAuthPasswordMail = async (email, password) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Welcome to AKSAR - Your Temporary Password",
            html: emailTemplates_1.EMAIL_TEMPLATES.WELCOME_WITH_PASSWORD(password),
        };
        await sendMail(mailOptions);
        console.log(`🔐 GitHub Auth - Temporary Password sent to ${email}`);
        return { success: true, message: "Password sent successfully" };
    }
    catch (error) {
        console.error("Error:", error);
        throw new Error("Failed to send email");
    }
};
exports.sendGithubAuthPasswordMail = sendGithubAuthPasswordMail;
const sendNotificationEmail = async (email, subject, message, actionUrl) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: subject,
            html: emailTemplates_1.EMAIL_TEMPLATES.GENERAL_NOTIFICATION(subject, message, actionUrl),
        };
        const mailResponse = await sendMail(mailOptions);
        return mailResponse;
    }
    catch (error) {
        console.error('Error sending notification email:', error);
        throw new Error('Failed to send notification email');
    }
};
exports.sendNotificationEmail = sendNotificationEmail;
/**
 * Send Course Enrollment Email with link
 */
const sendCourseEnrollmentEmail = async (email, courseName, courseUrl) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Course Enrolled Successfully - AKSAR",
            html: emailTemplates_1.EMAIL_TEMPLATES.COURSE_ENROLLMENT(courseName, courseUrl),
        };
        await sendMail(mailOptions);
        console.log(`✅ Course enrollment email sent to: ${email}`);
        return { success: true, message: "Course enrollment email sent successfully" };
    }
    catch (error) {
        console.error('Error sending course enrollment email:', error);
        throw new Error('Failed to send course enrollment email');
    }
};
exports.sendCourseEnrollmentEmail = sendCourseEnrollmentEmail;
/**
 * Send Certificate Issued Email with link
 */
const sendCertificateIssuedEmail = async (email, courseName, certificateUrl) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Certificate Earned - AKSAR",
            html: emailTemplates_1.EMAIL_TEMPLATES.CERTIFICATE_ISSUED(courseName, certificateUrl),
        };
        await sendMail(mailOptions);
        console.log(`✅ Certificate email sent to: ${email}`);
        return { success: true, message: "Certificate email sent successfully" };
    }
    catch (error) {
        console.error('Error sending certificate email:', error);
        throw new Error('Failed to send certificate email');
    }
};
exports.sendCertificateIssuedEmail = sendCertificateIssuedEmail;
/**
 * Send Password Reset Success Email
 */
const sendPasswordResetSuccessEmail = async (email) => {
    try {
        const mailOptions = {
            from: `"AKSAR" <${process.env.PUBLIC_GMAIL}>`,
            to: email,
            subject: "Password Reset Successful - AKSAR",
            html: emailTemplates_1.EMAIL_TEMPLATES.PASSWORD_RESET_SUCCESS(),
        };
        await sendMail(mailOptions);
        console.log(`✅ Password reset success email sent to: ${email}`);
        return { success: true, message: "Password reset success email sent successfully" };
    }
    catch (error) {
        console.error('Error sending password reset success email:', error);
        throw new Error('Failed to send password reset success email');
    }
};
exports.sendPasswordResetSuccessEmail = sendPasswordResetSuccessEmail;
