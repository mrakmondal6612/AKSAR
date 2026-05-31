import { Request, Response } from 'express';
import Todo from '../../models/Todo.model';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';

export async function handleGetTodos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { priority, category, courseId, search, sortBy = '-createdAt' } = req.query;

    const filter: any = { user: userId };
    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;
    if (courseId && courseId !== 'all') filter.courseId = courseId;
    if (search) {
      filter.$or = [
        { text: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } },
      ];
    }

    const todos = await Todo.find(filter).sort(sortBy as string);
    return res.status(200).json({ success: true, data: todos });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch todos' });
  }
}

export async function handleCreateTodo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { text, priority = 'medium', dueDate, category, tags = [], courseId, notificationEnabled = false } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid todo text' });
    }

    const todo = await Todo.create({
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
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create todo' });
  }
}

export async function handleUpdateTodo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { text, completed, priority, dueDate, category, tags, courseId, notificationEnabled } = req.body;

    const todo = await Todo.findOne({ _id: id, user: userId });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    if (typeof text === 'string') todo.text = text.trim();
    if (typeof completed === 'boolean') {
      todo.completed = completed;
      todo.completedAt = completed ? new Date() : undefined;
    }
    if (priority && ['low', 'medium', 'high'].includes(priority)) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (category !== undefined) todo.category = category;
    if (Array.isArray(tags)) todo.tags = tags;
    if (courseId !== undefined) todo.courseId = courseId;
    if (typeof notificationEnabled === 'boolean') todo.notificationEnabled = notificationEnabled;

    await todo.save();
    return res.status(200).json({ success: true, data: todo });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update todo' });
  }
}

export async function handleDeleteTodo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const todo = await Todo.findOneAndDelete({ _id: id, user: userId });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    return res.status(200).json({ success: true, message: 'Todo deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete todo' });
  }
}

export async function handleClearCompletedTodos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    await Todo.deleteMany({ user: userId, completed: true });
    return res.status(200).json({ success: true, message: 'Cleared completed todos' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to clear completed todos' });
  }
}

export async function handleAddSubtask(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid subtask text' });
    }

    const todo = await Todo.findOne({ _id: id, user: userId });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    const subtask = { id: nanoid(8), text: text.trim(), completed: false };
    todo.subtasks.push(subtask);
    await todo.save();

    return res.status(200).json({ success: true, data: subtask });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to add subtask' });
  }
}

export async function handleToggleSubtask(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id, subtaskId } = req.params;

    const todo = await Todo.findOne({ _id: id, user: userId });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    const subtask = todo.subtasks.find((s: any) => s.id === subtaskId);
    if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' });

    subtask.completed = !subtask.completed;
    await todo.save();

    return res.status(200).json({ success: true, data: subtask });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to toggle subtask' });
  }
}

export async function handleDeleteSubtask(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id, subtaskId } = req.params;

    const todo = await Todo.findOne({ _id: id, user: userId });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    todo.subtasks = todo.subtasks.filter((s: any) => s.id !== subtaskId);
    await todo.save();

    return res.status(200).json({ success: true, message: 'Subtask deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete subtask' });
  }
}

export async function handleGetTodoStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    const total = await Todo.countDocuments({ user: userId });
    const completed = await Todo.countDocuments({ user: userId, completed: true });
    const overdue = await Todo.countDocuments({ user: userId, completed: false, dueDate: { $lt: new Date() } });
    const byPriority = {
      high: await Todo.countDocuments({ user: userId, priority: 'high' }),
      medium: await Todo.countDocuments({ user: userId, priority: 'medium' }),
      low: await Todo.countDocuments({ user: userId, priority: 'low' }),
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
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
}
