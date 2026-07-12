import { AuthenticatedRequest, AuthenticatedAdminRequest } from "../../middleware/auth.middleware";
import { Response } from "express";
import InstructorRequest from "../../models/InstructorRequest.model";
import User from "../../models/User.model";
import ContactMessage from "../../models/ContactMessage.model";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { createNotification, notifyAdmins } from "../../helpers/notificationHelper";

// ── Student: Submit instructor request ────────────────────────────────────────
export async function handleSubmitInstructorRequestFunction(
    req: AuthenticatedRequest,
    res: Response
) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { reason } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role === "INSTRUCTOR" || user.role === "ADMIN" || user.role === "MASTER") {
            return res.status(400).json({ success: false, message: "You are already an instructor or admin" });
        }

        // Check if already has a pending request
        const existing = await InstructorRequest.findOne({
            userId: user.uniqueId,
            status: "PENDING",
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending instructor request",
            });
        }

        const requestId = nanoid(10);

        const newRequest = new InstructorRequest({
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

        await notifyAdmins({
            type: "new_instructor_request",
            title: "📥 New Instructor Request",
            message: `${user.firstName} ${user.lastName} (@${user.userName}) has requested to become an instructor.`,
            link: "/user/admin/requests",
        });

        return res.status(201).json({
            success: true,
            message: "Instructor request submitted successfully. Admin will review it shortly.",
        });
    } catch (error) {
        console.error("Submit instructor request error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// ── Student: Get own request status ──────────────────────────────────────────
export async function handleGetMyInstructorRequestFunction(
    req: AuthenticatedRequest,
    res: Response
) {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const user = await User.findById(userId).select("uniqueId");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const request = await InstructorRequest.findOne({ userId: user.uniqueId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: request || null,
        });
    } catch (error) {
        console.error("Get my request error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// ── Admin: Get all instructor requests ────────────────────────────────────────
export async function handleGetAllInstructorRequestsFunction(
    req: AuthenticatedAdminRequest,
    res: Response
) {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};

        const requests = await InstructorRequest.find(query).sort({ createdAt: -1 });

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
    } catch (error) {
        console.error("Get all requests error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// ── Admin: Approve instructor request ─────────────────────────────────────────
export async function handleApproveInstructorRequestFunction(
    req: AuthenticatedAdminRequest,
    res: Response
) {
    const { requestId } = req.params;
    const adminId = req.userId;

    // Only ADMIN or MASTER can approve
    if (req.userRole !== "ADMIN" && req.userRole !== "MASTER") {
        return res.status(403).json({ success: false, message: "Only admins can approve requests" });
    }

    try {
        const request = await InstructorRequest.findOne({ requestId });
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        if (request.status !== "PENDING") {
            return res.status(400).json({ success: false, message: "Request already reviewed" });
        }

        const user = await User.findOne({ uniqueId: request.userId });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.role = "INSTRUCTOR";
        await user.save();

        request.status = "APPROVED";
        request.reviewedAt = new Date();
        request.reviewedBy = adminId;
        await request.save();

        await createNotification({
            userId: user._id.toString(),
            type: "instructor_request_approved",
            title: "✅ Instructor Request Approved!",
            message: "Congratulations! Your instructor request has been approved.",
        });

        const token = jwt.sign(
            { id: user._id, role: user.role, uniqueId: user.uniqueId },
            process.env.JWT_SECRET!,
            { expiresIn: "15d" }
        );

        return res.status(200).json({
            success: true,
            message: `${request.fullName} is now an INSTRUCTOR`,
            token,
        });
    } catch (error) {
        console.error("Approve request error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

// ── Admin: Reject instructor request ──────────────────────────────────────────
export async function handleRejectInstructorRequestFunction(
    req: AuthenticatedAdminRequest,
    res: Response
) {
    const { requestId } = req.params;
    const adminId = req.userId;
    const { rejectionReason } = req.body;

    // Only ADMIN or MASTER can reject
    if (req.userRole !== "ADMIN" && req.userRole !== "MASTER") {
        return res.status(403).json({ success: false, message: "Only admins can reject requests" });
    }

    try {
        const request = await InstructorRequest.findOne({ requestId });
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

        const rejectedUser = await User.findOne({ uniqueId: request.userId });
        if (rejectedUser) {
            await createNotification({
                userId: (rejectedUser._id as string).toString(),
                type: "instructor_request_rejected",
                title: "❌ Instructor Request Rejected",
                message: `Your instructor request was rejected. Reason: ${rejectionReason || "Not specified"}. You can re-apply after 7 days.`,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Request rejected",
        });
    } catch (error) {
        console.error("Reject request error:", error);
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
        return res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error("Get contact messages error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}