import { useState, useEffect } from 'react';
import { Search, Trash2, Shield, User, RefreshCw, Clock, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../api';

export default function AdminPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.getUsers({ page, search });
      setUsers(data.users);
      setTotal(data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setIsLoading(false); }
  };

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.getActivity({ page, email: search });
      setLogs(data.logs);
      setTotal(data.total);
    } catch { toast.error('Failed to load activity'); }
    finally { setIsLoading(false); }
  };

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.getAttendance({ page, user_id: search });
      setSessions(data.sessions);
      setAttendanceStats(data.stats);
      setTotal(data.total);
    } catch { toast.error('Failed to load attendance'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    else if (tab === 'activity') fetchActivity();
    else if (tab === 'attendance') fetchAttendance();
  }, [tab, page, search]);

  const handleRoleToggle = async (email, current) => {
    const newRole = current === 'admin' ? 'user' : 'admin';
    try {
      await adminApi.updateRole(email, newRole);
      toast.success(`Updated ${email} to ${newRole}`);
      fetchUsers();
    } catch { toast.error('Failed to update role'); }
  };

  const handleClearActivity = async (email) => {
    if (!confirm(email ? `Clear all activity for ${email}?` : 'Clear ALL activity logs?')) return;
    try {
      await adminApi.clearActivity(email);
      toast.success('Activity cleared');
      fetchActivity();
    } catch { toast.error('Failed to clear activity'); }
  };

  const actionColor = (action) => {
    if (action === 'login') return 'text-success';
    if (action === 'logout') return 'text-ink-500';
    if (action.includes('reset') || action.includes('clear')) return 'text-danger';
    return 'text-ink-400';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-100" style={{ fontFamily: 'Syne' }}>Admin Panel</h1>
        <p className="text-ink-500 text-sm mt-1">Manage users and monitor activity</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-ink-900 rounded-lg mb-6 w-fit">
        {['users', 'activity', 'attendance'].map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); setSearch(''); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
              tab === t ? 'bg-ink-800 text-ink-100' : 'text-ink-500 hover:text-ink-300'
            }`} style={{ fontFamily: 'Syne' }}>
            {t === 'attendance' ? '📊 Attendance' : t}
          </button>
        ))}
      </div>

      {/* Search + actions */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input className="input pl-9" placeholder={tab === 'users' ? 'Search email...' : 'Filter by email...'}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button onClick={tab === 'users' ? fetchUsers : tab === 'activity' ? fetchActivity : fetchAttendance} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={14} />Refresh
        </button>
        {tab === 'activity' && (
          <button onClick={() => handleClearActivity()} className="btn-danger flex items-center gap-2">
            <Trash2 size={14} />Clear All
          </button>
        )}
      </div>

      {/* Users Table */}
      {tab === 'users' && (
        <div className="card overflow-hidden">
          {/* Header summary */}
          <div className="px-4 py-3 border-b border-ink-800 flex items-center justify-between bg-ink-900/40">
            <div className="flex items-center gap-2">
              <User size={14} className="text-ink-500" />
              <span className="text-xs text-ink-500" style={{ fontFamily: 'Syne' }}>
                ALL REGISTERED ACCOUNTS
              </span>
            </div>
            <span className="text-xs font-mono text-ink-400">
              {total} total
            </span>
          </div>

          <table className="w-full">
            <thead className="border-b border-ink-800">
              <tr>
                {['#', 'Email', 'Role', 'Verified', 'Activities', 'Registered', 'Last Login', 'Actions'].map(h => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-medium text-ink-500"
                    style={{ fontFamily: 'Syne', letterSpacing: '0.05em' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="py-12 text-center text-ink-600 text-sm">Loading...</td></tr>
              ) : users.map((user, i) => (
                <tr key={user.email} className="border-b border-ink-800/50 hover:bg-ink-800/20 transition-colors">
                  <td className="py-3 px-4 text-xs text-ink-600 font-mono w-10">
                    {(page - 1) * 20 + i + 1}
                  </td>
                  <td className="py-3 px-4 text-sm text-ink-200">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      user.role === 'admin' ? 'bg-accent/15 text-accent' : 'bg-ink-800 text-ink-400'
                    }`}>
                      {user.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs ${user.verified ? 'text-success' : 'text-warning'}`}>
                      {user.verified ? '✓ Verified' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-accent font-mono font-bold">
                    {user.activity_count || 0}
                  </td>
                  <td className="py-3 px-4 text-xs text-ink-400 font-mono whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono whitespace-nowrap">
                    {user.last_login
                      ? <span className="text-ink-400">{new Date(user.last_login).toLocaleString()}</span>
                      : <span className="text-ink-700">Never</span>}
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleRoleToggle(user.email, user.role)}
                      className="text-xs text-ink-500 hover:text-accent transition-colors">
                      Toggle Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && users.length === 0 && (
            <div className="py-12 text-center text-ink-600 text-sm">No users found</div>
          )}
        </div>
      )}

      {/* Activity Table */}
      {tab === 'activity' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-ink-800">
              <tr>
                {['User', 'Action', 'Detail', 'Time'].map(h => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-medium text-ink-500"
                    style={{ fontFamily: 'Syne', letterSpacing: '0.05em' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="py-12 text-center text-ink-600 text-sm">Loading...</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="border-b border-ink-800/50 hover:bg-ink-800/20 transition-colors">
                  <td className="py-2.5 px-4 text-xs text-ink-300 font-mono">{log.user_email}</td>
                  <td className="py-2.5 px-4">
                    <span className={`text-xs font-medium font-mono ${actionColor(log.action)}`}>{log.action}</span>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-ink-500 truncate max-w-[200px]">{log.detail || '—'}</td>
                  <td className="py-2.5 px-4 text-xs text-ink-600 font-mono whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && logs.length === 0 && (
            <div className="py-12 text-center text-ink-600 text-sm">No activity found</div>
          )}
        </div>
      )}

      {/* Attendance Table */}
      {tab === 'attendance' && (
        <>
          {/* Stats Cards */}
          {attendanceStats && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="card p-4 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                <div className="text-xs text-ink-500 flex items-center gap-2 mb-1" style={{ fontFamily: 'Syne' }}>
                  <Activity size={12} />TOTAL SESSIONS
                </div>
                <div className="text-xl font-bold text-accent">{attendanceStats.total_sessions}</div>
              </div>
              <div className="card p-4 bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                <div className="text-xs text-ink-500 flex items-center gap-2 mb-1" style={{ fontFamily: 'Syne' }}>
                  <Clock size={12} />TOTAL MINUTES
                </div>
                <div className="text-xl font-bold text-success">{attendanceStats.total_minutes || 0}</div>
              </div>
              <div className="card p-4 bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20">
                <div className="text-xs text-ink-500 flex items-center gap-2 mb-1" style={{ fontFamily: 'Syne' }}>
                  <Clock size={12} />AVG MINUTES
                </div>
                <div className="text-xl font-bold text-warning">{Math.round(attendanceStats.avg_minutes || 0)}</div>
              </div>
            </div>
          )}
          
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-800 flex items-center justify-between bg-ink-900/40">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-ink-500" />
                <span className="text-xs text-ink-500" style={{ fontFamily: 'Syne' }}>
                  ATTENDANCE SESSIONS
                </span>
              </div>
              <span className="text-xs font-mono text-ink-400">
                {total} sessions
              </span>
            </div>

            <table className="w-full">
              <thead className="border-b border-ink-800">
                <tr>
                  {['User Email', 'Login Time', 'Logout Time', 'Duration (min)', 'Date'].map(h => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-medium text-ink-500"
                      style={{ fontFamily: 'Syne', letterSpacing: '0.05em' }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="py-12 text-center text-ink-600 text-sm">Loading...</td></tr>
                ) : sessions.map(session => (
                  <tr key={session.id} className="border-b border-ink-800/50 hover:bg-ink-800/20 transition-colors">
                    <td className="py-2.5 px-4 text-xs text-ink-300 font-mono">{session.user_email}</td>
                    <td className="py-2.5 px-4 text-xs text-success font-mono">
                      {new Date(session.login_time).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-ink-500 font-mono">
                      {session.logout_time ? new Date(session.logout_time).toLocaleTimeString() : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-ink-400 font-mono">
                      {session.duration_minutes ? `${session.duration_minutes}m` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-ink-600 font-mono whitespace-nowrap">
                      {new Date(session.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && sessions.length === 0 && (
              <div className="py-12 text-center text-ink-600 text-sm">No sessions found</div>
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30">← Prev</button>
          <span className="btn-ghost px-3 py-1.5 text-xs text-ink-500">Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30">Next →</button>
        </div>
      )}
    </div>
  );
}
