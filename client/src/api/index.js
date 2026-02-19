import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue = [];

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// These endpoints handle their own 401s — don't trigger token refresh on them
const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/login', '/auth/signup', '/auth/refresh',
  '/auth/forgot', '/auth/reset', '/auth/verify-email',
];

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const isPublicEndpoint = PUBLIC_AUTH_ENDPOINTS.some(ep => original.url?.includes(ep));
    if (error.response?.status === 401 && !original._retry && !isPublicEndpoint) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve) => {
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
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  forgot: (email) => api.post('/auth/forgot', { email }),
  reset: (data) => api.post('/auth/reset', data),
};

// Admin
export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getActivity: (params) => api.get('/admin/activity', { params }),
  clearActivity: (email) => api.delete('/admin/activity', { params: email ? { email } : {} }),
  updateRole: (email, role) => api.put(`/admin/users/${encodeURIComponent(email)}/role`, { role }),
};

export default api;
