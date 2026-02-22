import { Router } from 'express';
import { getDb, getUserActivityStats, getAttendanceHistory } from '../db/database.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin);

// GET /api/admin/users
router.get('/users', (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (page - 1) * limit;
  const db = getDb();

  const where = search ? `WHERE email LIKE ?` : '';
  const params = search ? [`%${search}%`] : [];

  const users = db.prepare(`
    SELECT id, email, role, verified, created_at, last_login, last_logout, activity_count
    FROM users ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params).count;
  res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/admin/users/:id/stats
router.get('/users/:id/stats', (req, res) => {
  const userId = req.params.id;
  const stats = getUserActivityStats(userId);
  const history = getAttendanceHistory(userId, 100);
  
  if (!stats) return res.status(404).json({ error: 'User not found' });
  
  res.json({ stats, history });
});

// GET /api/admin/activity
router.get('/activity', (req, res) => {
  const { page = 1, limit = 50, email = '', user_id = '' } = req.query;
  const offset = (page - 1) * limit;
  const db = getDb();

  let where = '';
  const params = [];
  
  if (email) {
    where = 'WHERE user_email LIKE ?';
    params.push(`%${email}%`);
  }
  
  if (user_id) {
    where = where ? `${where} AND user_id = ?` : 'WHERE user_id = ?';
    params.push(parseInt(user_id));
  }

  const logs = db.prepare(`
    SELECT * FROM activity_log ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM activity_log ${where}`).get(...params).count;
  res.json({ logs, total });
});

// GET /api/admin/attendance
router.get('/attendance', (req, res) => {
  const { user_id = '', page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const db = getDb();
  
  let where = '';
  const params = [];
  
  if (user_id) {
    where = 'WHERE user_id = ?';
    params.push(parseInt(user_id));
  }
  
  const sessions = db.prepare(`
    SELECT * FROM attendance_sessions ${where}
    ORDER BY login_time DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM attendance_sessions ${where}`).get(...params).count;
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_sessions,
      SUM(CASE WHEN logout_time IS NOT NULL THEN duration_minutes ELSE 0 END) as total_minutes,
      AVG(CASE WHEN logout_time IS NOT NULL THEN duration_minutes ELSE 0 END) as avg_minutes
    FROM attendance_sessions ${where}
  `).get(...params);
  
  res.json({ sessions, total, stats, page: parseInt(page), limit: parseInt(limit) });
});

// DELETE /api/admin/activity
router.delete('/activity', (req, res) => {
  const { email } = req.query;
  if (email) {
    getDb().prepare('DELETE FROM activity_log WHERE user_email = ?').run(email);
  } else {
    getDb().prepare('DELETE FROM activity_log').run();
  }
  res.json({ message: 'Activity cleared' });
});

// PUT /api/admin/users/:email/role
router.put('/users/:email/role', (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  getDb().prepare('UPDATE users SET role = ? WHERE email = ?').run(role, req.params.email);
  res.json({ message: 'Role updated' });
});

export default router;
