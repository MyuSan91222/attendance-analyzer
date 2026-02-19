import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import { ForgotPasswordPage, ResetPasswordPage, VerifyEmailPage } from './pages/AuthPages';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';
import { authApi } from './api';

// Module-level flag prevents double-run in React StrictMode
let authInitialized = false;

// Runs once on app startup to restore session from the httpOnly refresh-token cookie
function AuthInitializer() {
  useEffect(() => {
    if (authInitialized) return;
    authInitialized = true;

    authApi.refresh()
      .then(({ data }) => useAuthStore.getState().setAuth(data.user, data.accessToken))
      .catch(() => useAuthStore.getState().clearAuth())
      .finally(() => useAuthStore.getState().setLoading(false));
  }, []);

  return null;
}

function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// Applies a slide-up animation whenever the top-level route changes
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Routes location={location}>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected routes */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={
          <AdminRoute><AdminPage /></AdminRoute>
        } />
      </Route>

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInitializer />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#142333',
            border: '1px solid #c8d3dc',
            borderRadius: '10px',
            fontSize: '13px',
            fontFamily: 'DM Sans, sans-serif',
          },
          success: { iconTheme: { primary: '#5a8fa3', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
        }}
      />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
