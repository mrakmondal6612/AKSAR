"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const subtaskSchema = new mongoose_1.default.Schema({
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
}, { _id: false });
const timeSessionSchema = new mongoose_1.default.Schema({
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number, required: true }, // minutes
    note: { type: String },
}, { _id: false });
const recurrenceSchema = new mongoose_1.default.Schema({
    enabled: { type: Boolean, default: false },
    pattern: { type: String, enum: ['daily', 'weekly', 'biweekly', 'monthly', 'custom'], default: 'daily' },
    interval: { type: Number, default: 1 },
    daysOfWeek: [Number],
    dayOfMonth: Number,
    endDate: Date,
    nextDueDate: Date,
    createdFromParent: String,
}, { _id: false });
const commentSchema = new mongoose_1.default.Schema({
    user: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: false });
const historySchema = new mongoose_1.default.Schema({
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    changedBy: String,
    oldValue: mongoose_1.default.Schema.Types.Mixed,
    newValue: mongoose_1.default.Schema.Types.Mixed,
}, { _id: false });
const todoSchema = new mongoose_1.default.Schema({
    user: { type: String, ref: 'User', required: true },
    text: { type: String, required: true },
    description: { type: String },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    priorityRank: { type: Number, default: 0 },
    dueDate: { type: Date },
    category: { type: String },
    subtasks: [subtaskSchema],
    courseId: { type: String, ref: 'Course' },
    notificationEnabled: { type: Boolean, default: false },
    completedAt: { type: Date },
    tags: [String],
    // Recurring
    recurrence: recurrenceSchema,
    // Time tracking
    estimatedTime: { type: Number }, // minutes
    timeSessions: [timeSessionSchema],
    timeSpent: { type: Number, default: 0 }, // minutes
    // Advanced
    attachments: [String],
    comments: [commentSchema],
    collaborators: [String],
    history: [historySchema],
}, { timestamps: true });
// Index for efficient querying
todoSchema.index({ user: 1, dueDate: 1 });
todoSchema.index({ user: 1, completed: 1, priority: 1 });
todoSchema.index({ 'recurrence.enabled': 1, 'recurrence.nextDueDate': 1 });
const Todo = mongoose_1.default.models.Todo || mongoose_1.default.model('Todo', todoSchema);
exports.default = Todo;
