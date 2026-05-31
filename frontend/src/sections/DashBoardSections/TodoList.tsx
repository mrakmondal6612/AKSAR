import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useAuthContext } from '@/context/authContext';
import * as todoService from '@/lib/todoService';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

const STORAGE_KEY = 'aksar_todo_list';

const TodoList = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [inputValue, setInputValue] = useState('');

  const { isLoggedIn } = useAuthContext();

  useEffect(() => {
    const load = async () => {
      if (isLoggedIn) {
        try {
          const resp = await todoService.fetchTodos();
          if (resp?.success && Array.isArray(resp.data)) {
            const mapped = resp.data.map((t: any) => ({ id: t._id, text: t.text, completed: t.completed }));
            setTodos(mapped);
            return;
          }
        } catch (e) {
          // fall back to localStorage on error
        }
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setTodos(JSON.parse(stored));
        } catch {
          setTodos([]);
        }
      }
    };

    load();
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const activeCount = useMemo(() => todos.filter((todo) => !todo.completed).length, [todos]);

  const handleAddTodo = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (isLoggedIn) {
      try {
        const resp = await todoService.createTodo({ text: trimmed });
        if (resp?.success && resp.data) {
          const t = { id: resp.data._id, text: resp.data.text, completed: resp.data.completed };
          setTodos((prev) => [t, ...prev]);
          setInputValue('');
          return;
        }
      } catch (e) {
        // ignore and fallback to local behavior
      }
    }

    const newTodo: TodoItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      completed: false,
    };

    setTodos((prev) => [newTodo, ...prev]);
    setInputValue('');
  };

  const handleToggle = async (id: string) => {
    const existing = todos.find((t) => t.id === id);
    if (!existing) return;

    if (isLoggedIn) {
      try {
        const resp = await todoService.updateTodo(id, { completed: !existing.completed });
        if (resp?.success && resp.data) {
          setTodos((prev) => prev.map((todo) => todo.id === id ? { ...todo, completed: resp.data.completed } : todo));
          return;
        }
      } catch (e) {
        // fall through to local update
      }
    }

    setTodos((prev) => prev.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
  };

  const handleDelete = async (id: string) => {
    if (isLoggedIn) {
      try {
        const resp = await todoService.deleteTodo(id);
        if (resp?.success) {
          setTodos((prev) => prev.filter((todo) => todo.id !== id));
          return;
        }
      } catch (e) {
        // fall back
      }
    }

    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const handleClearCompleted = async () => {
    if (isLoggedIn) {
      try {
        const resp = await todoService.clearCompleted();
        if (resp?.success) {
          setTodos((prev) => prev.filter((todo) => !todo.completed));
          return;
        }
      } catch (e) {
        // fallback
      }
    }

    setTodos((prev) => prev.filter((todo) => !todo.completed));
  };

  return (
    <motion.div
      className="dark:bg-white/5 bg-black/5 rounded-lg p-6 shadow-2xl dark:shadow-sm dark:shadow-white border-2 dark:border-white border-black"
      variants={{
        hidden: { opacity: 0.3, scale: 0.8 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 }
      }}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Todo List</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Add tasks, mark them complete, and keep progress between refreshes.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleClearCompleted}
            className="rounded-full bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
          >
            Clear completed
          </button>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {activeCount} active
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleAddTodo()}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-sky-400 dark:focus:ring-sky-500/20"
          placeholder="Add a new todo item..."
        />
        <button
          type="button"
          onClick={handleAddTodo}
          className="rounded-xl bg-sky-600 px-6 py-3 text-white transition hover:bg-sky-700"
        >
          Add task
        </button>
      </div>

      <div className="space-y-3">
        {todos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
            No tasks yet. Add one to get started.
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => handleToggle(todo.id)}
                className="flex-1 text-left"
              >
                <span className={`text-base ${todo.completed ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                  {todo.text}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(todo.id)}
                className="ml-4 rounded-full bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default TodoList;
