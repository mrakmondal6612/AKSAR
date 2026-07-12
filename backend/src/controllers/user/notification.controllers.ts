import { Response } from 'express';
import Notification from '../../models/Notification.model';
import { AuthenticatedRequest, AuthenticatedAdminRequest } from '../../middleware/auth.middleware';
import { createNotificationForRole } from '../../helpers/notificationHelper';

export async function handleGetNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { unreadOnly = false } = req.query;

    const filter: Record<string, unknown> = { user: userId };
    if (unreadOnly === 'true') filter.read = false;

    const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    return res.status(200).json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
}

export async function handleMarkAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, user: userId });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
}

export async function handleMarkAllAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    await Notification.updateMany({ user: userId, read: false }, { read: true, readAt: new Date() });

    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
  }
}

export async function handleDeleteNotification(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({ _id: id, user: userId });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
}

export async function handleGetCourseTimeline(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const CourseEnrollment = require('../../models/CourseEnrollment.model').default;

    const enrollments = await CourseEnrollment.find({ user: userId, status: 'active' })
        .populate('course', 'name')
        .sort({ startDate: 1 });

    return res.status(200).json({ success: true, data: enrollments });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch timeline' });
  }
}

export async function handleCreateCourseEnrollment(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { courseId, startDate, endDate } = req.body;

    if (!courseId || !startDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const CourseEnrollment = require('../../models/CourseEnrollment.model').default;

    const enrollment = await CourseEnrollment.create({
      user: userId,
      course: courseId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create enrollment' });
  }
}

// ── Admin: Send announcement to all users of a role ───────────────────────────
export async function handleSendAnnouncementFunction(
    req: AuthenticatedAdminRequest,
    res: Response
) {
  const { title, message, targetRole } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: "Title and message are required" });
  }

  const validRoles = ["ALL", "STUDENT", "INSTRUCTOR", "ADMIN", "MASTER"];
  if (targetRole && !validRoles.includes(targetRole)) {
    return res.status(400).json({ success: false, message: "Invalid target role" });
  }

  try {
    await createNotificationForRole({
      role: targetRole || "ALL",
      type: "admin_announcement",
      title: `📢 ${title}`,
      message,
    });

    return res.status(200).json({
      success: true,
      message: `Announcement sent to ${targetRole || "ALL"} users`,
    });
  } catch (error) {
    console.error("Send announcement error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}