import { create } from 'zustand';
import type { User, AuthState } from '../types';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAuth: (user: User, accessToken: string) => set({ user, accessToken }),
  setToken: (accessToken: string) => set({ accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));
