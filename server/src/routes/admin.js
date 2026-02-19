import { Router } from 'express';
import { getDb } from '../db/database.js';
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
    SELECT email, role, verified, created_at, last_login, last_logout
    FROM users ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params).count;
  res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/admin/activity
router.get('/activity', (req, res) => {
  const { page = 1, limit = 50, email = '' } = req.query;
  const offset = (page - 1) * limit;
  const db = getDb();

  const where = email ? `WHERE user_email LIKE ?` : '';
  const params = email ? [`%${email}%`] : [];

  const logs = db.prepare(`
    SELECT * FROM activity_log ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM activity_log ${where}`).get(...params).count;
  res.json({ logs, total });
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
