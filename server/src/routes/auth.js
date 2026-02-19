import { Router } from 'express';
import bcrypt from 'bcrypt';
import { getDb } from '../db/database.js';
import {
  generateAccessToken, generateRefreshToken, verifyRefreshToken,
  generateToken, sendVerificationEmail, sendResetEmail, verifyAccessToken
} from '../utils/auth.js';

const router = Router();
const REQUIRE_EMAIL_VERIFICATION = ['true','1','yes'].includes(
  (process.env.REQUIRE_EMAIL_VERIFICATION || 'false').toLowerCase()
);

function logActivity(email, action, detail = null) {
  getDb().prepare(
    'INSERT INTO activity_log (user_email, action, detail) VALUES (?, ?, ?)'
  ).run(email, action, detail);
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const db = getDb();
  const existing = db.prepare('SELECT email FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const password_hash = await bcrypt.hash(password, 12);
  const verified = REQUIRE_EMAIL_VERIFICATION ? 0 : 1;
  const verification_token = REQUIRE_EMAIL_VERIFICATION ? generateToken() : null;
  const expires = REQUIRE_EMAIL_VERIFICATION
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

  // Check if should be admin
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
  const role = adminEmails.includes(email) ? 'admin' : 'user';

  db.prepare(`
    INSERT INTO users (email, password_hash, verified, verification_token, verification_token_expires, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(email, password_hash, verified, verification_token, expires, role);

  logActivity(email, 'signup');

  if (REQUIRE_EMAIL_VERIFICATION && verification_token) {
    const sent = await sendVerificationEmail(email, verification_token);
    return res.json({
      message: sent ? 'Verification email sent' : 'Account created',
      token: sent ? undefined : verification_token,
      requiresVerification: true
    });
  }

  res.json({ 
    message: 'Account created successfully',
    requiresVerification: false
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  if (REQUIRE_EMAIL_VERIFICATION && !user.verified) {
    return res.status(403).json({ error: 'Please verify your email before logging in' });
  }

  db.prepare("UPDATE users SET last_login = datetime('now') WHERE email = ?").run(email);
  logActivity(email, 'login');

  const accessToken = generateAccessToken(email, user.role);
  const refreshToken = generateRefreshToken(email);

  // Store refresh token
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (user_email, token, expires_at) VALUES (?, ?, ?)').run(email, refreshToken, expires);

  // Remember me cookie
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };
  if (rememberMe) {
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
  } else {
    res.cookie('refreshToken', refreshToken, cookieOptions);
  }

  res.json({
    accessToken,
    user: { email: user.email, role: user.role, verified: !!user.verified, createdAt: user.created_at, lastLogin: user.last_login }
  });
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });

  try {
    const payload = verifyRefreshToken(token);
    const db = getDb();
    const stored = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token);
    if (!stored || new Date(stored.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(payload.email);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const accessToken = generateAccessToken(user.email, user.role);
    res.json({
      accessToken,
      user: { email: user.email, role: user.role, verified: !!user.verified, createdAt: user.created_at, lastLogin: user.last_login }
    });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    getDb().prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
    const email = (() => { try { return verifyRefreshToken(token)?.email; } catch { return null; } })();
    if (email) {
      getDb().prepare("UPDATE users SET last_logout = datetime('now') WHERE email = ?").run(email);
      logActivity(email, 'logout');
    }
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const payload = verifyAccessToken(authHeader.slice(7));
    const user = getDb().prepare('SELECT email, role, verified, created_at, last_login FROM users WHERE email = ?').get(payload.email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ email: user.email, role: user.role, verified: !!user.verified, createdAt: user.created_at, lastLogin: user.last_login });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE verification_token = ?').get(token);
  if (!user) return res.status(400).json({ error: 'Invalid token' });
  if (new Date(user.verification_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Token expired' });
  }

  db.prepare('UPDATE users SET verified = 1, verification_token = NULL WHERE email = ?').run(user.email);
  logActivity(user.email, 'email_verified');
  res.json({ message: 'Email verified successfully' });
});

// POST /api/auth/forgot
router.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Always respond OK to prevent email enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset link was sent' });

  const token = generateToken();
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?').run(token, expires, email);

  const sent = await sendResetEmail(email, token);
  res.json({ message: 'If that email exists, a reset link was sent', token: sent ? undefined : token });
});

// POST /api/auth/reset
router.post('/reset', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);
  if (!user || new Date(user.reset_token_expires) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const hash = await bcrypt.hash(password, 12);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE email = ?').run(hash, user.email);
  logActivity(user.email, 'password_reset');
  res.json({ message: 'Password reset successfully' });
});

export default router;
