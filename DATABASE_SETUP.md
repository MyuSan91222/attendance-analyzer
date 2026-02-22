# Attendance Analyzer - Database Setup Guide

## Quick Start

The database is automatically initialized on first run. No manual setup required!

### What Gets Created

When the server starts:
- ✅ Creates `~/.attendance-analyzer/app.db` (SQLite database)
- ✅ Initializes all tables (users, attendance_sessions, activity_log, refresh_tokens)
- ✅ Creates indexes for performance
- ✅ Enables WAL mode for better concurrency

## Database Features

### 1. **User Management**
- Email/password authentication
- Role-based access control (user/admin)
- Email verification support
- Password reset functionality
- Activity tracking

### 2. **Attendance Tracking** ⭐ NEW
Track every user session with:
- **Login Time** - When user logged in
- **Logout Time** - When user logged out
- **Duration** - Session length in minutes
- **Activity Count** - Total number of sessions per user

### 3. **Activity Logging**
Full audit trail including:
- Login/logout events
- User actions
- Signup/verification events
- Admin actions

## API Endpoints

### Users Tab
```
GET /api/admin/users?page=1&search=email
```
Shows all users with activity_count displayed.

### Attendance Tab (NEW)
```
GET /api/admin/attendance?page=1&user_id=optional
```

Returns:
```json
{
  "sessions": [
    {
      "id": 1,
      "user_email": "user@example.com",
      "login_time": "2026-02-22T10:30:00Z",
      "logout_time": "2026-02-22T11:45:00Z",
      "duration_minutes": 75,
      "created_at": "2026-02-22T10:30:00Z"
    }
  ],
  "stats": {
    "total_sessions": 45,
    "total_minutes": 3250,
    "avg_minutes": 72
  }
}
```

### User Statistics
```
GET /api/admin/users/:id/stats
```

Returns individual user's activity statistics.

## Admin Dashboard

### Users View
Now displays:
- **Activity Count** - Total login sessions per user
- Easily identify most active users
- Sort and filter by activity

### Attendance View
New tab showing:
- **Session Timeline** - All login/logout events
- **Duration Breakdown** - Minutes spent per session
- **Overall Stats** - Total & average session times
- Filter by specific users

## Database Maintenance

### Migration Script
For existing databases, run:
```bash
node server/src/db/migrate.js
```

This:
- Adds `activity_count` column to users
- Creates `attendance_sessions` table
- Upgrades `activity_log` with user_id
- Creates performance indexes
- Preserves existing data

### Backup
Database location: `~/.attendance-analyzer/app.db`

To backup:
```bash
cp ~/.attendance-analyzer/app.db ~/.attendance-analyzer/app.db.backup
```

## Development

### Enable Debugging
Set in environment:
```bash
DEBUG=attendance:* npm start
```

### Database Inspection
Using SQLite CLI:
```bash
sqlite3 ~/.attendance-analyzer/app.db
sqlite> .tables
sqlite> SELECT email, activity_count FROM users;
sqlite> SELECT * FROM attendance_sessions LIMIT 5;
```

## Architecture

```
users (accounts)
  ├─ basic auth (email, password_hash)
  ├─ role management
  ├─ verification tracking
  └─ activity_count ⭐

attendance_sessions (login/logout tracking)
  ├─ login_time
  ├─ logout_time
  ├─ duration_minutes (calculated)
  └─ references users.id

activity_log (audit trail)
  ├─ login/logout actions
  ├─ user actions
  ├─ references users.id
  └─ full timestamp history
```

## Troubleshooting

### Database locked
If you get "database is locked":
- Ensure only one server instance is running
- Restart the server

### Migration fails
```bash
# Check database integrity
sqlite3 ~/.attendance-analyzer/app.db "PRAGMA integrity_check;"

# Reset if corrupted (WARNING: deletes data)
rm ~/.attendance-analyzer/app.db
npm start  # Recreates
```

### Missing columns
Run migration:
```bash
node server/src/db/migrate.js
```

## Performance Notes

- WAL mode enables better concurrency
- Indexes on user_id and created_at for fast queries
- Pagination (20 users, 50 activities, 50 sessions per page)
- Activity counts updated efficiently on logout only

## Security

- Passwords hashed with bcrypt (12 rounds)
- Foreign key constraints enabled
- Email verification before full access
- Admin-only access to dashboard
- Activity audit trail for compliance

## Next Steps

1. ✅ Database initialized
2. ✅ Admin panel with attendance tracking
3. → Deploy to production
4. → Monitor user activity via dashboard

Enjoy tracking attendance! 📊
