import axios from 'axios';
import { getVerifiedToken } from './cookieService';
import { USER_API } from './env';

const getAuthHeaders = () => {
  const token = getVerifiedToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchNotifications = async (unreadOnly = false) => {
  const response = await axios.get(
    `${USER_API}/notifications?unreadOnly=${unreadOnly}`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  const response = await axios.put(
    `${USER_API}/notifications/${id}/read`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await axios.put(
    `${USER_API}/notifications/mark-all-read`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const deleteNotification = async (id: string) => {
  const response = await axios.delete(
    `${USER_API}/notifications/${id}`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const fetchCourseTimeline = async () => {
  const response = await axios.get(
    `${USER_API}/course-timeline`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const createCourseEnrollment = async (courseId: string, startDate: string, endDate?: string) => {
  const response = await axios.post(
    `${USER_API}/course-enrollment`,
    { courseId, startDate, endDate },
    { headers: getAuthHeaders() }
  );
  return response.data;
};
