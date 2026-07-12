import Notification from "../models/Notification.model";
import User from "../models/User.model";

type NotificationType =
    | 'todo_overdue'
    | 'todo_due_soon'
    | 'course_start'
    | 'course_end'
    | 'deadline_approaching'
    | 'course_enrolled'
    | 'new_video_added'
    | 'course_updated'
    | 'test_available'
    | 'certificate_earned'
    | 'instructor_request_approved'
    | 'instructor_request_rejected'
    | 'new_enrollment'
    | 'course_rated'
    | 'new_instructor_request'
    | 'new_contact_message'
    | 'admin_announcement';

// Create notification for a single user by their MongoDB _id or uniqueId
export async function createNotification({
                                             userId,
                                             type,
                                             title,
                                             message,
                                             courseId,
                                             link,
                                         }: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    courseId?: string;
    link?: string;
}) {
    try {
        await Notification.create({
            user: userId,
            type,
            title,
            message,
            course: courseId,
            link,
            read: false,
        });
    } catch (error) {
        console.error("[NotificationHelper] Error creating notification:", error);
    }
}

// Create notification for all users with a specific role
export async function createNotificationForRole({
                                                    role,
                                                    type,
                                                    title,
                                                    message,
                                                    link,
                                                }: {
    role: "STUDENT" | "INSTRUCTOR" | "ADMIN" | "MASTER" | "ALL";
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
}) {
    try {
        const query = role === "ALL" ? {} : { role };
        const users = await User.find(query).select("_id").lean();

        const notifications = users.map((user) => ({
            user: (user._id as string).toString(),
            type,
            title,
            message,
            link,
            read: false,
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error("[NotificationHelper] Error creating bulk notifications:", error);
    }
}

// Create notification for all enrolled students of a course
export async function createNotificationForEnrolledStudents({
                                                                enrolledIds,
                                                                type,
                                                                title,
                                                                message,
                                                                courseId,
                                                                link,
                                                            }: {
    enrolledIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    courseId?: string;
    link?: string;
}) {
    try {
        const users = await User.find({ uniqueId: { $in: enrolledIds } })
            .select("_id")
            .lean();

        const notifications = users.map((user) => ({
            user: (user._id as string).toString(),
            type,
            title,
            message,
            course: courseId,
            link,
            read: false,
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error("[NotificationHelper] Error creating enrolled student notifications:", error);
    }
}

// Notify all admins
export async function notifyAdmins({
                                       type,
                                       title,
                                       message,
                                       link,
                                   }: {
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
}) {
    try {
        const admins = await User.find({ role: { $in: ["ADMIN", "MASTER"] } })
            .select("_id")
            .lean();

        const notifications = admins.map((admin) => ({
            user: (admin._id as string).toString(),
            type,
            title,
            message,
            link,
            read: false,
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error("[NotificationHelper] Error notifying admins:", error);
    }
}