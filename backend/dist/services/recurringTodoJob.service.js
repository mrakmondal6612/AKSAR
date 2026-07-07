"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopRecurringTodoScheduler = exports.startRecurringTodoScheduler = exports.recurringTodoJobRunner = void 0;
const Todo_model_1 = __importDefault(require("../models/Todo.model"));
const recurringTodoJobRunner = async () => {
    try {
        const now = new Date();
        // Find all recurring todos where nextDueDate <= now and not ended
        const recurringTodos = await Todo_model_1.default.find({
            'recurrence.enabled': true,
            'recurrence.nextDueDate': { $lte: now },
            'recurrence.endDate': { $gt: now },
        });
        for (const parentTodo of recurringTodos) {
            if (!parentTodo.recurrence)
                continue;
            // Generate new instance
            const newTodo = new Todo_model_1.default({
                user: parentTodo.user,
                text: parentTodo.text,
                description: parentTodo.description,
                category: parentTodo.category,
                priority: parentTodo.priority,
                courseId: parentTodo.courseId,
                tags: parentTodo.tags,
                notificationEnabled: parentTodo.notificationEnabled,
                estimatedTime: parentTodo.estimatedTime,
                recurrence: {
                    enabled: false, // new instance is not recurring
                    createdFromParent: parentTodo._id.toString(),
                },
                dueDate: new Date(parentTodo.recurrence.nextDueDate),
            });
            await newTodo.save();
            // Calculate next due date
            const nextDueDate = calculateNextDueDate(parentTodo.recurrence.nextDueDate, parentTodo.recurrence.pattern, parentTodo.recurrence.interval, parentTodo.recurrence.daysOfWeek, parentTodo.recurrence.dayOfMonth);
            // Update parent with new nextDueDate
            if (nextDueDate && (!parentTodo.recurrence.endDate || nextDueDate <= parentTodo.recurrence.endDate)) {
                parentTodo.recurrence.nextDueDate = nextDueDate;
                await parentTodo.save();
            }
            else {
                // End recurrence if past endDate
                parentTodo.recurrence.enabled = false;
                await parentTodo.save();
            }
        }
        console.log(`[RecurringTodoJob] Generated ${recurringTodos.length} recurring todos at ${now.toISOString()}`);
    }
    catch (error) {
        console.error('[RecurringTodoJob] Error:', error);
    }
};
exports.recurringTodoJobRunner = recurringTodoJobRunner;
const calculateNextDueDate = (currentDate, pattern, interval, daysOfWeek, dayOfMonth) => {
    const next = new Date(currentDate);
    switch (pattern) {
        case 'daily':
            next.setDate(next.getDate() + interval);
            break;
        case 'weekly':
            if (daysOfWeek && daysOfWeek.length > 0) {
                const currentDay = next.getDay();
                const nextDay = daysOfWeek.find((d) => d > currentDay) || daysOfWeek[0];
                const daysToAdd = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
                next.setDate(next.getDate() + daysToAdd);
            }
            else {
                next.setDate(next.getDate() + 7 * interval);
            }
            break;
        case 'biweekly':
            next.setDate(next.getDate() + 14 * interval);
            break;
        case 'monthly':
            if (dayOfMonth) {
                next.setMonth(next.getMonth() + interval);
                next.setDate(dayOfMonth);
            }
            else {
                next.setMonth(next.getMonth() + interval);
            }
            break;
        case 'custom':
            next.setDate(next.getDate() + interval);
            break;
        default:
            return null;
    }
    return next;
};
let recurringJobInterval = null;
const startRecurringTodoScheduler = () => {
    // Run immediately on startup
    (0, exports.recurringTodoJobRunner)();
    // Then run every hour
    const CHECK_INTERVAL = 3600000; // 1 hour
    recurringJobInterval = setInterval(exports.recurringTodoJobRunner, CHECK_INTERVAL);
    console.log('[RecurringTodoScheduler] Started - checks every hour');
};
exports.startRecurringTodoScheduler = startRecurringTodoScheduler;
const stopRecurringTodoScheduler = () => {
    if (recurringJobInterval) {
        clearInterval(recurringJobInterval);
        recurringJobInterval = null;
        console.log('[RecurringTodoScheduler] Stopped');
    }
};
exports.stopRecurringTodoScheduler = stopRecurringTodoScheduler;
