import Todo from '../models/Todo.model';
import Notification from '../models/Notification.model';
import User from '../models/User.model';
import { sendNotificationEmail } from '../helpers/mailer';

const NOTIFICATION_HOURS_BEFORE = 24; // notify 24 hours before due date
const CHECK_INTERVAL = 60 * 60 * 1000; // run every hour

export async function notificationJobRunner() {
  try {
    console.log('[Notification Job] Running notification check...');

    // Check for overdue todos
    const overdueTodos = await Todo.find({
      completed: false,
      dueDate: { $lt: new Date() },
      notificationEnabled: true,
    }).populate('user');

    for (const todo of overdueTodos) {
      const existingNotif = await Notification.findOne({
        todo: todo._id,
        type: 'todo_overdue',
      });

      if (!existingNotif) {
        const user = todo.user as any;
        await Notification.create({
          user: todo.user,
          todo: todo._id,
          type: 'todo_overdue',
          title: '⚠️ Task Overdue',
          message: `Your task "${todo.text}" is overdue. Complete it now!`,
          read: false,
        });

        if (user?.email) {
          await sendNotificationEmail(user.email, 'Task Overdue', `Your task "${todo.text}" is overdue.`).catch(
            () => {}
          );
        }
      }
    }

    // Check for todos due soon (24 hours)
    const tomorrow = new Date(Date.now() + NOTIFICATION_HOURS_BEFORE * 60 * 60 * 1000);
    const now = new Date();

    const dueSoonTodos = await Todo.find({
      completed: false,
      dueDate: { $gte: now, $lte: tomorrow },
      notificationEnabled: true,
    }).populate('user');

    for (const todo of dueSoonTodos) {
      const existingNotif = await Notification.findOne({
        todo: todo._id,
        type: 'todo_due_soon',
      });

      if (!existingNotif) {
        const user = todo.user as any;
        await Notification.create({
          user: todo.user,
          todo: todo._id,
          type: 'todo_due_soon',
          title: '📌 Task Due Soon',
          message: `Your task "${todo.text}" is due in less than 24 hours.`,
          read: false,
        });

        if (user?.email) {
          await sendNotificationEmail(user.email, 'Task Due Soon', `Your task "${todo.text}" is due soon.`).catch(
            () => {}
          );
        }
      }
    }

    console.log('[Notification Job] Check completed successfully');
  } catch (error) {
    console.error('[Notification Job] Error:', error);
  }
}

export function startNotificationScheduler() {
  console.log('[Notification Scheduler] Starting...');

  // Run immediately on startup
  notificationJobRunner();

  // Then run at intervals
  setInterval(notificationJobRunner, CHECK_INTERVAL);
}

export function stopNotificationScheduler() {
  console.log('[Notification Scheduler] Stopping...');
}
