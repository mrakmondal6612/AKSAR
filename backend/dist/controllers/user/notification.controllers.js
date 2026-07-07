"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetNotifications = handleGetNotifications;
exports.handleMarkAsRead = handleMarkAsRead;
exports.handleMarkAllAsRead = handleMarkAllAsRead;
exports.handleDeleteNotification = handleDeleteNotification;
exports.handleGetCourseTimeline = handleGetCourseTimeline;
exports.handleCreateCourseEnrollment = handleCreateCourseEnrollment;
const Notification_model_1 = __importDefault(require("../../models/Notification.model"));
async function handleGetNotifications(req, res) {
    try {
        const userId = req.userId;
        const { unreadOnly = false } = req.query;
        const filter = { user: userId };
        if (unreadOnly === 'true')
            filter.read = false;
        const notifications = await Notification_model_1.default.find(filter).sort({ createdAt: -1 }).limit(50);
        const unreadCount = await Notification_model_1.default.countDocuments({ user: userId, read: false });
        return res.status(200).json({ success: true, data: notifications, unreadCount });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
}
async function handleMarkAsRead(req, res) {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const notification = await Notification_model_1.default.findOne({ _id: id, user: userId });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        notification.read = true;
        notification.readAt = new Date();
        await notification.save();
        return res.status(200).json({ success: true, data: notification });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
}
async function handleMarkAllAsRead(req, res) {
    try {
        const userId = req.userId;
        await Notification_model_1.default.updateMany({ user: userId, read: false }, { read: true, readAt: new Date() });
        return res.status(200).json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to mark notifications as read' });
    }
}
async function handleDeleteNotification(req, res) {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const notification = await Notification_model_1.default.findOneAndDelete({ _id: id, user: userId });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        return res.status(200).json({ success: true, message: 'Notification deleted' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
}
async function handleGetCourseTimeline(req, res) {
    try {
        const userId = req.userId;
        const CourseEnrollment = require('../../models/CourseEnrollment.model').default;
        const enrollments = await CourseEnrollment.find({ user: userId, status: 'active' })
            .populate('course', 'name')
            .sort({ startDate: 1 });
        return res.status(200).json({ success: true, data: enrollments });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch timeline' });
    }
}
async function handleCreateCourseEnrollment(req, res) {
    try {
        const userId = req.userId;
        const { courseId, startDate, endDate } = req.body;
        if (!courseId || !startDate) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const CourseEnrollment = require('../../models/CourseEnrollment.model').default;
        const enrollment = await CourseEnrollment.create({
            user: userId,
            course: courseId,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
        });
        return res.status(201).json({ success: true, data: enrollment });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to create enrollment' });
    }
}
