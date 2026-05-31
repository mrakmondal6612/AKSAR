import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '@/context/authContext';
import * as todoService from '@/lib/todoService';
import * as notificationService from '@/lib/notificationService';
import { ErrorToast, SuccessToast } from '@/lib/toasts';

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoItem {
  _id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  category?: string;
  courseId?: string;
  tags: string[];
  subtasks: Subtask[];
  notificationEnabled: boolean;
}

interface TodoStats {
  total: number;
  completed: number;
  remaining: number;
  completionRate: number;
  overdue: number;
  byPriority: { high: number; medium: number; low: number };
}

const STORAGE_KEY = 'aksar_todo_list';
const CATEGORIES = ['Work', 'Personal', 'Learning', 'Health', 'Shopping', 'Other'];
const PRIORITY_COLORS = {
  high: 'bg-red-500/20 border-red-500/50 text-red-600 dark:text-red-400',
  medium: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-600 dark:text-yellow-400',
  low: 'bg-green-500/20 border-green-500/50 text-green-600 dark:text-green-400',
};

const ModernTodoList = () => {
  const { isLoggedIn } = useAuthContext();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [filter, setFilter] = useState({ priority: 'all', category: 'all', search: '' });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [expandedTodo, setExpandedTodo] = useState<string | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<{ todoId: string; subtaskId: string } | null>(null);
  const [subtaskText, setSubtaskText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodos();
    if (isLoggedIn) loadCourses();
  }, [isLoggedIn]);

  const loadCourses = async () => {
    try {
      const resp = await notificationService.fetchCourseTimeline();
      if (resp?.success && Array.isArray(resp.data)) {
        const mapped = resp.data
          .map((enrollment: any) => {
            const course = enrollment.course || enrollment.courseId || enrollment.courseData;
            if (!course) return null;
            return {
              id: course._id || course.id || course,
              title: course.title || course.name || 'Course',
            };
          })
          .filter(Boolean);
        setCourses(mapped as { id: string; title: string }[]);
      }
    } catch {
      // ignore failures silently
    }
  };

  const loadTodos = async () => {
    setLoading(true);
    if (isLoggedIn) {
      try {
        const resp = await todoService.fetchTodos();
        if (resp?.success && Array.isArray(resp.data)) {
          setTodos(resp.data);
        } else {
          loadLocalTodos();
        }
      } catch (e) {
        loadLocalTodos();
      }
    } else {
      loadLocalTodos();
    }

    try {
      const statsResp = await todoService.fetchTodoStats();
      if (statsResp?.success) setStats(statsResp.data);
    } catch (e) {
      // stats error ignored
    }

    setLoading(false);
  };

  const loadLocalTodos = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTodos(JSON.parse(stored));
      } catch {
        setTodos([]);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (filter.priority !== 'all' && todo.priority !== filter.priority) return false;
      if (filter.category !== 'all' && todo.category !== filter.category) return false;
      if (filter.search && !todo.text.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  }, [todos, filter]);

  const handleAddTodo = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (isLoggedIn) {
      try {
        const resp = await todoService.createTodo({
          text: trimmed,
          priority,
          dueDate: dueDate || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          courseId: selectedCourse || undefined,
          tags: [],
        });
        if (resp?.success && resp.data) {
          setTodos((prev) => [resp.data, ...prev]);
          SuccessToast('Todo added successfully');
        }
      } catch (e) {
        // fallback to local
      }
    } else {
      const newTodo: TodoItem = {
        _id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: trimmed,
        completed: false,
        priority,
        dueDate: dueDate || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        courseId: selectedCourse || undefined,
        tags: [],
        subtasks: [],
        notificationEnabled: false,
      };
      setTodos((prev) => [newTodo, ...prev]);
    }

    setInputValue('');
    setDueDate('');
    setPriority('medium');
    setSelectedCategory('all');
    setSelectedCourse('');
  };

  const handleToggleTodo = async (id: string) => {
    const todo = todos.find((t) => t._id === id);
    if (!todo) return;

    if (isLoggedIn) {
      try {
        const resp = await todoService.updateTodo(id, { completed: !todo.completed });
        if (resp?.success) {
          setTodos((prev) => prev.map((t) => (t._id === id ? resp.data : t)));
          SuccessToast(resp.data.completed ? 'Todo completed!' : 'Todo reopened');
        }
      } catch (e) {
        // fallback
      }
    } else {
      setTodos((prev) => prev.map((t) => (t._id === id ? { ...t, completed: !t.completed } : t)));
    }
  };

  const handleDeleteTodo = async (id: string) => {
    if (isLoggedIn) {
      try {
        const resp = await todoService.deleteTodo(id);
        if (resp?.success) {
          setTodos((prev) => prev.filter((t) => t._id !== id));
          SuccessToast('Todo deleted');
        }
      } catch (e) {
        ErrorToast('Failed to delete');
      }
    } else {
      setTodos((prev) => prev.filter((t) => t._id !== id));
    }
  };

  const handleAddSubtask = async (todoId: string) => {
    if (!subtaskText.trim()) return;

    if (isLoggedIn) {
      try {
        const resp = await todoService.addSubtask(todoId, subtaskText);
        if (resp?.success) {
          setTodos((prev) =>
            prev.map((t) => (t._id === todoId ? { ...t, subtasks: [...t.subtasks, resp.data] } : t))
          );
          setSubtaskText('');
          SuccessToast('Subtask added');
        }
      } catch (e) {
        ErrorToast('Failed to add subtask');
      }
    }
  };

  const handleToggleSubtask = async (todoId: string, subtaskId: string) => {
    if (isLoggedIn) {
      try {
        const resp = await todoService.toggleSubtask(todoId, subtaskId);
        if (resp?.success) {
          setTodos((prev) =>
            prev.map((t) =>
              t._id === todoId
                ? {
                    ...t,
                    subtasks: t.subtasks.map((s) => (s.id === subtaskId ? resp.data : s)),
                  }
                : t
            )
          );
        }
      } catch (e) {
        ErrorToast('Failed to update subtask');
      }
    }
  };

  const handleDeleteSubtask = async (todoId: string, subtaskId: string) => {
    if (isLoggedIn) {
      try {
        const resp = await todoService.deleteSubtask(todoId, subtaskId);
        if (resp?.success) {
          setTodos((prev) =>
            prev.map((t) =>
              t._id === todoId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) } : t
            )
          );
          SuccessToast('Subtask deleted');
        }
      } catch (e) {
        ErrorToast('Failed to delete subtask');
      }
    }
  };

  const handleClearCompleted = async () => {
    if (isLoggedIn) {
      try {
        const resp = await todoService.clearCompleted();
        if (resp?.success) {
          setTodos((prev) => prev.filter((t) => !t.completed));
          SuccessToast('Cleared completed todos');
        }
      } catch (e) {
        ErrorToast('Failed to clear completed');
      }
    } else {
      setTodos((prev) => prev.filter((t) => !t.completed));
    }
  };

  const getPriorityIcon = (pri: string) => {
    return pri === 'high' ? '🔴' : pri === 'medium' ? '🟡' : '🟢';
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getCourseTitle = (courseId?: string) => {
    if (!courseId) return '';
    return courses.find((course) => course.id === courseId)?.title || 'Linked course';
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400">Organize, prioritize, and achieve your goals</p>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StatCard label="Total" value={stats.total} color="blue" />
            <StatCard label="Completed" value={stats.completed} color="green" />
            <StatCard label="Remaining" value={stats.remaining} color="orange" />
            <StatCard label="Progress" value={`${stats.completionRate}%`} color="purple" />
            <StatCard label="Overdue" value={stats.overdue} color="red" />
          </motion.div>
        )}

        {/* Create Todo */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Add a new task..."
              />
              <button
                onClick={handleAddTodo}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                Add
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Link to course (optional)</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Priority: Low</option>
                <option value="medium">Priority: Medium</option>
                <option value="high">Priority: High</option>
              </select>

              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handleClearCompleted}
                className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium transition"
              >
                Clear Completed
              </button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="flex flex-wrap gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {['all', 'high', 'medium', 'low'].map((pri) => (
            <button
              key={pri}
              onClick={() => setFilter((f) => ({ ...f, priority: pri }))}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter.priority === pri
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {pri === 'all' ? 'All' : pri.charAt(0).toUpperCase() + pri.slice(1)}
            </button>
          ))}

          <input
            type="text"
            placeholder="Search..."
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
            className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </motion.div>

        {/* Todo List */}
        <AnimatePresence>
          {filteredTodos.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-12"
            >
              <p className="text-gray-500 dark:text-gray-400 text-lg">No tasks yet. Add one to get started! 🚀</p>
            </motion.div>
          ) : (
            <motion.div className="space-y-3" layout>
              {filteredTodos.map((todo) => (
                <motion.div
                  key={todo._id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 transition ${
                    todo.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleTodo(todo._id)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition flex items-center justify-center ${
                        todo.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                      }`}
                    >
                      {todo.completed && <span className="text-white text-sm">✓</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-lg ${todo.completed ? 'line-through text-gray-400' : ''} text-gray-900 dark:text-white break-words`}
                        >
                          {todo.text}
                        </span>
                        <span className="text-xl flex-shrink-0">{getPriorityIcon(todo.priority)}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {todo.category && (
                          <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
                            {todo.category}
                          </span>
                        )}
                        {todo.courseId && (
                          <span className="px-2 py-1 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium">
                            🎓 {getCourseTitle(todo.courseId)}
                          </span>
                        )}
                        {todo.dueDate && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isOverdue(todo.dueDate)
                                ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                                : 'bg-slate-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            📅 {formatDate(todo.dueDate)}
                          </span>
                        )}
                      </div>

                      {/* Subtasks */}
                      {todo.subtasks.length > 0 && (
                        <div className="mb-3 pl-2 border-l-2 border-slate-300 dark:border-slate-600 space-y-1">
                          {todo.subtasks.map((sub) => (
                            <div key={sub.id} className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleSubtask(todo._id, sub.id)}
                                className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition ${
                                  sub.completed
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}
                              >
                                {sub.completed && <span className="text-white text-xs">✓</span>}
                              </button>
                              <span
                                className={`text-sm ${
                                  sub.completed
                                    ? 'line-through text-gray-400'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {sub.text}
                              </span>
                              <button
                                onClick={() => handleDeleteSubtask(todo._id, sub.id)}
                                className="text-red-500 hover:text-red-600 text-sm ml-auto"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Expand Button */}
                      <button
                        onClick={() => setExpandedTodo(expandedTodo === todo._id ? null : todo._id)}
                        className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                      >
                        {expandedTodo === todo._id ? '▼ Hide details' : '▶ Show details'}
                      </button>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedTodo === todo._id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2"
                          >
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={subtaskText}
                                onChange={(e) => setSubtaskText(e.target.value)}
                                placeholder="Add subtask..."
                                className="flex-1 px-2 py-1 rounded text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(todo._id)}
                              />
                              <button
                                onClick={() => handleAddSubtask(todo._id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                              >
                                Add
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={() => handleDeleteTodo(todo._id)}
                      className="flex-shrink-0 text-red-500 hover:text-red-600 transition text-lg"
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: any; color: string }) => {
  const colors = {
    blue: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    red: 'bg-red-500/20 text-red-600 dark:text-red-400',
  };

  return (
    <motion.div
      className={`${colors[color]} rounded-lg p-4 text-center`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80 mt-1">{label}</p>
    </motion.div>
  );
};

export default ModernTodoList;
