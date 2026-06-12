import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import * as notificationService from '@/lib/notificationService';
import { SuccessToast } from '@/lib/toasts';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const resp = await notificationService.fetchNotifications();
      if (resp?.success) {
        setNotifications(resp.data || []);
        setUnreadCount(resp.unreadCount || 0);
      }
    } catch (e) {
      // error ignored
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const resp = await notificationService.markNotificationAsRead(id);
      if (resp?.success) {
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      // error ignored
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const resp = await notificationService.markAllNotificationsAsRead();
      if (resp?.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        SuccessToast('All notifications marked as read');
      }
    } catch (e) {
      // error ignored
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const resp = await notificationService.deleteNotification(id);
      if (resp?.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (e) {
      // error ignored
    }
  };

  const getIconByType = (type: string) => {
    switch (type) {
      case 'todo_overdue':
        return '⚠️';
      case 'todo_due_soon':
        return '📌';
      case 'course_start':
        return '🚀';
      case 'course_end':
        return '⏰';
      case 'deadline_approaching':
        return '📅';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition"
        title="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-96 max-h-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer ${
                        !notif.read ? 'bg-blue-50 dark:bg-slate-900' : ''
                      }`}
                      onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                    >
                      <div className="flex gap-3">
                        <span className="text-xl flex-shrink-0">{getIconByType(notif.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                            {notif.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
                            {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notif._id);
                          }}
                          className="text-red-500 hover:text-red-600 text-sm ml-2 flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
