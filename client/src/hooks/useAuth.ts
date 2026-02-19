import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';

export function useAuth() {
  const { user, accessToken, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    // On mount, try to refresh (handles remember-me cookie)
    const init = async () => {
      try {
        const { data } = await authApi.refresh();
        setAuth(data.user, data.accessToken);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const { data } = await authApi.login({ email, password, rememberMe });
    setAuth(data.user, data.accessToken);
    return data;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
  };

  return { user, accessToken, isLoading, isAuthenticated: !!user, login, logout };
}
