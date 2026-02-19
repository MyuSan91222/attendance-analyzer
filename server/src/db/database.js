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

function initSchema() {
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
      last_logout TEXT
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
