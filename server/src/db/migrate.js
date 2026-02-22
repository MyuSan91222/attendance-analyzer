#!/usr/bin/env node
/**
 * Migration script to update existing databases with new attendance tracking schema
 * Run: node src/db/migrate.js
 */

import { getDb } from './database.js';

function runMigrations() {
  const db = getDb();
  
  try {
    console.log('🔄 Running database migrations...');
    
    // Add activity_count column if it doesn't exist
    try {
      db.prepare('SELECT activity_count FROM users LIMIT 1').get();
    } catch {
      console.log('➕ Adding activity_count to users table...');
      db.prepare('ALTER TABLE users ADD COLUMN activity_count INTEGER DEFAULT 0').run();
    }
    
    // Create attendance_sessions table if it doesn't exist
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
    `);
    console.log('✓ attendance_sessions table ready');
    
    // Recreate activity_log table with user_id if needed
    const activityColumns = db.prepare("PRAGMA table_info(activity_log)").all();
    const hasUserId = activityColumns.some(col => col.name === 'user_id');
    
    if (!hasUserId) {
      console.log('🔄 Migrating activity_log table with user_id...');
      
      // Backup existing data
      const existingLogs = db.prepare('SELECT * FROM activity_log').all();
      
      // Drop old table
      db.prepare('DROP TABLE activity_log').run();
      
      // Create new table with user_id
      db.exec(`
        CREATE TABLE activity_log (
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
      
      // Restore data (matching emails to user IDs)
      for (const log of existingLogs) {
        const user = db.prepare('SELECT id FROM users WHERE email = ?').get(log.user_email);
        db.prepare(`
          INSERT INTO activity_log (user_id, user_email, action, detail, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(user?.id || null, log.user_email, log.action, log.detail, log.created_at);
      }
      console.log(`✓ Migrated ${existingLogs.length} activity logs`);
    }
    
    // Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at);
      CREATE INDEX IF NOT EXISTS idx_session_user ON attendance_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_session_date ON attendance_sessions(created_at);
    `);
    console.log('✓ Indexes created');
    
    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();
