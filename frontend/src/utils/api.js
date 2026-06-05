import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = [
      '/auth/login',
      '/auth/admin-login',
      '/auth/register',
      '/auth/verify-otp',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password'
    ].some((path) => originalRequest?.url?.includes(path));

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        // Refresh token endpoint expects httpOnly cookie
        const response = await axios.post(`${API_URL}/auth/refresh`, null, {
          withCredentials: true
        });

        if (response.data.success) {
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Redirect to login handled by AuthContext or components
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
