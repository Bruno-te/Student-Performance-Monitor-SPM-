import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
};

// Courses API
export const coursesAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  addStudent: (id, studentId) => api.post(`/courses/${id}/students`, { studentId }),
};

// Assignments API
export const assignmentsAPI = {
  getAll: () => api.get('/assignments'),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  submit: (id, data) => api.post(`/assignments/${id}/submit`, data),
};

// Grades API
export const gradesAPI = {
  getAll: () => api.get('/grades'),
  getById: (id) => api.get(`/grades/${id}`),
  getByStudent: (studentId) => api.get(`/grades/student/${studentId}`),
  create: (data) => api.post('/grades', data),
  update: (id, data) => api.put(`/grades/${id}`, data),
};

// Messages API
export const messagesAPI = {
  getAll: () => api.get('/messages'),
  getInbox: () => api.get('/messages/inbox'),
  getSent: () => api.get('/messages/sent'),
  getById: (id) => api.get(`/messages/${id}`),
  create: (data) => api.post('/messages', data),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
};

// Attendance API
export const attendanceAPI = {
  getAll: () => api.get('/attendance'),
  getByStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
};

// Dashboard API
export const dashboardAPI = {
  getData: () => api.get('/dashboard'),
};

export default api;

