import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Shield, LayoutDashboard, Crown, Clock, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

function formatRelativeTime(isoStr) {
  if (!isoStr) return null;
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(isoStr).toLocaleDateString();
}

function formatDate(isoStr) {
  if (!isoStr) return null;
  return new Date(isoStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <header className="h-14 border-b border-ink-800 bg-ink-950 flex items-center px-6 gap-6 flex-shrink-0 z-10">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
        <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
          <span className="text-ink-950 font-bold text-xs" style={{ fontFamily: 'Syne' }}>A</span>
        </div>
        <span className="text-ink-100 font-semibold text-sm hidden sm:block" style={{ fontFamily: 'Syne' }}>
          AttendanceAnalyzer
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
              location.pathname === to
                ? 'bg-ink-800 text-ink-100'
                : 'text-ink-500 hover:text-ink-300 hover:bg-ink-800/50'
            }`}>
            <Icon size={14} />
            <span className="hidden sm:block">{label}</span>
          </Link>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="ml-auto flex items-center gap-3">

        {/* User info panel */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isAdmin ? 'bg-amber-500/20 ring-1 ring-amber-500/50' : 'bg-ink-800'
          }`}>
            {isAdmin
              ? <Crown size={14} className="text-amber-400" />
              : <User size={14} className="text-ink-400" />
            }
          </div>

          {/* Text info */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <p className="text-xs font-medium text-ink-200 leading-none">{user?.email}</p>
              {isAdmin && (
                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 leading-none">
                  <Crown size={9} /> Admin
                </span>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 mt-0.5">
              {user?.lastLogin ? (
                <span className="flex items-center gap-1 text-[10px] text-ink-500">
                  <Clock size={9} />
                  {formatRelativeTime(user.lastLogin)}
                </span>
              ) : (
                <span className="text-[10px] text-ink-600">First login</span>
              )}
              {user?.createdAt && (
                <span className="flex items-center gap-1 text-[10px] text-ink-700">
                  <Calendar size={9} />
                  {formatDate(user.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-ink-800 hidden sm:block" />

        {/* Sign out */}
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-ink-500 hover:text-danger transition-colors text-sm py-1.5 px-2 rounded-lg hover:bg-danger/10">
          <LogOut size={14} />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    </header>
  );
}
