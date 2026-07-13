"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreateOrderFunction = handleCreateOrderFunction;
exports.handleVerifyPaymentFunction = handleVerifyPaymentFunction;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const Course_model_1 = __importDefault(require("../../models/Course.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
// Initialize Razorpay lazily to avoid errors if keys are not set
let razorpay = null;
const getRazorpayInstance = () => {
    if (!razorpay) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
        }
        razorpay = new razorpay_1.default({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpay;
};
async function handleCreateOrderFunction(req, res) {
    const { courseId } = req.body;
    const userId = req.userId;
    const userUniqueId = req.userUniqueId;
    if (!courseId || !userId || !userUniqueId) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    try {
        const razorpayInstance = getRazorpayInstance();
        const course = await Course_model_1.default.findOne({ courseId });
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        if (course.sellingPrice === 0) {
            return res.status(400).json({ success: false, message: "This course is free" });
        }
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // Check if already enrolled
        if (user.enrolledIn.includes(courseId)) {
            return res.status(400).json({ success: false, message: "Already enrolled in this course" });
        }
        const options = {
            amount: course.sellingPrice * 100, // Razorpay expects amount in paise
            currency: course.currency || "INR",
            receipt: `${courseId}_${userUniqueId.substring(0, 8)}_${Date.now().toString(36)}`,
            notes: {
                courseId: courseId,
                userId: userId,
                userUniqueId: userUniqueId,
            },
        };
        const order = await razorpayInstance.orders.create(options);
        return res.status(200).json({
            success: true,
            order,
            courseName: course.courseName,
            amount: course.sellingPrice,
            currency: course.currency || "INR",
            keyId: process.env.RAZORPAY_KEY_ID, // Send the configured Key ID dynamically
        });
    }
    catch (error) {
        console.error("Error creating Razorpay order:", error);
        return res.status(500).json({ success: false, message: "Failed to create order" });
    }
}
async function handleVerifyPaymentFunction(req, res) {
    const { orderId, paymentId, signature, courseId } = req.body;
    const userId = req.userId;
    const userUniqueId = req.userUniqueId;
    if (!orderId || !paymentId || !signature || !courseId || !userId || !userUniqueId) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    try {
        // Get the Razorpay key secret
        if (!process.env.RAZORPAY_KEY_SECRET) {
            throw new Error("Razorpay key secret not configured");
        }
        const generatedSignature = crypto_1.default
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + "|" + paymentId)
            .digest("hex");
        if (generatedSignature !== signature) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }
        // Enroll user in course after successful payment
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const course = await Course_model_1.default.findOne({ courseId });
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }
        // Check if already enrolled
        if (user.enrolledIn.includes(courseId)) {
            return res.status(400).json({ success: false, message: "Already enrolled in this course" });
        }
        // Add user to course's enrolledBy
        if (!course.enrolledBy.includes(userUniqueId)) {
            course.enrolledBy.push(userUniqueId);
            await course.save();
        }
        // Add course to user's enrolledIn
        user.enrolledIn.push(courseId);
        await user.save();
        return res.status(200).json({
            success: true,
            message: "Payment verified and enrollment successful",
        });
    }
    catch (error) {
        console.error("Error verifying payment:", error);
        return res.status(500).json({ success: false, message: "Payment verification failed" });
    }
}
