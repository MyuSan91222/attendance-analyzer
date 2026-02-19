import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';

export function useAuth() {
  const { user, accessToken, isLoading, setAuth, clearAuth } = useAuthStore();

  const login = async (email, password, rememberMe) => {
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
