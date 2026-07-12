import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import * as notificationService from '@/lib/notificationService';
import { SuccessToast } from '@/lib/toasts';
import { useAuthContext } from '@/context/authContext';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

const getIconByType = (type: string) => {
  switch (type) {
    case 'todo_overdue': return '⚠️';
    case 'todo_due_soon': return '📌';
    case 'course_start': return '🚀';
    case 'course_end': return '⏰';
    case 'deadline_approaching': return '📅';
    case 'course_enrolled': return '🎉';
    case 'new_video_added': return '🎬';
    case 'course_updated': return '📝';
    case 'test_available': return '📋';
    case 'certificate_earned': return '🏆';
    case 'instructor_request_approved': return '✅';
    case 'instructor_request_rejected': return '❌';
    case 'new_enrollment': return '👤';
    case 'course_rated': return '⭐';
    case 'new_instructor_request': return '📥';
    case 'new_contact_message': return '📩';
    case 'admin_announcement': return '📢';
    default: return '🔔';
  }
};

export const NotificationCenter = () => {
  const { isLoggedIn } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanel]);

  const loadNotifications = async () => {
    try {
      const resp = await notificationService.fetchNotifications();
      if (resp?.success) {
        setNotifications(resp.data || []);
        setUnreadCount(resp.unreadCount || 0);
      }
    } catch {
      // silently ignore
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const resp = await notificationService.markAllNotificationsAsRead();
      if (resp?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        SuccessToast('All notifications marked as read');
      }
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch { /* ignore */ }
  };

  if (!isLoggedIn) return null;

  return (
      <div className="relative" ref={panelRef}>
        {/* Bell button */}
        <button
            onClick={() => setShowPanel(prev => !prev)}
            className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition"
            title="Notifications"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
          )}
        </button>

        {/* Panel */}
        <AnimatePresence>
          {showPanel && (
              <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[420px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                  <h3 className="text-base font-bold font-ubuntu text-gray-900 dark:text-white">
                    Notifications
                    {unreadCount > 0 && (
                        <span className="ml-2 text-xs bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                    )}
                  </h3>
                  {unreadCount > 0 && (
                      <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-ubuntu"
                      >
                        Mark all read
                      </button>
                  )}
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 scrollbar-thin">
                  {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-3xl mb-2">🔕</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-ubuntu">
                          No notifications yet
                        </p>
                      </div>
                  ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {notifications.map(notif => (
                            <motion.div
                                key={notif._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition cursor-pointer ${
                                    !notif.read ? 'bg-blue-50/50 dark:bg-slate-900/80' : ''
                                }`}
                                onClick={() => {
                                  if (!notif.read) handleMarkAsRead(notif._id);
                                }}
                            >
                              <div className="flex gap-2.5">
                        <span className="text-lg flex-shrink-0 mt-0.5">
                          {getIconByType(notif.type)}
                        </span>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 dark:text-white text-xs font-ubuntu">
                                    {notif.title}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 break-words font-ubuntu">
                                    {notif.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1 font-ubuntu">
                                    {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  {!notif.read && (
                                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />
                                  )}
                                  <button
                                      onClick={e => { e.stopPropagation(); handleDelete(notif._id); }}
                                      className="text-gray-400 hover:text-red-500 text-xs transition"
                                  >
                                    ✕
                                  </button>
                                </div>
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