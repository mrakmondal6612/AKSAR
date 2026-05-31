import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useAuthContext } from '@/context/authContext';
import * as todoService from '@/lib/todoService';
import * as notificationService from '@/lib/notificationService';
import { ErrorToast, SuccessToast } from '@/lib/toasts';
import { getVerifiedToken } from '@/lib/cookieService';
import { USER_API } from '@/lib/env';

// ============ TYPES ============

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: Date;
}

interface TimeSession {
  startTime: Date;
  endTime?: Date;
  duration: number;
  note?: string;
}

interface Recurrence {
  enabled: boolean;
  pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: string;
}

interface TodoItem {
  _id: string;
  text: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  priorityRank: number;
  dueDate?: string;
  category?: string;
  courseId?: string;
  tags: string[];
  subtasks: Subtask[];
  notificationEnabled: boolean;
  estimatedTime?: number;
  timeSessions: TimeSession[];
  timeSpent?: number;
  recurrence?: Recurrence;
}

interface Action {
  type: string;
  todoId?: string;
  previousState?: TodoItem[];
  timestamp?: number;
}

// ============ CONSTANTS ============

const STORAGE_KEY = 'aksar_todo_list';
const CATEGORIES = ['Work', 'Personal', 'Learning', 'Health', 'Shopping', 'Other'];

// ============ PRODUCTION TODO LIST COMPONENT ============

