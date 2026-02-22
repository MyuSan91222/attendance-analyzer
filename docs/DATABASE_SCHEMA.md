# SQLite Database Schema

## Overview
The attendance analyzer uses SQLite with three main tables for user management and attendance tracking.

## Tables

### users
Stores user account information with attendance tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Unique user identifier |
| email | TEXT UNIQUE NOT NULL | User email address |
| password_hash | TEXT NOT NULL | Bcrypt hashed password |
| verified | INTEGER DEFAULT 0 | Email verification status (0=pending, 1=verified) |
| verification_token | TEXT | One-time token for email verification |
| verification_token_expires | TEXT | Expiration time for verification token |
| remember_token | TEXT | Token for "remember me" functionality |
| reset_token | TEXT | One-time password reset token |
| reset_token_expires | TEXT | Expiration time for reset token |
| role | TEXT DEFAULT 'user' | User role ('user' or 'admin') |
| **activity_count** | INTEGER DEFAULT 0 | **Total number of login sessions** |
| created_at | TEXT DEFAULT now() | Account creation timestamp |
| last_login | TEXT | Last login timestamp |
| last_logout | TEXT | Last logout timestamp |

### attendance_sessions
Tracks individual user login/logout sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Session identifier |
| user_id | INTEGER NOT NULL | Foreign key to users.id |
| user_email | TEXT NOT NULL | User email (denormalized for queries) |
| **login_time** | TEXT NOT NULL | **Session start time** |
| **logout_time** | TEXT | **Session end time** |
| **duration_minutes** | INTEGER | **Time spent in minutes** |
| created_at | TEXT DEFAULT now() | Record creation timestamp |

### activity_log
Records all user actions and activities.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Log entry identifier |
| user_id | INTEGER | Foreign key to users.id |
| user_email | TEXT NOT NULL | User email |
| action | TEXT NOT NULL | Action type ('login', 'logout', 'signup', etc.) |
| detail | TEXT | Additional details about the action |
| login_time | TEXT | Login timestamp (for login actions) |
| logout_time | TEXT | Logout timestamp (for logout actions) |
| created_at | TEXT DEFAULT now() | When the action occurred |

### refresh_tokens
Manages JWT refresh tokens for session persistence.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Token identifier |
| user_email | TEXT NOT NULL | User email |
| token | TEXT UNIQUE NOT NULL | JWT refresh token |
| expires_at | TEXT NOT NULL | Token expiration time |
| created_at | TEXT DEFAULT now() | Token creation time |

## Indexes
For performance optimization:
- `idx_activity_user` - activity_log(user_id)
- `idx_activity_date` - activity_log(created_at)
- `idx_session_user` - attendance_sessions(user_id)
- `idx_session_date` - attendance_sessions(created_at)

## Database Location
- **Path**: `~/.attendance-analyzer/app.db`
- **Mode**: WAL (Write-Ahead Logging)
- **Foreign Keys**: Enabled

## Key Features
1. **Activity Counting** - `activity_count` increments on each logout
2. **Session Tracking** - Automatic calculation of session duration in minutes
3. **Audit Trail** - Full activity_log for compliance
4. **Referential Integrity** - Foreign keys ensure data consistency

## Migration
Run the migration script to update existing databases:
```bash
node server/src/db/migrate.js
```

This adds missing columns and converts old activity_log format to include user_id.

## Usage Examples

### Get user activity stats
```javascript
const stats = getUserActivityStats(userId);
// Returns: { id, email, activity_count, last_login, last_logout, total_sessions }
```

### Get attendance history
```javascript
const history = getAttendanceHistory(userId, 100);
// Returns array of last 100 sessions with login_time, logout_time, duration_minutes
```

### Record login
```javascript
recordLogin(userId, email);
// Creates attendance_sessions entry
// Updates users.last_login
// Logs activity
```

### Record logout
```javascript
recordLogout(userId, email);
// Closes attendance_sessions entry
// Calculates duration_minutes
// Updates users.last_logout
// Increments activity_count
// Logs activity
```
