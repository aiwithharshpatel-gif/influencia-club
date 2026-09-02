import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    let token = null;
    const isAdminTarget = config.url?.includes('/admin') || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));
    if (isAdminTarget) {
      token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    } else {
      token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const isAuthRequest = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/admin-login') || 
                          originalRequest.url?.includes('/auth/brand-login') ||
                          originalRequest.url?.includes('/auth/refresh') ||
                          originalRequest.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, null, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (response.data.success && response.data.token) {
          localStorage.setItem('token', response.data.token);
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

