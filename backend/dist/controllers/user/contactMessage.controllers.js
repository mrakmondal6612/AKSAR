"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubmitContactMessageFunction = handleSubmitContactMessageFunction;
exports.handleGetContactMessagesFunction = handleGetContactMessagesFunction;
exports.handleMarkMessageReadFunction = handleMarkMessageReadFunction;
exports.handleDeleteContactMessageFunction = handleDeleteContactMessageFunction;
const ContactMessage_model_1 = __importDefault(require("../../models/ContactMessage.model"));
const nanoid_1 = require("nanoid");
// ── Public: Submit contact message ────────────────────────────────────────────
async function handleSubmitContactMessageFunction(req, res) {
    const { email, message } = req.body;
    if (!email || !message) {
        return res.status(400).json({
            success: false,
            message: "Email and message are required",
        });
    }
    if (message.length > 1000) {
        return res.status(400).json({
            success: false,
            message: "Message must be under 1000 characters",
        });
    }
    try {
        const messageId = (0, nanoid_1.nanoid)(10);
        const newMessage = new ContactMessage_model_1.default({
            messageId,
            email: email.trim(),
            message: message.trim(),
            isRead: false,
        });
        await newMessage.save();
        return res.status(201).json({
            success: true,
            message: "Message sent successfully! We'll get back to you soon.",
        });
    }
    catch (error) {
        console.error("Submit contact message error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
// ── Admin: Get all contact messages ──────────────────────────────────────────
async function handleGetContactMessagesFunction(req, res) {
    try {
        const messages = await ContactMessage_model_1.default.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            data: messages,
            meta: {
                total: messages.length,
                unread: messages.filter((m) => !m.isRead).length,
            },
        });
    }
    catch (error) {
        console.error("Get contact messages error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
// ── Admin: Mark message as read ───────────────────────────────────────────────
async function handleMarkMessageReadFunction(req, res) {
    const { messageId } = req.params;
    try {
        const msg = await ContactMessage_model_1.default.findOne({ messageId });
        if (!msg) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }
        msg.isRead = true;
        await msg.save();
        return res.status(200).json({ success: true, message: "Marked as read" });
    }
    catch (error) {
        console.error("Mark read error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
// ── Admin: Delete message ─────────────────────────────────────────────────────
async function handleDeleteContactMessageFunction(req, res) {
    const { messageId } = req.params;
    try {
        const msg = await ContactMessage_model_1.default.findOneAndDelete({ messageId });
        if (!msg) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }
        return res.status(200).json({ success: true, message: "Message deleted" });
    }
    catch (error) {
        console.error("Delete message error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
