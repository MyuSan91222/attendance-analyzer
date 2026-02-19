# Attendance Analyzer — React Edition

A clean, full-stack React + Node.js rebuild of the Attendance Analyzer.  
Analyzes Microsoft Teams Excel attendance reports with user authentication, scoring, and exports.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, React Router v6 |
| Backend | Node.js, Express, better-sqlite3 |
| Auth | JWT (access + refresh tokens), bcrypt, httpOnly cookies |
| Processing | SheetJS (client-side Excel parsing — no upload to server) |
| Charts | Recharts |
| Exports | jsPDF, CSV, TXT |

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### 1. Install dependencies

```bash
# From the project root
cd client && npm install
cd ../server && npm install
```

### 2. Configure environment

Edit `server/.env`:
```env
JWT_SECRET=your-long-random-secret-here
JWT_REFRESH_SECRET=your-other-random-secret
ADMIN_EMAILS=your@email.com
REQUIRE_EMAIL_VERIFICATION=false
```

### 3. Run in development

**Terminal 1 — Backend:**
```bash
cd server
node src/index.js
# Runs on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# Opens http://localhost:5173
```

### 4. Create your first account
1. Go to `http://localhost:5173`
2. Click "Create one" to sign up
3. Login and start analyzing!

---

## Admin Setup

Add your email to `server/.env`:
```env
ADMIN_EMAILS=your@email.com
```

Sign up with that email — you'll automatically get admin role.

Admin panel is available at `/admin` in the nav bar.

---

## How to Analyze Attendance

1. **Login** to your account
2. **Configure** class times and thresholds in the left sidebar
3. **Drop** your Microsoft Teams Excel attendance files into the upload zone
4. **Click** "Analyze Attendance" 
5. **Review** the results table and charts
6. **Export** as CSV, TXT, or PDF

### Supported Excel Columns (auto-detected)
- **Name**: "Full Name", "Name", "Participant", "Attendee"
- **Join Time**: "Join Time", "Timestamp", "Time", "Joined"  
- **ID** (optional): "User Principal Name", "ID", "Email"

---

## Scoring Formula

```
Score = Max Score − (Late Count × Late Penalty) − (Absent Count × Absent Penalty)
```

**Defaults:**
- Max Score: 100
- Late threshold: 10 minutes after class start
- Absent threshold: 30 minutes after class start  
- Late penalty: −1 per session
- Absent penalty: −2 per session

---

## Project Structure

```
attendance-analyzer/
├── client/                    # React frontend
│   └── src/
│       ├── api/               # Axios API client
│       ├── components/
│       │   └── layout/        # Navbar, AppLayout, ProtectedRoute
│       ├── hooks/             # useAuth hook
│       ├── pages/             # All page components
│       ├── store/             # Zustand state (auth + app config)
│       ├── types/             # TypeScript interfaces
│       └── utils/
│           ├── excelParser.ts # Client-side Excel parsing (SheetJS)
│           ├── scoring.ts     # Attendance classification & scoring
│           └── exporters.ts   # CSV / TXT / PDF export
│
└── server/                    # Express backend
    └── src/
        ├── db/database.js     # SQLite setup & schema
        ├── middleware/auth.js  # JWT middleware
        ├── routes/
        │   ├── auth.js        # Auth endpoints
        │   └── admin.js       # Admin endpoints
        └── utils/auth.js      # JWT helpers & email
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Clear session |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/verify-email` | Verify email token |
| POST | `/api/auth/forgot` | Request password reset |
| POST | `/api/auth/reset` | Reset password |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/:email/role` | Update user role |
| GET | `/api/admin/activity` | View activity log |
| DELETE | `/api/admin/activity` | Clear activity log |

---

## Security Features

- Passwords hashed with bcrypt (12 rounds)
- Access tokens expire in 15 minutes
- Refresh tokens in httpOnly cookies (30 days)
- Rate limiting on auth routes (20 req/min)
- Helmet.js security headers
- CORS configured to client origin only
- No sensitive data in localStorage

---

## Environment Variables

```env
PORT=3001                          # Server port (default: 3001)
CLIENT_URL=http://localhost:5173   # Frontend URL for CORS
JWT_SECRET=...                     # Secret for access tokens
JWT_REFRESH_SECRET=...             # Secret for refresh tokens
ADMIN_EMAILS=admin@example.com     # Comma-separated admin emails
REQUIRE_EMAIL_VERIFICATION=false   # Require email verification

# Optional SMTP (for email verification & password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your@gmail.com
APP_URL=http://localhost:5173
```

---

## Database

SQLite database stored at `~/.attendance-analyzer/app.db`

**Tables:**
- `users` — email, password hash, role, verification status, timestamps
- `activity_log` — login/logout/action audit trail
- `refresh_tokens` — valid refresh tokens with expiry

---

## Differences from Python/Streamlit Version

| Feature | Python Version | React Version |
|---------|---------------|---------------|
| File parsing | Server-side | Client-side (no upload needed) |
| Auth | Custom PBKDF2 | JWT + bcrypt |
| Session | File-based tokens | httpOnly cookies |
| UI | 3,300-line single file | Modular components |
| State | Streamlit session | Zustand store |
| Works offline | No | Yes (after login) |
| Mobile | Poor | Responsive |
