import { Request, Response } from 'express';
import Todo from '../../models/Todo.model';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';

// ============ CORE CRUD ============

export async function handleGetTodos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { priority, category, courseId, search, sortBy = '-dueDate', status = 'all', tags } = req.query;

    const filter: any = { user: userId };

    if (status === 'completed') filter.completed = true;
    else if (status === 'pending') filter.completed = false;

    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;
    if (courseId && courseId !== 'all') filter.courseId = courseId;

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    if (search) {
      filter.$or = [
        { text: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } },
      ];
    }

    let sortOptions: any = {};
    const sortStr = sortBy as string;
    if (sortStr.includes('-')) {
      sortOptions[sortStr.slice(1)] = -1;
    } else {
      sortOptions[sortStr] = 1;
    }

    const todos = await Todo.find(filter)
      .sort(sortOptions)
      .select('+completedAt +timeSpent +estimatedTime +recurrence +priority +priorityRank');

    return res.status(200).json({ success: true, data: todos, count: todos.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch todos', error: String(error) });
  }
}

export async function handleCreateTodo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const {
      text,
      description,
      priority = 'medium',
      dueDate,
      category,
      tags = [],
      courseId,
      notificationEnabled = false,
      estimatedTime,
      recurrence,
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid todo text' });
    }

    const todo = await Todo.create({
      user: userId,
      text: text.trim(),
      description: description || undefined,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      category,
      tags: Array.isArray(tags) ? tags : [],
      courseId,
      notificationEnabled,
      estimatedTime: estimatedTime ? Number(estimatedTime) : undefined,
      subtasks: [],
      timeSessions: [],
      timeSpent: 0,
      recurrence: recurrence
        ? {
            enabled: recurrence.enabled || false,
            pattern: recurrence.pattern || 'daily',
            interval: recurrence.interval || 1,
            daysOfWeek: recurrence.daysOfWeek,
            dayOfMonth: recurrence.dayOfMonth,
            endDate: recurrence.endDate ? new Date(recurrence.endDate) : undefined,
            nextDueDate: recurrence.nextDueDate ? new Date(recurrence.nextDueDate) : undefined,
          }
        : undefined,
    });

    return res.status(201).json({ success: true, data: todo });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create todo', error: String(error) });
  }
}

export async function handleUpdateTodo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const {
      text,
      description,
      completed,
      priority,
      priorityRank,
      dueDate,
      category,
      tags,
      courseId,
      notificationEnabled,
      estimatedTime,
      recurrence,
    } = req.body;

    const todo = await Todo.findOne({ _id: id, user: userId });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    const changes: any[] = [];

    if (typeof text === 'string') {
      changes.push({ field: 'text', old: todo.text, new: text });
      todo.text = text.trim();
    }
    if (typeof description === 'string') todo.description = description;
    if (typeof completed === 'boolean') {
      changes.push({ field: 'completed', old: todo.completed, new: completed });
      todo.completed = completed;
      todo.completedAt = completed ? new Date() : undefined;
    }
    if (priority && ['low', 'medium', 'high'].includes(priority)) {
      changes.push({ field: 'priority', old: todo.priority, new: priority });
      todo.priority = priority;
    }
    if (typeof priorityRank === 'number') todo.priorityRank = priorityRank;
    if (dueDate !== undefined) todo.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (category !== undefined) todo.category = category;
    if (Array.isArray(tags)) todo.tags = tags;
    if (courseId !== undefined) todo.courseId = courseId;
    if (typeof notificationEnabled === 'boolean') todo.notificationEnabled = notificationEnabled;
    if (typeof estimatedTime === 'number') todo.estimatedTime = estimatedTime;
    if (recurrence) {
      todo.recurrence = {
        enabled: recurrence.enabled || false,
        pattern: recurrence.pattern || 'daily',
        interval: recurrence.interval || 1,
        daysOfWeek: recurrence.daysOfWeek,
        dayOfMonth: recurrence.dayOfMonth,
        endDate: recurrence.endDate ? new Date(recurrence.endDate) : undefined,
        nextDueDate: recurrence.nextDueDate ? new Date(recurrence.nextDueDate) : undefined,
      };
    }

    // Add to history
    if (changes.length > 0 && !todo.history) todo.history = [];
    changes.forEach((c) => {
      todo.history?.push({
        action: 'updated',
        timestamp: new Date(),
        changedBy: userId,
        oldValue: c.old,
        newValue: c.new,
      });
    });

    await todo.save();
    return res.status(200).json({ success: true, data: todo });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update todo', error: String(error) });
  }
}

export async function handleDeleteTodo(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await Todo.findOneAndDelete({ _id: id, user: userId });
    if (!result) return res.status(404).json({ success: false, message: 'Todo not found' });

    return res.status(200).json({ success: true, message: 'Todo deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete todo' });
  }
}

// ============ SUBTASKS ============

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

    return res.status(201).json({ success: true, data: subtask });
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
    subtask.completedAt = subtask.completed ? new Date() : undefined;
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

// ============ TIME TRACKING ============

export async function handleStartTimeSession(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const todo = await Todo.findOne({ _id: id, user: userId });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    const session = { startTime: new Date(), duration: 0 };
    todo.timeSessions.push(session);
    await todo.save();

    return res.status(201).json({ success: true, data: session });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to start time session' });
  }
}