const ProductionTodoList = () => {
  const { isLoggedIn } = useAuthContext();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [filter, setFilter] = useState({ priority: 'all', category: 'all', search: '', status: 'all', tags: [] as string[] });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  // Production features
  const [selectedTodos, setSelectedTodos] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Action[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'name' | 'timeSpent'>('dueDate');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeTimeSession, setActiveTimeSession] = useState<{ todoId: string; startTime: Date } | null>(null);
  const recurringConfig = useRef<Recurrence>({ enabled: false, pattern: 'daily', interval: 1 });

  // ============ INIT & LOADING ============

  useEffect(() => {
    loadTodos();
    if (isLoggedIn) {
      loadCourses();
    }
    loadStats();
    setupKeyboardShortcuts();

    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [isLoggedIn]);

  const loadTodos = async () => {
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

  const loadCourses = async () => {
    try {
      const resp = await notificationService.fetchCourseTimeline();
      if (resp?.success && Array.isArray(resp.data)) {
        const mapped = resp.data
          .map((en: any) => {
            const course = en.course || en.courseId || en.courseData;
            if (!course) return null;
            return { id: course._id || course.id, title: course.title || course.name || 'Course' };
          })
          .filter(Boolean);
        setCourses(mapped as { id: string; title: string }[]);
      }
    } catch {
      /* ignore */
    }
  };

  const loadStats = async () => {
    if (!isLoggedIn) return;
    try {
      const resp = await todoService.fetchTodoStats();
      if (resp?.success) {
        setStats(resp.data);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  // ============ KEYBOARD SHORTCUTS ============

  const setupKeyboardShortcuts = () => {
    window.addEventListener('keydown', handleKeyboardShortcut);
  };

  const handleKeyboardShortcut = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'k') {
        e.preventDefault();
        // Focus search
      } else if (e.key === 'n') {
        e.preventDefault();
        setInputValue('');
      } else if (e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 's') {
        e.preventDefault();
        handleBulkExport();
      }
    }
  };

  // ============ UNDO/REDO ============

  const addToHistory = (action: Action) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...action, timestamp: Date.now() });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const action = history[newIndex];
      if (action.previousState) {
        setTodos(action.previousState);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const action = history[newIndex];
      if (action.previousState) {
        // Reconstruct the state after applying the action
        if (action.type === 'delete' && action.todoId) {
          const beforeState = history[newIndex - 1]?.previousState || todos;
          const afterState = beforeState.filter(t => t._id !== action.todoId);
          setTodos(afterState);
        } else if (action.type === 'bulkDelete') {
          // Get the todos that were deleted
          const stateBeforeDelete = action.previousState || todos;
          setTodos(stateBeforeDelete);
        }
      }
    }
  };

  // ============ CRUD OPERATIONS ============

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
          estimatedTime: undefined,
          recurrence: showRecurringModal ? recurringConfig.current : undefined,
        });
        if (resp?.success && resp.data) {
          const newTodos = [resp.data, ...todos];
          addToHistory({ type: 'create', previousState: todos });
          setTodos(newTodos);
          SuccessToast('Todo added successfully');
        }
      } catch (e) {
        ErrorToast('Failed to create todo');
      }
    } else {
      const newTodo: TodoItem = {
        _id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: trimmed,
        completed: false,
        priority,
        priorityRank: todos.length,
        dueDate: dueDate || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        courseId: selectedCourse || undefined,
        tags: [],
        subtasks: [],
        notificationEnabled: false,
        timeSessions: [],
        timeSpent: 0,
      };
      addToHistory({ type: 'create', previousState: todos });
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

    addToHistory({ type: 'toggle', todoId: id, previousState: todos });

    if (isLoggedIn) {
      try {
        const resp = await todoService.updateTodo(id, { completed: !todo.completed });
        if (resp?.success) {
          setTodos((prev) => prev.map((t) => (t._id === id ? resp.data : t)));
        }
      } catch (e) {
        setTodos((prev) => prev.map((t) => (t._id === id ? { ...t, completed: !t.completed } : t)));
      }
    } else {
      setTodos((prev) => prev.map((t) => (t._id === id ? { ...t, completed: !t.completed } : t)));
    }
  };

  const handleDeleteTodo = async (id: string) => {
    addToHistory({ type: 'delete', todoId: id, previousState: todos });

    if (isLoggedIn) {
      try {
        await todoService.deleteTodo(id);
        setTodos((prev) => prev.filter((t) => t._id !== id));
        SuccessToast('Todo deleted');
      } catch (e) {
        ErrorToast('Failed to delete');
      }
    } else {
      setTodos((prev) => prev.filter((t) => t._id !== id));
    }
  };

  // ============ BULK OPERATIONS ============

  const handleToggleTodoSelection = (id: string) => {
    const newSelection = new Set(selectedTodos);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTodos(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedTodos.size === filteredTodos.length) {
      setSelectedTodos(new Set());
    } else {
      setSelectedTodos(new Set(filteredTodos.map((t) => t._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTodos.size === 0) return;
    if (!confirm(`Delete ${selectedTodos.size} todos?`)) return;

    const ids = Array.from(selectedTodos);
    addToHistory({ type: 'bulkDelete', previousState: todos });

    setTodos((prev) => prev.filter((t) => !ids.includes(t._id)));
    setSelectedTodos(new Set());

    if (isLoggedIn) {
      try {
        await fetch('/api/v1/user/todos/bulk-delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ ids }),
        });
        SuccessToast(`Deleted ${ids.length} todos`);
      } catch {
        ErrorToast('Failed to bulk delete');
      }
    }
  };

  const handleBulkMarkComplete = async () => {
    if (selectedTodos.size === 0) return;

    const ids = Array.from(selectedTodos);
    addToHistory({ type: 'bulkUpdate', previousState: todos });

    setTodos((prev) =>
      prev.map((t) => (ids.includes(t._id) ? { ...t, completed: true, completedAt: new Date() } : t))
    );
    setSelectedTodos(new Set());

    if (isLoggedIn) {
      try {
        await fetch('/api/v1/user/todos/bulk-update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ ids, updates: { completed: true, completedAt: new Date() } }),
        });
        SuccessToast(`Marked ${ids.length} as complete`);
      } catch {
        ErrorToast('Failed to bulk update');
      }
    }
  };

  // ============ TIME TRACKING ============

  const handleStartTimer = (id: string) => {
    setActiveTimeSession({ todoId: id, startTime: new Date() });
    SuccessToast('Timer started');
  };

  const handleStopTimer = async (id: string) => {
    if (!activeTimeSession || activeTimeSession.todoId !== id) return;

    const duration = Math.round((Date.now() - activeTimeSession.startTime.getTime()) / 60000); // minutes

    if (isLoggedIn) {
      try {
        await fetch(`/api/v1/user/todos/${id}/time-session/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ note: '' }),
        });
      } catch {
        /* ignore */
      }
    }

    setTodos((prev) =>
      prev.map((t) =>
        t._id === id
          ? {
              ...t,
              timeSpent: (t.timeSpent || 0) + duration,
              timeSessions: [...t.timeSessions, { startTime: activeTimeSession.startTime, endTime: new Date(), duration, note: '' }],
            }
          : t
      )
    );
    setActiveTimeSession(null);
    SuccessToast(`Logged ${duration} minutes`);
  };

  // ============ EXPORT/IMPORT ============

  const handleBulkExport = async () => {
    if (isLoggedIn) {
      try {
        const token = getVerifiedToken();
        if (token) {
          window.location.href = `${USER_API}/todos/export/csv?Authorization=Bearer ${token}`;
        } else {
          // Fallback: export locally
          const csv = convertTodosToCSV(todos);
          downloadCSV(csv, 'todos.csv');
        }
        SuccessToast('Exporting todos...');
      } catch {
        ErrorToast('Failed to export');
      }
    } else {
      const csv = convertTodosToCSV(todos);
      downloadCSV(csv, 'todos.csv');
      SuccessToast('Exported locally');
    }
  };

  const handleBulkImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      let imported: TodoItem[] = [];

      try {
        if (file.name.endsWith('.json')) {
          imported = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          imported = parseCSVtoTodos(text);
        }

        if (isLoggedIn) {
          try {
            await fetch('/api/v1/user/todos/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
              body: JSON.stringify({ todos: imported }),
            });
          } catch {
            /* ignore */
          }
        }

        setTodos((prev) => [...prev, ...imported]);
        SuccessToast(`Imported ${imported.length} todos`);
      } catch {
        ErrorToast('Failed to parse file');
      }
    };
    input.click();
  };

  // ============ FILTERING & SORTING ============

  const filteredTodos = useMemo(() => {
    let result = todos;

    if (filter.status === 'completed') result = result.filter((t) => t.completed);
    else if (filter.status === 'pending') result = result.filter((t) => !t.completed);

    if (filter.priority !== 'all') result = result.filter((t) => t.priority === filter.priority);
    if (filter.category !== 'all') result = result.filter((t) => t.category === filter.category);
    if (filter.tags.length > 0) result = result.filter((t) => t.tags?.some((tag) => filter.tags.includes(tag)));

    if (filter.search) {
      result = result.filter(
        (todo) =>
          todo.text.toLowerCase().includes(filter.search.toLowerCase()) ||
          todo.description?.toLowerCase().includes(filter.search.toLowerCase())
      );
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'name':
          return a.text.localeCompare(b.text);
        case 'timeSpent':
          return (b.timeSpent || 0) - (a.timeSpent || 0);
        case 'dueDate':
        default:
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
    });

    return result;
  }, [todos, filter, sortBy]);

  // ============ RENDER ============

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Tasks</h1>
            <p className="text-gray-600 dark:text-gray-400">Production-ready task management</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              title="Ctrl+I"
            >
              📊 Analytics
            </button>
            <button onClick={handleBulkExport} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition" title="Ctrl+S">
              📥 Export
            </button>
            <button onClick={handleBulkImport} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
              📤 Import
            </button>
            {selectedTodos.size > 0 && (
              <>
                <button
                  onClick={handleBulkMarkComplete}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                >
                  ✓ Mark ({selectedTodos.size})
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  🗑️ Delete ({selectedTodos.size})
                </button>
              </>
            )}
            {history.length > 0 && (
              <>
                <button onClick={handleUndo} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition" title="Ctrl+Z">
                  ↶ Undo
                </button>
                <button onClick={handleRedo} className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition" title="Ctrl+Y">
                  ↷ Redo
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Stats Dashboard */}
        {stats && showAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8"
          >
            <StatCard label="Total" value={stats.total} color="blue" />
            <StatCard label="Completed" value={stats.completed} color="green" />
            <StatCard label="Progress" value={`${stats.completionRate}%`} color="purple" />
            <StatCard label="Overdue" value={stats.overdue} color="red" />
            <StatCard label="Time Spent" value={`${Math.round(stats.totalTimeSpent || 0)}m`} color="orange" />
            <StatCard label="Productivity" value={`${stats.productivity || 0}%`} color="indigo" />
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
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a new task... (Ctrl+N)"
              />
              <button
                onClick={handleAddTodo}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                Add
              </button>
              <button
                onClick={() => setShowRecurringModal(!showRecurringModal)}
                className={`px-4 py-3 rounded-lg font-medium transition ${showRecurringModal ? 'bg-blue-600 text-white' : 'bg-slate-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'}`}
              >
                🔁 Recurring
              </button>
            </div>

            {showRecurringModal && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-blue-50 dark:bg-slate-700 rounded-lg space-y-3">
                <select
                  value={recurringConfig.current.pattern}
                  onChange={(e) => (recurringConfig.current.pattern = e.target.value as any)}
                  className="px-3 py-2 rounded-lg border dark:bg-slate-600 dark:border-slate-500 text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <input
                  type="date"
                  onChange={(e) => (recurringConfig.current.endDate = e.target.value)}
                  className="px-3 py-2 rounded-lg border dark:bg-slate-600 dark:border-slate-500 text-sm w-full"
                  placeholder="End date (optional)"
                />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={recurringConfig.current.enabled} onChange={(e) => (recurringConfig.current.enabled = e.target.checked)} />
                  <span className="text-sm">Enable recurring</span>
                </label>
              </motion.div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
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
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Link Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm"
              />

              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-slate-300"
              >
                🔍 Filters
              </button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-3">
                <div className="flex flex-wrap gap-2">
                  {['all', 'pending', 'completed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilter((f) => ({ ...f, status }))}
                      className={`px-3 py-1 rounded-full text-sm ${
                        filter.status === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border dark:bg-slate-600 text-sm mt-1"
                    >
                      <option value="dueDate">Due Date</option>
                      <option value="priority">Priority</option>
                      <option value="name">Name</option>
                      <option value="timeSpent">Time Spent</option>
                    </select>
                  </label>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Todos List */}
        <AnimatePresence>
          {filteredTodos.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No tasks yet. Add one to get started! 🚀</p>
            </motion.div>
          ) : (
            <motion.div className="space-y-3" layout>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={selectedTodos.size === filteredTodos.length && filteredTodos.length > 0}
                  onChange={handleSelectAll}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTodos.size > 0 ? `${selectedTodos.size} selected` : 'Select all'}
                </span>
              </div>

              {filteredTodos.map((todo) => (
                <TodoCard
                  key={todo._id}
                  todo={todo}
                  isSelected={selectedTodos.has(todo._id)}
                  onSelect={() => handleToggleTodoSelection(todo._id)}
                  onToggle={() => handleToggleTodo(todo._id)}
                  onDelete={() => handleDeleteTodo(todo._id)}
                  onStartTimer={() => handleStartTimer(todo._id)}
                  onStopTimer={() => handleStopTimer(todo._id)}
                  isTimerActive={activeTimeSession?.todoId === todo._id}
                  courseTitle={courses.find((c) => c.id === todo.courseId)?.title}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ============ TODO CARD COMPONENT ============

const TodoCard = ({
  todo,
  isSelected,
  onSelect,
  onToggle,
  onDelete,
  onStartTimer,
  onStopTimer,
  isTimerActive,
  courseTitle,
}: any) => {
  const [expandedSubtasks, setExpandedSubtasks] = useState(false);

  const progressPercent = todo.subtasks.length > 0 ? Math.round((todo.subtasks.filter((s: any) => s.completed).length / todo.subtasks.length) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 transition ${todo.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="mt-1 w-5 h-5 cursor-pointer"
        />

        <button
          onClick={onToggle}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition flex items-center justify-center ${
            todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
          }`}
        >
          {todo.completed && <span className="text-white text-sm">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white break-words'}`}>
              {todo.text}
            </span>
            <span className="text-xl flex-shrink-0">{getPriorityIcon(todo.priority)}</span>
          </div>

          {/* Tags & Metadata */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {todo.category && (
              <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
                {todo.category}
              </span>
            )}
            {courseTitle && (
              <span className="px-2 py-1 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium">
                🎓 {courseTitle}
              </span>
            )}
            {todo.dueDate && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isOverdue(todo.dueDate) ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-slate-200 dark:bg-slate-700'}`}>
                📅 {formatDate(todo.dueDate)}
              </span>
            )}
            {todo.recurrence?.enabled && (
              <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-medium">
                🔁 {todo.recurrence.pattern}
              </span>
            )}
          </div>

          {/* Time Tracking */}
          {(todo.estimatedTime || todo.timeSpent) && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                ⏱️ {todo.timeSpent || 0}m / {todo.estimatedTime || '?'}m
              </span>
              <div className="flex gap-1">
                {!isTimerActive ? (
                  <button onClick={onStartTimer} className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded hover:bg-green-500/30">
                    ▶️ Start
                  </button>
                ) : (
                  <button onClick={onStopTimer} className="px-2 py-1 bg-red-500/20 text-red-600 dark:text-red-400 text-xs rounded hover:bg-red-500/30">
                    ⏹️ Stop
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Subtasks Progress */}
          {todo.subtasks.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setExpandedSubtasks(!expandedSubtasks)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {expandedSubtasks ? '▼' : '▶'} Subtasks ({todo.subtasks.filter((s: any) => s.completed).length}/{todo.subtasks.length})
                </button>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}
        </div>

        <button onClick={onDelete} className="flex-shrink-0 text-red-500 hover:text-red-600 transition text-lg">
          🗑️
        </button>
      </div>
    </motion.div>
  );
};

// ============ STAT CARD ============

const StatCard = ({ label, value, color }: { label: string; value: any; color: string }) => {
  const colors: any = {
    blue: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-500/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    red: 'bg-red-500/20 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <motion.div className={`${colors[color]} rounded-lg p-4 text-center`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80 mt-1">{label}</p>
    </motion.div>
  );
};

// ============ UTILITIES ============

const getPriorityIcon = (pri: string) => (pri === 'high' ? '🔴' : pri === 'medium' ? '🟡' : '🟢');

const isOverdue = (dueDate?: string) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
};

const formatDate = (date?: string) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const convertTodosToCSV = (todos: TodoItem[]): string => {
  const headers = ['Text', 'Priority', 'Category', 'Due Date', 'Status', 'Time Spent (min)'];
  const rows = todos.map((t) => [
    t.text,
    t.priority,
    t.category || '',
    t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
    t.completed ? 'Completed' : 'Pending',
    t.timeSpent || '0',
  ]);

  return [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
};

const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

const parseCSVtoTodos = (csv: string): TodoItem[] => {
  const lines = csv.split('\n');
  const todos: TodoItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(',');
    todos.push({
      _id: `import-${i}`,
      text: values[0]?.replace(/"/g, '') || '',
      priority: (values[1]?.replace(/"/g, '') as 'low' | 'medium' | 'high') || 'medium',
      category: values[2]?.replace(/"/g, ''),
      dueDate: values[3]?.replace(/"/g, ''),
      completed: values[4]?.replace(/"/g, '') === 'Completed',
      priorityRank: 0,
      subtasks: [],
      tags: [],
      notificationEnabled: false,
      timeSessions: [],
    });
  }

  return todos;
};

// ============ EXPORTS ============

export default ProductionTodoList;
