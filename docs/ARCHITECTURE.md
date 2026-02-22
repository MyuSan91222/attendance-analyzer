# System Architecture — Attendance Analyzer

**Version:** 1.0 | **Date:** 2026-02-20

---

## 1. Architectural Overview

Attendance Analyzer follows a **decoupled SPA + REST API** architecture. The frontend is a client-rendered React application; the backend is a stateless Express.js REST API. Attendance file processing happens entirely in the browser, so raw student data never leaves the client machine.

```
┌────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                        │
│                                                                │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────────────┐ │
│  │ React Pages │──▶│  Zustand    │   │  File Processing     │ │
│  │  (JSX/TSX)  │   │   Stores    │   │  ExcelParser         │ │
│  └──────┬──────┘   └─────────────┘   │  ScoringEngine       │ │
│         │                            │  ExportService       │ │
│  ┌──────▼──────┐                     └──────────────────────┘ │
│  │ Axios Client│  (Bearer JWT + httpOnly Cookie)               │
│  └──────┬──────┘                                              │
└─────────┼──────────────────────────────────────────────────────┘
          │  HTTPS REST API (/api/*)
          │
┌─────────▼──────────────────────────────────────────────────────┐
│                        SERVER (Node.js)                        │
│                                                                │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐               │
│  │  Helmet  │  │   CORS    │  │ cookie-parser│  Middleware    │
│  └──────────┘  └───────────┘  └──────────────┘               │
│                                                                │
│  ┌─────────────────┐    ┌───────────────────┐                 │
│  │  Auth Routes    │    │  Admin Routes     │  Route Layer    │
│  │  /api/auth/*    │    │  /api/admin/*     │                 │
│  └────────┬────────┘    └────────┬──────────┘                 │
│           │                      │                             │
│  ┌────────▼──────────────────────▼──────────┐                 │
│  │            SQLite Database               │  Data Layer     │
│  │    ~/.attendance-analyzer/app.db         │                 │
│  │    users / refresh_tokens / activity_log │                 │
│  └──────────────────────────────────────────┘                 │
│                                                                │
│  ┌──────────────────────┐                                     │
│  │  Nodemailer (SMTP)   │  External Integration (Optional)    │
│  └──────────────────────┘                                     │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Decision Records (ADRs)

### ADR-01: Client-Side File Processing

**Decision:** Attendance file parsing and analysis run entirely in the browser.

**Rationale:**
- Preserves student privacy — raw attendance data never touches the server
- Eliminates server storage requirements for potentially large Excel files
- Enables offline-capable analysis once the app is loaded
- Simplifies backend (no file upload endpoints, no temporary storage cleanup)

**Trade-offs:** Large files may be slow on low-end devices; parsing logic must be maintained in JavaScript/TypeScript.

---

### ADR-02: SQLite as the Database

**Decision:** Use SQLite with `better-sqlite3` as the only persistence layer.

**Rationale:**
- Zero infrastructure overhead — no separate database server needed
- Synchronous API simplifies server code (no async/await for queries)
- WAL mode provides adequate read concurrency for expected load
- Easy to backup and inspect

**Trade-offs:** Not suitable for horizontal scaling (file is local to one server instance). A migration to PostgreSQL would be required for multi-instance deployments.

---

### ADR-03: JWT + httpOnly Refresh Cookie

**Decision:** Issue short-lived (15 min) access tokens as Bearer headers and store long-lived (30 day) refresh tokens in httpOnly cookies.

**Rationale:**
- Access token in memory (Zustand) prevents XSS from stealing long-lived credentials
- httpOnly cookie prevents JavaScript access to the refresh token
- Stateless access token verification scales without DB reads on every request
- Refresh token invalidation is DB-backed (allows forced logout)

---

### ADR-04: Decoupled Frontend/Backend Deployment

**Decision:** Deploy frontend to Vercel (CDN) and backend to Railway/Render (Node container).

**Rationale:**
- Frontend benefits from CDN edge caching and global distribution
- Backend can be scaled independently
- Matches industry standard for SPA + API architectures

---

## 3. Frontend Architecture

### 3.1 Layer Structure

```
src/
├── api/          HTTP client layer (Axios instance + interceptors + typed API methods)
├── components/   Shared/layout UI components
├── hooks/        React hooks (useAuth — initialization only)
├── pages/        Route-level page components
├── store/        Zustand global state (authStore, appStore)
├── types/        TypeScript interfaces shared across layers
└── utils/        Pure business logic (no React dependencies)
    ├── excelParser.ts   File → ParsedFile[]
    ├── scoring.ts       ParsedFile[] + Config → Student[]
    └── exporters.ts     Student[] → file download
