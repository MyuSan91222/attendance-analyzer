import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Shield, LayoutDashboard, Settings, HelpCircle, SearchCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

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
    { to: '/lost-found', label: 'Lost & Found', icon: SearchCheck },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/help', label: 'Help', icon: HelpCircle },
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

      {/* Sign out */}
      <div className="ml-auto flex items-center gap-2">
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-ink-500 hover:text-danger transition-colors text-sm py-1.5 px-2 rounded-lg hover:bg-danger/10">
          <LogOut size={14} />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    </header>
  );
}
