"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationJobRunner = notificationJobRunner;
exports.startNotificationScheduler = startNotificationScheduler;
exports.stopNotificationScheduler = stopNotificationScheduler;
const Todo_model_1 = __importDefault(require("../models/Todo.model"));
const Notification_model_1 = __importDefault(require("../models/Notification.model"));
const mailer_1 = require("../helpers/mailer");
const NOTIFICATION_HOURS_BEFORE = 24; // notify 24 hours before due date
const CHECK_INTERVAL = 60 * 60 * 1000; // run every hour
async function notificationJobRunner() {
    try {
        console.log('[Notification Job] Running notification check...');
        // Check for overdue todos
        const overdueTodos = await Todo_model_1.default.find({
            completed: false,
            dueDate: { $lt: new Date() },
            notificationEnabled: true,
        }).populate('user');
        for (const todo of overdueTodos) {
            const existingNotif = await Notification_model_1.default.findOne({
                todo: todo._id,
                type: 'todo_overdue',
            });
            if (!existingNotif) {
                const user = todo.user;
                await Notification_model_1.default.create({
                    user: todo.user,
                    todo: todo._id,
                    type: 'todo_overdue',
                    title: '⚠️ Task Overdue',
                    message: `Your task "${todo.text}" is overdue. Complete it now!`,
                    read: false,
                });
                if (user?.email) {
                    await (0, mailer_1.sendNotificationEmail)(user.email, 'Task Overdue', `Your task "${todo.text}" is overdue.`).catch(() => { });
                }
            }
        }
        // Check for todos due soon (24 hours)
        const tomorrow = new Date(Date.now() + NOTIFICATION_HOURS_BEFORE * 60 * 60 * 1000);
        const now = new Date();
        const dueSoonTodos = await Todo_model_1.default.find({
            completed: false,
            dueDate: { $gte: now, $lte: tomorrow },
            notificationEnabled: true,
        }).populate('user');
        for (const todo of dueSoonTodos) {
            const existingNotif = await Notification_model_1.default.findOne({
                todo: todo._id,
                type: 'todo_due_soon',
            });
            if (!existingNotif) {
                const user = todo.user;
                await Notification_model_1.default.create({
                    user: todo.user,
                    todo: todo._id,
                    type: 'todo_due_soon',
                    title: '📌 Task Due Soon',
                    message: `Your task "${todo.text}" is due in less than 24 hours.`,
                    read: false,
                });
                if (user?.email) {
                    await (0, mailer_1.sendNotificationEmail)(user.email, 'Task Due Soon', `Your task "${todo.text}" is due soon.`).catch(() => { });
                }
            }
        }
        console.log('[Notification Job] Check completed successfully');
    }
    catch (error) {
        console.error('[Notification Job] Error:', error);
    }
}
function startNotificationScheduler() {
    console.log('[Notification Scheduler] Starting...');
    // Run immediately on startup
    notificationJobRunner();
    // Then run at intervals
    setInterval(notificationJobRunner, CHECK_INTERVAL);
}
function stopNotificationScheduler() {
    console.log('[Notification Scheduler] Stopping...');
}
