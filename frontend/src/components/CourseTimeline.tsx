import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import * as notificationService from '@/lib/notificationService';

interface CourseEnrollment {
  _id: string;
  course: { name: string } | string;
  startDate: string;
  endDate?: string;
  status: string;
}

export const CourseTimeline = () => {
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ courseId: '', startDate: '', endDate: '' });

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const resp = await notificationService.fetchCourseTimeline();
      if (resp?.success) {
        setEnrollments(resp.data || []);
      }
    } catch (e) {
      // error ignored
    }
    setLoading(false);
  };

  const handleAddEnrollment = async () => {
    if (!formData.courseId || !formData.startDate) return;

    try {
      const resp = await notificationService.createCourseEnrollment(
        formData.courseId,
        formData.startDate,
        formData.endDate
      );
      if (resp?.success) {
        setEnrollments((prev) => [...prev, resp.data]);
        setFormData({ courseId: '', startDate: '', endDate: '' });
        setShowForm(false);
      }
    } catch (e) {
      // error ignored
    }
  };

  const getProgressPercent = (startDate: string, endDate?: string) => {
    const start = new Date(startDate).getTime();
    const end = endDate ? new Date(endDate).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (now < start) return 0;
    if (now > end) return 100;

    return Math.round(((now - start) / (end - start)) * 100);
  };

  const getDaysLeft = (endDate?: string) => {
    if (!endDate) return 'No deadline';
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Ended';
    if (days === 0) return 'Ends today';
    if (days === 1) return 'Ends tomorrow';
    return `${days} days left`;
  };

  return (
    <motion.div
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Timeline</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your course enrollment periods and deadlines
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          {showForm ? 'Cancel' : '+ Add Course'}
        </button>
      </div>

      {/* Add Course Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3"
        >
          <input
            type="text"
            placeholder="Course ID"
            value={formData.courseId}
            onChange={(e) => setFormData((f) => ({ ...f, courseId: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="End date (optional)"
          />
          <button
            onClick={handleAddEnrollment}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            Add Enrollment
          </button>
        </motion.div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading timeline...</div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No course enrollments yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment, idx) => {
            const courseName = typeof enrollment.course === 'object' ? enrollment.course.name : 'Course';
            const progress = getProgressPercent(enrollment.startDate, enrollment.endDate);

            return (
              <motion.div
                key={enrollment._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{courseName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {new Date(enrollment.startDate).toLocaleDateString()} →{' '}
                      {enrollment.endDate ? new Date(enrollment.endDate).toLocaleDateString() : 'Ongoing'}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      enrollment.status === 'active'
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {enrollment.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{progress}% complete</span>
                    <span className="text-gray-600 dark:text-gray-400">{getDaysLeft(enrollment.endDate)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default CourseTimeline;
