import axios from 'axios';
import { getVerifiedToken } from './cookieService';
import { USER_API } from './env';

const getAuthHeaders = () => {
  const token = getVerifiedToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============ BASIC CRUD ============

export const fetchTodos = async (filters?: {
  priority?: string;
  category?: string;
  search?: string;
  status?: string;
  tags?: string[];
  sortBy?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.tags) {
    filters.tags.forEach((tag) => params.append('tags', tag));
  }

  const response = await axios.get(`${USER_API}/todos?${params.toString()}`, { headers: getAuthHeaders() });
  return response.data;
};

export const createTodo = async (payload: {
  text: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  category?: string;
  courseId?: string;
  tags?: string[];
  estimatedTime?: number;
  notificationEnabled?: boolean;
  recurrence?: any;
}) => {
  const response = await axios.post(`${USER_API}/todos`, payload, { headers: getAuthHeaders() });
  return response.data;
};

export const updateTodo = async (id: string, payload: any) => {
  const response = await axios.put(`${USER_API}/todos/${id}`, payload, { headers: getAuthHeaders() });
  return response.data;
};

export const deleteTodo = async (id: string) => {
  const response = await axios.delete(`${USER_API}/todos/${id}`, { headers: getAuthHeaders() });
  return response.data;
};

export const clearCompleted = async () => {
  const response = await axios.delete(`${USER_API}/todos/clear-completed`, { headers: getAuthHeaders() });
  return response.data;
};

// ============ SUBTASKS ============

export const addSubtask = async (todoId: string, text: string) => {
  const response = await axios.post(`${USER_API}/todos/${todoId}/subtasks`, { text }, { headers: getAuthHeaders() });
  return response.data;
};

export const toggleSubtask = async (todoId: string, subtaskId: string) => {
  const response = await axios.put(`${USER_API}/todos/${todoId}/subtasks/${subtaskId}`, {}, { headers: getAuthHeaders() });
  return response.data;
};

export const deleteSubtask = async (todoId: string, subtaskId: string) => {
  const response = await axios.delete(`${USER_API}/todos/${todoId}/subtasks/${subtaskId}`, { headers: getAuthHeaders() });
  return response.data;
};

// ============ TIME TRACKING ============

export const startTimeSession = async (todoId: string) => {
  const response = await axios.post(`${USER_API}/todos/${todoId}/time-session/start`, {}, { headers: getAuthHeaders() });
  return response.data;
};

export const stopTimeSession = async (todoId: string, note?: string) => {
  const response = await axios.post(`${USER_API}/todos/${todoId}/time-session/stop`, { note }, { headers: getAuthHeaders() });
  return response.data;
};

// ============ BULK OPERATIONS ============

export const bulkUpdateTodos = async (ids: string[], updates: any) => {
  const response = await axios.put(`${USER_API}/todos/bulk-update`, { ids, updates }, { headers: getAuthHeaders() });
  return response.data;
};

export const bulkDeleteTodos = async (ids: string[]) => {
  const response = await axios.delete(`${USER_API}/todos/bulk-delete`, { data: { ids }, headers: getAuthHeaders() });
  return response.data;
};

export const reorderTodos = async (orders: Array<{ id: string; priorityRank: number }>) => {
  const response = await axios.post(`${USER_API}/todos/reorder`, { orders }, { headers: getAuthHeaders() });
  return response.data;
};

// ============ ANALYTICS & STATS ============

export const fetchTodoStats = async () => {
  const response = await axios.get(`${USER_API}/todos/stats`, { headers: getAuthHeaders() });
  return response.data;
};

export const fetchProductivityInsights = async (days: number = 30) => {
  const response = await axios.get(`${USER_API}/todos/insights/productivity?days=${days}`, { headers: getAuthHeaders() });
  return response.data;
};

// ============ EXPORT/IMPORT ============

export const exportTodosCSV = async () => {
  window.location.href = `${USER_API}/todos/export/csv?Authorization=Bearer ${getVerifiedToken()}`;
};

export const importTodos = async (todos: any[]) => {
  const response = await axios.post(`${USER_API}/todos/import`, { todos }, { headers: getAuthHeaders() });
  return response.data;
};