```

### 3.2 Data Flow (Dashboard)

```
File Drop
   │
   ▼
ExcelParser.parseFile()
   │  ParsedFile{filename, records[]}
   ▼
autoDetectClassTimes()          ──▶ AppStore.config (classStart/classEnd)
   │
   ▼  [User clicks Analyze]
ScoringEngine.analyzeAttendance(files, config)
   │  Student[]
   ▼
AppStore.setResults()
   │
   ▼
DashboardPage renders:
  ├── Stat cards
  ├── Pie chart (Recharts)
  ├── Progress bars
  └── Student table
         └── [row click] → SessionRecord[] detail
```

### 3.3 State Management

| Store | Responsibility | Persisted? |
|-------|---------------|-----------|
| `authStore` | `user`, `accessToken`, `isLoading` | No (memory only) |
| `appStore` | `config`, `students[]`, `numSessions`, `fileNames[]` | No (memory only) |

Auth state is rehydrated on every app load via `POST /api/auth/refresh` using the httpOnly cookie.

### 3.4 Routing

```
/ ──────────────────────────────────────────────────── redirect → /dashboard
/login                    LoginPage               Public
/signup                   SignupPage              Public
/forgot-password          ForgotPasswordPage      Public
/reset-password           ResetPasswordPage       Public
/verify-email             VerifyEmailPage         Public
/dashboard                DashboardPage           Protected (requireAuth)
/admin                    AdminPage               Protected (requireAdmin)
```

`AppLayout` guards all protected routes by reading `authStore.user`. Unauthenticated requests are redirected to `/login`. Non-admin users accessing `/admin` are redirected to `/dashboard`.

---

## 4. Backend Architecture

### 4.1 Layer Structure

```
server/src/
├── index.js          App bootstrap (Express setup, middleware, DB init, static serve)
├── db/
│   └── database.js   SQLite setup, schema creation, WAL mode, admin seeding
├── middleware/
│   └── auth.js       requireAuth, requireAdmin guards
├── routes/
│   ├── auth.js       /api/auth/* endpoints
│   └── admin.js      /api/admin/* endpoints
└── utils/
    └── auth.js       JWT generation/verification, token generation, email sending
```

### 4.2 Request Lifecycle

```
HTTP Request
    │
    ▼
[Helmet]  ────────────── Sets security headers
    │
[CORS]    ────────────── Validates Origin against CLIENT_URL env var
    │
[cookie-parser] ──────── Parses Set-Cookie header
    │
[express.json] ──────── Parses JSON body
    │
    ├── /api/auth/*  ───── auth.js routes
    │       ├── [requireAuth] (on /me only)
    │       └── handler logic → DB → response
    │
    ├── /api/admin/* ───── admin.js routes
    │       ├── [requireAuth] → verify Bearer JWT
    │       ├── [requireAdmin] → check role
    │       └── handler logic → DB → response
    │
    └── * (catch-all) ──── serve client/dist/index.html (SPA fallback)
```

### 4.3 Authentication Architecture

```
Access Token (JWT, 15 min)
  ├── Stored in: Zustand authStore (memory)
  ├── Sent via: Authorization: Bearer <token>
  ├── Verified: JWT.verify() on every protected request
  └── Payload: {email, role, iat, exp}

Refresh Token (JWT, 30 days)
  ├── Stored in: SQLite refresh_tokens table + httpOnly cookie
  ├── Sent via: Cookie (automatic, browser-managed)
  ├── Verified: JWT.verify() + DB lookup (token must exist)
  └── Rotation: New access token issued; refresh token reused until expiry
```

### 4.4 Database Schema

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  email                       TEXT UNIQUE NOT NULL,
  password_hash               TEXT NOT NULL,
  verified                    INTEGER DEFAULT 0,
  verification_token          TEXT,
  verification_token_expires  TEXT,
  remember_token              TEXT,
  reset_token                 TEXT,
  reset_token_expires         TEXT,
  role                        TEXT DEFAULT 'user',
  created_at                  TEXT DEFAULT (datetime('now')),
  last_login                  TEXT,
  last_logout                 TEXT
);

-- Refresh tokens (one user → many tokens, multi-device support)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email  TEXT NOT NULL,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- Audit log
CREATE TABLE IF NOT EXISTS activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email  TEXT NOT NULL,
  action      TEXT NOT NULL,
  detail      TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);
```

---

## 5. Security Architecture

### 5.1 Threat Model Summary

| Threat | Mitigation |
|--------|-----------|
| XSS steals credentials | Access token in memory only; refresh token in httpOnly cookie |
| CSRF abuses refresh token | SameSite=Strict cookie; CORS locked to CLIENT_URL |
| Brute force login | rate-limit middleware (must be re-enabled in production) |
| Token replay after logout | Refresh tokens are deleted from DB on logout |
| Password breach | bcrypt cost factor 12 |
| Email enumeration via reset | Forgot-password always returns 200 regardless of email existence |
| Token expiry | Access: 15 min; Reset link: 1 hour; Refresh: 30 days |
| Privilege escalation | Role checked server-side on every admin request; JWT role claim verified |
| Insecure headers | Helmet sets HSTS, X-Frame-Options, X-Content-Type-Options, CSP |

### 5.2 Known Security Debt

| Item | Risk | Remediation |
|------|------|-------------|
| Hardcoded admin credentials in `server/src/index.js` | Critical | Move to `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` env vars |
| "Remember Me" stores plaintext password in `localStorage` | High | Remove — use persistent session cookie or remove the feature |
| Rate limiting commented out | Medium | Re-enable `express-rate-limit` on `/api/auth/*` in production |
| No CSRF token for state-changing cookie requests | Low | Add CSRF token validation or verify Origin header |

---

## 6. Deployment Architecture

### 6.1 Production (Split Deployment)

```
User Browser
    │
    │  HTTPS
    ├──────────────▶ Vercel CDN ──────────▶ client/dist (React SPA)
    │                                        (SPA rewrite: * → index.html)
    │
    │  HTTPS /api/*
    └──────────────▶ Railway/Render ──────▶ Express :3001
                        │
                        ├── SQLite: ~/.attendance-analyzer/app.db
                        └── (Optional) SMTP Server
```

### 6.2 Development (Single Machine)

```
Browser (:5173) ──▶ Vite Dev Server
                         │  Proxy: /api → :3001
                         └──▶ Express (:3001) ──▶ SQLite
```

### 6.3 Environment Variables

| Variable | Required | Description |
|---------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `CLIENT_URL` | Yes | Frontend URL for CORS (e.g., `https://myapp.vercel.app`) |
| `JWT_SECRET` | Yes | HMAC secret for access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | HMAC secret for refresh tokens (min 32 chars) |
| `ADMIN_EMAILS` | No | Comma-separated admin email overrides |
| `REQUIRE_EMAIL_VERIFICATION` | No | `true` to block unverified logins |
| `SMTP_HOST` | No | SMTP host (email disabled if absent) |
| `SMTP_PORT` | No | SMTP port |
| `SMTP_USER` | No | SMTP username |
| `SMTP_PASS` | No | SMTP password |
| `FROM_EMAIL` | No | Sender address for system emails |
| `APP_URL` | No | Public URL for email link generation |

---

## 7. Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18 | UI framework |
| React Router | 6 | Client-side routing |
| Vite | 5 | Build tool and dev server |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3 | Utility-first styling |
| Zustand | 4 | Global state management |
| Axios | 1 | HTTP client with interceptors |
| Recharts | 2 | Pie chart visualization |
| react-dropzone | — | File drag-and-drop |
| xlsx (SheetJS) | — | Excel file parsing |
| pdfjs-dist | — | PDF text extraction |
| mammoth | — | DOCX text extraction |
| jsPDF + autoTable | — | PDF export |
| react-hook-form | — | Form state management |
| lucide-react | — | Icon set |

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4 | Web framework |
| better-sqlite3 | — | SQLite driver (synchronous) |
| bcrypt | — | Password hashing |
| jsonwebtoken | — | JWT issuance and verification |
| nodemailer | — | SMTP email sending |
| helmet | — | HTTP security headers |
| cors | — | Cross-origin request policy |
| cookie-parser | — | Cookie parsing middleware |
| express-rate-limit | — | Request rate limiting |
| dotenv | — | Environment variable loading |

---

## 8. Key Design Patterns

| Pattern | Where Used | Purpose |
|---------|-----------|---------|
| Repository Pattern | `db/database.js` + route handlers | Centralizes data access |
| Interceptor Pattern | Axios request/response interceptors | Token attachment and silent refresh |
| Observer (Reactive) | Zustand stores | Components re-render on state change |
| Strategy Pattern | Column detection in ExcelParser | Swappable column alias lists |
| Guard / Middleware | `requireAuth`, `requireAdmin` | Composable route protection |
| Factory | `generateAccessToken`, `generateRefreshToken` | Centralized token creation |
