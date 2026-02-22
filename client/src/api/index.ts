import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || '/api',
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    // Never intercept 401s from auth endpoints — let them propagate to the caller
    const isAuthEndpoint = original.url?.includes('/auth/login') ||
                           original.url?.includes('/auth/signup') ||
                           original.url?.includes('/auth/refresh');
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      isRefreshing = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        useAuthStore.getState().setAuth(data.user, data.accessToken);
        refreshQueue.forEach(cb => cb(data.accessToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearAuth();
        refreshQueue = [];
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  signup: (data: { email: string; password: string }) => api.post('/auth/signup', data),
  login: (data: { email: string; password: string; rememberMe: boolean }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
  forgot: (email: string) => api.post('/auth/forgot', { email }),
  reset: (data: { token: string; password: string }) => api.post('/auth/reset', data),
};

// Admin
export const adminApi = {
  getUsers: (params?: { page?: number; search?: string }) => api.get('/admin/users', { params }),
  getActivity: (params?: { page?: number; email?: string }) => api.get('/admin/activity', { params }),
  getAttendance: (params?: { page?: number; user_id?: string }) => api.get('/admin/attendance', { params }),
  getUserStats: (userId: string | number) => api.get(`/admin/users/${userId}/stats`),
  clearActivity: (email?: string) => api.delete('/admin/activity', { params: email ? { email } : {} }),
  updateRole: (email: string, role: string) => api.put(`/admin/users/${encodeURIComponent(email)}/role`, { role }),
};

export default api;
