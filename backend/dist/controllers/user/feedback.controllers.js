"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetFeedbacks = exports.handleCreateFeedback = void 0;
const Feedback_model_1 = require("../../models/Feedback.model");
const User_model_1 = __importDefault(require("../../models/User.model"));
const handleCreateFeedback = async (req, res) => {
    try {
        const { rating, message } = req.body;
        const userId = req.userId; // Set by authenticateToken middleware
        if (!userId) {
            res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
            return;
        }
        if (!rating || !message) {
            res.status(400).json({ success: false, message: "Rating and message are required." });
            return;
        }
        // Find the logged-in user in database to retrieve name & email
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ success: false, message: "User account not found." });
            return;
        }
        const newFeedback = await Feedback_model_1.Feedback.create({
            user: user._id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            rating: Number(rating),
            message,
        });
        res.status(201).json({
            success: true,
            message: "Thank you for your feedback!",
            data: newFeedback,
        });
    }
    catch (error) {
        console.error("Error creating feedback:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};
exports.handleCreateFeedback = handleCreateFeedback;
const handleGetFeedbacks = async (req, res) => {
    try {
        // Return high-rating feedbacks (4 or 5 stars) to display on the landing page
        const feedbacks = await Feedback_model_1.Feedback.find({ rating: { $gte: 4 } })
            .sort({ createdAt: -1 })
            .limit(6);
        res.status(200).json({
            success: true,
            data: feedbacks,
        });
    }
    catch (error) {
        console.error("Error fetching feedbacks:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
};
exports.handleGetFeedbacks = handleGetFeedbacks;
