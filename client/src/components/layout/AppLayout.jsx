import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Navbar from './Navbar';

export function ProtectedRoute({ adminOnly = false }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-ink-700 border-t-accent rounded-full animate-spin" />
          <p className="text-ink-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return null; // signals "OK" — used with wrapper
}

export default function AppLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-ink-700 border-t-accent rounded-full animate-spin" />
          <p className="text-ink-500 text-sm" style={{ fontFamily: 'Syne' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-ink-950">
      <Navbar />
      <div key={location.pathname} className="flex-1 overflow-hidden animate-fade-in">
        <Outlet />
      </div>
    </div>
  );
}