export async function handleStopTimeSession(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { note } = req.body;

    const todo = await Todo.findOne({ _id: id, user: userId });
    if (!todo) return res.status(404).json({ success: false, message: 'Todo not found' });

    const lastSession = todo.timeSessions[todo.timeSessions.length - 1];
    if (!lastSession || lastSession.endTime) {
      return res.status(400).json({ success: false, message: 'No active session' });
    }

    lastSession.endTime = new Date();
    lastSession.duration = Math.round((lastSession.endTime.getTime() - lastSession.startTime.getTime()) / 60000); // minutes
    if (note) lastSession.note = note;

    todo.timeSpent = (todo.timeSpent || 0) + lastSession.duration;
    await todo.save();

    return res.status(200).json({ success: true, data: lastSession });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to stop time session' });
  }
}

// ============ BULK OPERATIONS ============

export async function handleBulkUpdateTodos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { ids, updates } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid IDs' });
    }

    const result = await Todo.updateMany({ _id: { $in: ids }, user: userId }, updates);

    return res.status(200).json({ success: true, message: `Updated ${result.modifiedCount} todos` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to bulk update todos' });
  }
}

export async function handleBulkDeleteTodos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid IDs' });
    }

    const result = await Todo.deleteMany({ _id: { $in: ids }, user: userId });

    return res.status(200).json({ success: true, message: `Deleted ${result.deletedCount} todos` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to bulk delete todos' });
  }
}

export async function handleReorderTodos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { orders } = req.body; // [{ id, priorityRank }]

    if (!Array.isArray(orders)) {
      return res.status(400).json({ success: false, message: 'Invalid orders' });
    }

    for (const { id, priorityRank } of orders) {
      await Todo.updateOne({ _id: id, user: userId }, { priorityRank });
    }

    return res.status(200).json({ success: true, message: 'Reordered todos' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reorder todos' });
  }
}

export async function handleClearCompleted(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const result = await Todo.deleteMany({ user: userId, completed: true });

    return res.status(200).json({ success: true, message: `Cleared ${result.deletedCount} completed todos` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to clear completed todos' });
  }
}

// ============ ANALYTICS & STATS ============

export async function handleGetTodoStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    const stats = await Todo.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          pending: { $sum: { $cond: ['$completed', 0, 1] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$dueDate', null] },
                    { $lt: ['$dueDate', new Date()] },
                    { $eq: ['$completed', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
          totalEstimatedTime: { $sum: { $cond: ['$estimatedTime', '$estimatedTime', 0] } },
          totalTimeSpent: { $sum: { $cond: ['$timeSpent', '$timeSpent', 0] } },
          avgTimeSpent: { $avg: '$timeSpent' },
        } as any,
      },
    ]);

    const data = stats[0] || {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0,
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0,
      totalEstimatedTime: 0,
      totalTimeSpent: 0,
      avgTimeSpent: 0,
    };

    const completionRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
    const productivity = data.totalEstimatedTime > 0 ? Math.round((data.totalTimeSpent / data.totalEstimatedTime) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        total: data.total,
        completed: data.completed,
        pending: data.pending,
        overdue: data.overdue,
        byPriority: {
          high: data.highPriority,
          medium: data.mediumPriority,
          low: data.lowPriority,
        },
        totalEstimatedTime: data.totalEstimatedTime,
        totalTimeSpent: data.totalTimeSpent,
        avgTimeSpent: data.avgTimeSpent,
        completionRate,
        productivity,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stats', error: String(error) });
  }
}

export async function handleGetProductivityInsights(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const insights = await Todo.aggregate([
      {
        $match: {
          user: userId,
          updatedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          timeSpent: { $sum: '$timeSpent' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: insights,
      period: `${days} days`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch insights', error: String(error) });
  }
}

// ============ EXPORT/IMPORT ============

export async function handleExportTodos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const todos = await Todo.find({ user: userId });

    const csv = convertTodosToCSV(todos);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="todos.csv"');
    res.send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to export todos' });
  }
}

export async function handleImportTodos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { todos } = req.body;

    if (!Array.isArray(todos)) {
      return res.status(400).json({ success: false, message: 'Invalid import format' });
    }

    const imported = todos.map((t: any) => ({
      ...t,
      user: userId,
      _id: undefined, // Generate new IDs
    }));

    const result = await Todo.insertMany(imported);

    return res.status(201).json({
      success: true,
      message: `Imported ${result.length} todos`,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to import todos', error: String(error) });
  }
}

function convertTodosToCSV(todos: any[]): string {
  const headers = ['Text', 'Description', 'Priority', 'Category', 'Due Date', 'Status', 'Estimated Time (min)', 'Time Spent (min)', 'Tags'];
  const rows = todos.map((t) => [
    t.text,
    t.description || '',
    t.priority,
    t.category || '',
    t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
    t.completed ? 'Completed' : 'Pending',
    t.estimatedTime || '',
    t.timeSpent || '',
    Array.isArray(t.tags) ? t.tags.join(';') : '',
  ]);

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

  return csvContent;
}
