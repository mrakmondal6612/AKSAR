"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const notificationSchema = new mongoose_1.default.Schema({
    user: { type: String, ref: 'User', required: true },
    todo: { type: String, ref: 'Todo' },
    course: { type: String, ref: 'Course' },
    type: {
        type: String,
        enum: ['todo_overdue', 'todo_due_soon', 'course_start', 'course_end', 'deadline_approaching'],
        required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    readAt: { type: Date },
}, { timestamps: true });
const Notification = mongoose_1.default.models.Notification || mongoose_1.default.model('Notification', notificationSchema);
exports.default = Notification;
