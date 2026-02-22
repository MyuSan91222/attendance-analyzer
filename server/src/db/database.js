import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(process.env.HOME || '/tmp', '.attendance-analyzer');
const DB_PATH = join(DB_DIR, 'app.db');

if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

export function ensureAdminUser(email, password) {
  const db = getDb();
  const existing = db.prepare('SELECT email, role FROM users WHERE email = ?').get(email);
  if (!existing) {
    const hash = bcrypt.hashSync(password, 12);
    db.prepare(
      `INSERT INTO users (email, password_hash, verified, role) VALUES (?, ?, 1, 'admin')`
    ).run(email, hash);
    console.log(`[DB] Admin user created: ${email}`);
  } else if (existing.role !== 'admin') {
    db.prepare("UPDATE users SET role = 'admin', verified = 1 WHERE email = ?").run(email);
    console.log(`[DB] User promoted to admin: ${email}`);
  }
}

export function recordLogin(userId, email) {
  const db = getDb();
  const loginTime = new Date().toISOString();
  
  // Update last login
  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(loginTime, userId);
  
  // Create new attendance session
  db.prepare(`
    INSERT INTO attendance_sessions (user_id, user_email, login_time)
    VALUES (?, ?, ?)
  `).run(userId, email, loginTime);
  
  // Log activity
  db.prepare(`
    INSERT INTO activity_log (user_id, user_email, action, login_time, created_at)
    VALUES (?, ?, 'login', ?, ?)
  `).run(userId, email, loginTime, loginTime);
}

export function recordLogout(userId, email) {
  const db = getDb();
  const logoutTime = new Date().toISOString();
  
  // Update last logout
  db.prepare('UPDATE users SET last_logout = ? WHERE id = ?').run(logoutTime, userId);
  
  // Find active session and close it
  const session = db.prepare(`
    SELECT id FROM attendance_sessions 
    WHERE user_id = ? AND logout_time IS NULL
    ORDER BY login_time DESC LIMIT 1
  `).get(userId);
  
  if (session) {
    const loginSession = db.prepare('SELECT login_time FROM attendance_sessions WHERE id = ?').get(session.id);
    const loginTime = new Date(loginSession.login_time);
    const logout = new Date(logoutTime);
    const durationMinutes = Math.round((logout - loginTime) / 60000);
    
    db.prepare(`
      UPDATE attendance_sessions 
      SET logout_time = ?, duration_minutes = ?
      WHERE id = ?
    `).run(logoutTime, durationMinutes, session.id);
  }
  
  // Log activity
  db.prepare(`
    INSERT INTO activity_log (user_id, user_email, action, logout_time, created_at)
    VALUES (?, ?, 'logout', ?, ?)
  `).run(userId, email, logoutTime, logoutTime);
  
  // Increment activity count
  db.prepare('UPDATE users SET activity_count = activity_count + 1 WHERE id = ?').run(userId);
}

export function getUserActivityStats(userId) {
  const db = getDb();
  return db.prepare(`
    SELECT 
      id,
      email,
      activity_count,
      last_login,
      last_logout,
      created_at,
      (SELECT COUNT(*) FROM attendance_sessions WHERE user_id = ?) as total_sessions
    FROM users WHERE id = ?
  `).get(userId, userId);
}

export function getAttendanceHistory(userId, limit = 50) {
  const db = getDb();
  return db.prepare(`
    SELECT 
      id,
      login_time,
      logout_time,
      duration_minutes,
      created_at
    FROM attendance_sessions
    WHERE user_id = ?
    ORDER BY login_time DESC
    LIMIT ?
  `).all(userId, limit);
}

function initSchema() {
  // Create users table first
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      verification_token TEXT,
      verification_token_expires TEXT,
      remember_token TEXT,
      reset_token TEXT,
      reset_token_expires TEXT,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT,
      last_logout TEXT,
      activity_count INTEGER DEFAULT 0
    );
  `);

  // Check if activity_log needs migration
  try {
    const columns = db.prepare("PRAGMA table_info(activity_log)").all();
    const hasUserId = columns.some(col => col.name === 'user_id');
    
    if (hasUserId) {
      // New schema - already migrated
      db.exec(`
        CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          user_email TEXT NOT NULL,
          action TEXT NOT NULL,
          detail TEXT,
          login_time TEXT,
          logout_time TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
    } else {
      // Old schema - create with backward compatibility
      db.exec(`
        CREATE TABLE IF NOT EXISTS activity_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          user_email TEXT NOT NULL,
          action TEXT NOT NULL,
          detail TEXT,
          login_time TEXT,
          logout_time TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
    }
  } catch {
    // Table doesn't exist, create new
    db.exec(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_email TEXT NOT NULL,
        action TEXT NOT NULL,
        detail TEXT,
        login_time TEXT,
        logout_time TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  // Create remaining tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      user_email TEXT NOT NULL,
      login_time TEXT NOT NULL,
      logout_time TEXT,
      duration_minutes INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_session_user ON attendance_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_session_date ON attendance_sessions(created_at);
  `);
}
