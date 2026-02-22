# API Reference — Attendance Analyzer

**Base URL (production):** `https://<your-backend>.railway.app/api`
**Base URL (development):** `http://localhost:3001/api`
**Content-Type:** `application/json`
**Authentication:** `Authorization: Bearer <accessToken>` (where noted)

---

## Authentication Endpoints

### POST `/auth/signup`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| `201 Created` | Account created successfully |
| `400 Bad Request` | Missing/invalid fields |
| `409 Conflict` | Email already registered |

**201 Response Body:**
```json
{
  "message": "Account created. Please verify your email.",
  "token": "abc123..."  // Only in dev mode when SMTP is not configured
}
```

---

### POST `/auth/login`

Authenticate and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| `200 OK` | Login successful |
| `401 Unauthorized` | Invalid credentials |
| `403 Forbidden` | Email not verified (if `REQUIRE_EMAIL_VERIFICATION=true`) |

**200 Response Body:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com",
    "role": "user",
    "verified": true,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "lastLogin": "2026-02-20T08:30:00.000Z"
  }
}
```

**Set-Cookie Header (on success):**
```
Set-Cookie: refreshToken=<jwt>; HttpOnly; SameSite=Strict; Path=/api/auth/refresh; Max-Age=2592000
```

---

### POST `/auth/refresh`

Exchange the refresh token cookie for a new access token. Called automatically by the Axios interceptor on 401 responses.

**Request:** No body required. Reads `refreshToken` from httpOnly cookie automatically.

**Responses:**

| Status | Description |
|--------|-------------|
| `200 OK` | New access token issued |
| `401 Unauthorized` | No cookie, invalid token, or token not in DB |

**200 Response Body:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST `/auth/logout`

Invalidate the refresh token and clear the cookie.

**Headers:** `Authorization: Bearer <accessToken>`

**Responses:**

| Status | Description |
|--------|-------------|
| `200 OK` | Logged out successfully |

**200 Response Body:**
```json
{ "message": "Logged out successfully" }
```

**Clears Cookie:** `refreshToken`

---

### GET `/auth/me`

Return the authenticated user's profile.

**Headers:** `Authorization: Bearer <accessToken>`

**Responses:**

| Status | Description |
|--------|-------------|
| `200 OK` | User profile returned |
| `401 Unauthorized` | Invalid or expired access token |

**200 Response Body:**
```json
{
  "email": "user@example.com",
  "role": "user",
  "verified": true,
  "createdAt": "2026-01-15T10:00:00.000Z",
  "lastLogin": "2026-02-20T08:30:00.000Z"
}
```

---

### POST `/auth/verify-email`

Verify an email address using the token sent via email.

**Request Body:**
```json
{ "token": "a3f2b1c4d5e6..." }
```

**Responses:**

| Status | Description |
|--------|-------------|
| `200 OK` | Email verified |
| `400 Bad Request` | Invalid or expired token |

---

### POST `/auth/forgot`

Request a password reset link. Always returns 200 to prevent email enumeration.

**Request Body:**
```json
{ "email": "user@example.com" }
```

**Responses:**

| Status | Description |
|--------|-------------|
| `200 OK` | Always (even if email not found) |

**200 Response Body:**
```json
{
  "message": "If your email is registered, you will receive a reset link.",
  "token": "abc123..."  // Only in dev mode (no SMTP configured)
}
```

---

### POST `/auth/reset`

Set a new password using a reset token.

**Request Body:**
```json
{
  "token": "a3f2b1c4d5e6...",
  "password": "newSecurePassword"
}
```

**Responses:**

| Status | Description |
|--------|-------------|
| `200 OK` | Password changed; all refresh tokens invalidated |
| `400 Bad Request` | Invalid/expired token, or password too short |

---

## Admin Endpoints

All admin endpoints require:
- `Authorization: Bearer <accessToken>` (valid access token)
- User must have `role = 'admin'`

---

### GET `/admin/users`

Retrieve a paginated list of all registered users.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Results per page |
| `search` | string | — | Filter by email (partial match) |

**200 Response Body:**
```json
{
  "users": [
    {
      "email": "user@example.com",
      "role": "user",
      "verified": 1,
      "created_at": "2026-01-15 10:00:00",
      "last_login": "2026-02-20 08:30:00",
      "last_logout": "2026-02-19 17:00:00"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 3
}
```

---

### PUT `/admin/users/:email/role`

Update a user's role.

**Path Parameter:** `email` — URL-encoded email address of the target user.

**Request Body:**
```json
{ "role": "admin" }
```

Valid values: `"user"` | `"admin"`

**Responses:**

| Status | Description |
|--------|-------------|
| `200 OK` | Role updated |
| `400 Bad Request` | Invalid role value |
| `404 Not Found` | User not found |

---

### GET `/admin/activity`

Retrieve a paginated activity audit log.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number |
| `limit` | integer | `50` | Results per page |
| `email` | string | — | Filter by user email |

**200 Response Body:**
```json
{
  "logs": [
    {
      "id": 1,
      "user_email": "user@example.com",
      "action": "login",
      "detail": null,
      "created_at": "2026-02-20 08:30:00"
    }
  ],
  "total": 157,
  "page": 1,
  "totalPages": 4
}
```

**Action values:** `signup`, `login`, `logout`, `password_reset_requested`, `password_reset`, `email_verified`, `role_changed`

---

### DELETE `/admin/activity`

Clear activity logs.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `email` | string | If provided, clears only this user's logs. If omitted, clears all logs. |

**Responses:**

| Status | Description |
|--------|-------------|
| `200 OK` | Logs cleared |

---

## User Endpoints

### GET `/activity`

Retrieve the authenticated user's own activity log.

**Headers:** `Authorization: Bearer <accessToken>`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number |
| `limit` | integer | `20` | Results per page |

**200 Response Body:** Same structure as admin activity endpoint but filtered to the authenticated user.

---

## Health Check

### GET `/health`

Check server availability.

**200 Response Body:**
```json
{ "status": "ok", "timestamp": "2026-02-20T08:30:00.000Z" }
```

---

## Error Response Format

All error responses follow a consistent structure:

```json
{
  "error": "Human-readable error message"
}
```

Common HTTP status codes:

| Code | Meaning |
|------|---------|
| `400` | Bad Request — invalid input |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — authenticated but insufficient role |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — duplicate resource (e.g., email already exists) |
| `500` | Internal Server Error |

---

## Token Expiry Reference

| Token | Storage | Expiry |
|-------|---------|--------|
| Access Token (JWT) | Zustand memory | 15 minutes |
| Refresh Token (JWT) | httpOnly cookie + SQLite | 30 days |
| Email Verification Token | SQLite (hex string) | 24 hours |
| Password Reset Token | SQLite (hex string) | 1 hour |
