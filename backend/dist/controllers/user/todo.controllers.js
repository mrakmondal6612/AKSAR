"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetTodos = handleGetTodos;
exports.handleCreateTodo = handleCreateTodo;
exports.handleUpdateTodo = handleUpdateTodo;
exports.handleDeleteTodo = handleDeleteTodo;
exports.handleClearCompletedTodos = handleClearCompletedTodos;
exports.handleAddSubtask = handleAddSubtask;
exports.handleToggleSubtask = handleToggleSubtask;
exports.handleDeleteSubtask = handleDeleteSubtask;
exports.handleGetTodoStats = handleGetTodoStats;
const Todo_model_1 = __importDefault(require("../../models/Todo.model"));
const nanoid_1 = require("nanoid");
async function handleGetTodos(req, res) {
    try {
        const userId = req.userId;
        const { priority, category, courseId, search, sortBy = '-createdAt' } = req.query;
        const filter = { user: userId };
        if (priority && priority !== 'all')
            filter.priority = priority;
        if (category && category !== 'all')
            filter.category = category;
        if (courseId && courseId !== 'all')
            filter.courseId = courseId;
        if (search) {
            filter.$or = [
                { text: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } },
            ];
        }
        const todos = await Todo_model_1.default.find(filter).sort(sortBy);
        return res.status(200).json({ success: true, data: todos });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch todos' });
    }
}
async function handleCreateTodo(req, res) {
    try {
        const userId = req.userId;
        const { text, priority = 'medium', dueDate, category, tags = [], courseId, notificationEnabled = false } = req.body;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid todo text' });
        }
        const todo = await Todo_model_1.default.create({
            user: userId,
            text: text.trim(),
            priority,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            category,
            tags: Array.isArray(tags) ? tags : [],
            courseId,
            notificationEnabled,
            subtasks: [],
        });
        return res.status(201).json({ success: true, data: todo });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to create todo' });
    }
}
async function handleUpdateTodo(req, res) {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { text, completed, priority, dueDate, category, tags, courseId, notificationEnabled } = req.body;
        const todo = await Todo_model_1.default.findOne({ _id: id, user: userId });
        if (!todo)
            return res.status(404).json({ success: false, message: 'Todo not found' });
        if (typeof text === 'string')
            todo.text = text.trim();
        if (typeof completed === 'boolean') {
            todo.completed = completed;
            todo.completedAt = completed ? new Date() : undefined;
        }
        if (priority && ['low', 'medium', 'high'].includes(priority))
            todo.priority = priority;
        if (dueDate !== undefined)
            todo.dueDate = dueDate ? new Date(dueDate) : undefined;
        if (category !== undefined)
            todo.category = category;
        if (Array.isArray(tags))
            todo.tags = tags;
        if (courseId !== undefined)
            todo.courseId = courseId;
        if (typeof notificationEnabled === 'boolean')
            todo.notificationEnabled = notificationEnabled;
        await todo.save();
        return res.status(200).json({ success: true, data: todo });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update todo' });
    }
}
async function handleDeleteTodo(req, res) {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const todo = await Todo_model_1.default.findOneAndDelete({ _id: id, user: userId });
        if (!todo)
            return res.status(404).json({ success: false, message: 'Todo not found' });
        return res.status(200).json({ success: true, message: 'Todo deleted' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete todo' });
    }
}
async function handleClearCompletedTodos(req, res) {
    try {
        const userId = req.userId;
        await Todo_model_1.default.deleteMany({ user: userId, completed: true });
        return res.status(200).json({ success: true, message: 'Cleared completed todos' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to clear completed todos' });
    }
}
async function handleAddSubtask(req, res) {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { text } = req.body;
        if (!text || typeof text !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid subtask text' });
        }
        const todo = await Todo_model_1.default.findOne({ _id: id, user: userId });
        if (!todo)
            return res.status(404).json({ success: false, message: 'Todo not found' });
        const subtask = { id: (0, nanoid_1.nanoid)(8), text: text.trim(), completed: false };
        todo.subtasks.push(subtask);
        await todo.save();
        return res.status(200).json({ success: true, data: subtask });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to add subtask' });
    }
}
async function handleToggleSubtask(req, res) {
    try {
        const userId = req.userId;
        const { id, subtaskId } = req.params;
        const todo = await Todo_model_1.default.findOne({ _id: id, user: userId });
        if (!todo)
            return res.status(404).json({ success: false, message: 'Todo not found' });
        const subtask = todo.subtasks.find((s) => s.id === subtaskId);
        if (!subtask)
            return res.status(404).json({ success: false, message: 'Subtask not found' });
        subtask.completed = !subtask.completed;
        await todo.save();
        return res.status(200).json({ success: true, data: subtask });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to toggle subtask' });
    }
}
async function handleDeleteSubtask(req, res) {
    try {
        const userId = req.userId;
        const { id, subtaskId } = req.params;
        const todo = await Todo_model_1.default.findOne({ _id: id, user: userId });
        if (!todo)
            return res.status(404).json({ success: false, message: 'Todo not found' });
        todo.subtasks = todo.subtasks.filter((s) => s.id !== subtaskId);
        await todo.save();
        return res.status(200).json({ success: true, message: 'Subtask deleted' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete subtask' });
    }
}
async function handleGetTodoStats(req, res) {
    try {
        const userId = req.userId;
        const total = await Todo_model_1.default.countDocuments({ user: userId });
        const completed = await Todo_model_1.default.countDocuments({ user: userId, completed: true });
        const overdue = await Todo_model_1.default.countDocuments({ user: userId, completed: false, dueDate: { $lt: new Date() } });
        const byPriority = {
            high: await Todo_model_1.default.countDocuments({ user: userId, priority: 'high' }),
            medium: await Todo_model_1.default.countDocuments({ user: userId, priority: 'medium' }),
            low: await Todo_model_1.default.countDocuments({ user: userId, priority: 'low' }),
        };
        return res.status(200).json({
            success: true,
            data: {
                total,
                completed,
                remaining: total - completed,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
                overdue,
                byPriority,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
}
