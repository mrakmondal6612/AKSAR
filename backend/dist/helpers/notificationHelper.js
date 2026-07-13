"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.createNotificationForRole = createNotificationForRole;
exports.createNotificationForEnrolledStudents = createNotificationForEnrolledStudents;
exports.notifyAdmins = notifyAdmins;
const Notification_model_1 = __importDefault(require("../models/Notification.model"));
const User_model_1 = __importDefault(require("../models/User.model"));
// Create notification for a single user by their MongoDB _id or uniqueId
async function createNotification({ userId, type, title, message, courseId, link, }) {
    try {
        await Notification_model_1.default.create({
            user: userId,
            type,
            title,
            message,
            course: courseId,
            link,
            read: false,
        });
    }
    catch (error) {
        console.error("[NotificationHelper] Error creating notification:", error);
    }
}
// Create notification for all users with a specific role
async function createNotificationForRole({ role, type, title, message, link, }) {
    try {
        const query = role === "ALL" ? {} : { role };
        const users = await User_model_1.default.find(query).select("_id").lean();
        const notifications = users.map((user) => ({
            user: user._id.toString(),
            type,
            title,
            message,
            link,
            read: false,
        }));
        if (notifications.length > 0) {
            await Notification_model_1.default.insertMany(notifications);
        }
    }
    catch (error) {
        console.error("[NotificationHelper] Error creating bulk notifications:", error);
    }
}
// Create notification for all enrolled students of a course
async function createNotificationForEnrolledStudents({ enrolledIds, type, title, message, courseId, link, }) {
    try {
        const users = await User_model_1.default.find({ uniqueId: { $in: enrolledIds } })
            .select("_id")
            .lean();
        const notifications = users.map((user) => ({
            user: user._id.toString(),
            type,
            title,
            message,
            course: courseId,
            link,
            read: false,
        }));
        if (notifications.length > 0) {
            await Notification_model_1.default.insertMany(notifications);
        }
    }
    catch (error) {
        console.error("[NotificationHelper] Error creating enrolled student notifications:", error);
    }
}
// Notify all admins
async function notifyAdmins({ type, title, message, link, }) {
    try {
        const admins = await User_model_1.default.find({ role: { $in: ["ADMIN", "MASTER"] } })
            .select("_id")
            .lean();
        const notifications = admins.map((admin) => ({
            user: admin._id.toString(),
            type,
            title,
            message,
            link,
            read: false,
        }));
        if (notifications.length > 0) {
            await Notification_model_1.default.insertMany(notifications);
        }
    }
    catch (error) {
        console.error("[NotificationHelper] Error notifying admins:", error);
    }
}
