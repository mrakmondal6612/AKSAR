import { Request, Response } from "express";
import ContactMessage from "../../models/ContactMessage.model";
import { AuthenticatedAdminRequest } from "../../middleware/auth.middleware";
import { nanoid } from "nanoid";

// ── Public: Submit contact message ────────────────────────────────────────────
export async function handleSubmitContactMessageFunction(
    req: Request,
    res: Response
) {
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
        const messageId = nanoid(10);

        const newMessage = new ContactMessage({
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
    } catch (error) {
        console.error("Submit contact message error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// ── Admin: Get all contact messages ──────────────────────────────────────────
export async function handleGetContactMessagesFunction(
    req: AuthenticatedAdminRequest,
    res: Response
) {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: messages,
            meta: {
                total: messages.length,
                unread: messages.filter((m) => !m.isRead).length,
            },
        });
    } catch (error) {
        console.error("Get contact messages error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// ── Admin: Mark message as read ───────────────────────────────────────────────
export async function handleMarkMessageReadFunction(
    req: AuthenticatedAdminRequest,
    res: Response
) {
    const { messageId } = req.params;

    try {
        const msg = await ContactMessage.findOne({ messageId });
        if (!msg) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        msg.isRead = true;
        await msg.save();

        return res.status(200).json({ success: true, message: "Marked as read" });
    } catch (error) {
        console.error("Mark read error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// ── Admin: Delete message ─────────────────────────────────────────────────────
export async function handleDeleteContactMessageFunction(
    req: AuthenticatedAdminRequest,
    res: Response
) {
    const { messageId } = req.params;

    try {
        const msg = await ContactMessage.findOneAndDelete({ messageId });
        if (!msg) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        return res.status(200).json({ success: true, message: "Message deleted" });
    } catch (error) {
        console.error("Delete message error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}