"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubmitInstructorRequestFunction = handleSubmitInstructorRequestFunction;
exports.handleGetMyInstructorRequestFunction = handleGetMyInstructorRequestFunction;
exports.handleGetAllInstructorRequestsFunction = handleGetAllInstructorRequestsFunction;
exports.handleApproveInstructorRequestFunction = handleApproveInstructorRequestFunction;
exports.handleRejectInstructorRequestFunction = handleRejectInstructorRequestFunction;
exports.handleGetContactMessagesFunction = handleGetContactMessagesFunction;
const InstructorRequest_model_1 = __importDefault(require("../../models/InstructorRequest.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
const ContactMessage_model_1 = __importDefault(require("../../models/ContactMessage.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nanoid_1 = require("nanoid");
// ── Student: Submit instructor request ────────────────────────────────────────
async function handleSubmitInstructorRequestFunction(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { reason } = req.body;
    try {
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.role === "INSTRUCTOR" || user.role === "ADMIN" || user.role === "MASTER") {
            return res.status(400).json({ success: false, message: "You are already an instructor or admin" });
        }
        // Check if already has a pending request
        const existing = await InstructorRequest_model_1.default.findOne({
            userId: user.uniqueId,
            status: "PENDING",
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending instructor request",
            });
        }
        const requestId = (0, nanoid_1.nanoid)(10);
        const newRequest = new InstructorRequest_model_1.default({
            requestId,
            userId: user.uniqueId,
            userName: user.userName,
            fullName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            profileImageUrl: user.profileImageUrl,
            reason: reason || "",
            status: "PENDING",
        });
        await newRequest.save();
        return res.status(201).json({
            success: true,
            message: "Instructor request submitted successfully. Admin will review it shortly.",
        });
    }
    catch (error) {
        console.error("Submit instructor request error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
// ── Student: Get own request status ──────────────────────────────────────────
async function handleGetMyInstructorRequestFunction(req, res) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    try {
        const user = await User_model_1.default.findById(userId).select("uniqueId");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const request = await InstructorRequest_model_1.default.findOne({ userId: user.uniqueId })
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: request || null,
        });
    }
    catch (error) {
        console.error("Get my request error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
// ── Admin: Get all instructor requests ────────────────────────────────────────
async function handleGetAllInstructorRequestsFunction(req, res) {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const requests = await InstructorRequest_model_1.default.find(query).sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: requests,
            meta: {
                total: requests.length,
                pending: requests.filter((r) => r.status === "PENDING").length,
                approved: requests.filter((r) => r.status === "APPROVED").length,
                rejected: requests.filter((r) => r.status === "REJECTED").length,
            },
        });
    }
    catch (error) {
        console.error("Get all requests error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
// ── Admin: Approve instructor request ─────────────────────────────────────────
async function handleApproveInstructorRequestFunction(req, res) {
    const { requestId } = req.params;
    const adminId = req.userId;
    // Only ADMIN or MASTER can approve
    if (req.userRole !== "ADMIN" && req.userRole !== "MASTER") {
        return res.status(403).json({ success: false, message: "Only admins can approve requests" });
    }
    try {
        const request = await InstructorRequest_model_1.default.findOne({ requestId });
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }
        if (request.status !== "PENDING") {
            return res.status(400).json({ success: false, message: "Request already reviewed" });
        }
        const user = await User_model_1.default.findOne({ uniqueId: request.userId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        user.role = "INSTRUCTOR";
        await user.save();
        request.status = "APPROVED";
        request.reviewedAt = new Date();
        request.reviewedBy = adminId;
        await request.save();
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role, uniqueId: user.uniqueId }, process.env.JWT_SECRET, { expiresIn: "15d" });
        return res.status(200).json({
            success: true,
            message: `${request.fullName} is now an INSTRUCTOR`,
            token,
        });
    }
    catch (error) {
        console.error("Approve request error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
// ── Admin: Reject instructor request ──────────────────────────────────────────
async function handleRejectInstructorRequestFunction(req, res) {
    const { requestId } = req.params;
    const adminId = req.userId;
    const { rejectionReason } = req.body;
    // Only ADMIN or MASTER can reject
    if (req.userRole !== "ADMIN" && req.userRole !== "MASTER") {
        return res.status(403).json({ success: false, message: "Only admins can reject requests" });
    }
    try {
        const request = await InstructorRequest_model_1.default.findOne({ requestId });
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }
        if (request.status !== "PENDING") {
            return res.status(400).json({ success: false, message: "Request already reviewed" });
        }
        request.status = "REJECTED";
        request.reviewedAt = new Date();
        request.reviewedBy = adminId;
        request.rejectionReason = rejectionReason || "Not specified";
        await request.save();
        return res.status(200).json({
            success: true,
            message: "Request rejected",
        });
    }
    catch (error) {
        console.error("Reject request error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
// ── Admin: Get all contact messages ──────────────────────────────────────────
async function handleGetContactMessagesFunction(req, res) {
    try {
        const messages = await ContactMessage_model_1.default.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: messages });
    }
    catch (error) {
        console.error("Get contact messages error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
