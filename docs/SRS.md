# Software Requirements Specification (SRS)

**Project:** Attendance Analyzer
**Version:** 1.0
**Date:** 2026-02-20
**Status:** Release

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [System Constraints](#5-system-constraints)
6. [External Interface Requirements](#6-external-interface-requirements)
7. [Use Cases](#7-use-cases)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for the **Attendance Analyzer** web application. It is intended for developers, testers, and stakeholders involved in the design, implementation, and evaluation of the system.

### 1.2 Scope

Attendance Analyzer is a full-stack web application that enables educators to upload Microsoft Teams attendance report files (XLSX, XLS, CSV, PDF, DOCX) and receive automated attendance analysis per student. The system classifies student attendance (On-Time, Late, Absent), calculates configurable scores, and provides exportable results.

**In Scope:**
- User authentication (signup, login, JWT token management, email verification, password reset)
- Client-side file parsing (no server-side file storage)
- Configurable attendance classification with auto-detection of class times
- Result visualization and export (CSV, TXT, PDF)
- Admin panel (user management, activity audit log)

**Out of Scope:**
- LMS integration (Canvas, Moodle, Google Classroom)
- Direct Microsoft Teams API connection
- Grade book synchronization
- Mobile native applications

### 1.3 Definitions and Abbreviations

| Term | Definition |
|------|-----------|
| MS Teams | Microsoft Teams video conferencing platform |
| Attendance Report | Exported CSV/XLSX file from an MS Teams meeting |
| On-Time | Student joined within the configurable late threshold from class start |
| Late | Student joined between late threshold and absent threshold |
| Absent | Student did not join, or joined beyond the absent threshold |
| JWT | JSON Web Token used for stateless authentication |
| SPA | Single Page Application |
| API | Application Programming Interface |
| WAL | Write-Ahead Logging (SQLite performance mode) |

### 1.4 References

- React Documentation: https://react.dev
- Express.js Documentation: https://expressjs.com
- MS Teams Attendance Reports: Microsoft documentation
- JWT RFC 7519

---

## 2. Overall Description

### 2.1 Product Perspective

Attendance Analyzer is a standalone web application rebuilt from a prior Python/Streamlit prototype. It adds persistent user accounts, role-based access control, audit logging, and a fully responsive browser interface. The system is deployed with a decoupled architecture: a React SPA served from a CDN (Vercel) and a Node.js/Express API backend (Railway/Render) backed by a local SQLite database.

### 2.2 Product Functions (High-Level)

| ID | Function |
|----|---------|
| F-01 | User self-registration and email verification |
| F-02 | Secure login with JWT access + refresh token rotation |
| F-03 | Password reset via email link |
| F-04 | Multi-file upload and client-side parsing |
| F-05 | Automatic class time detection from join timestamps |
| F-06 | Configurable attendance classification per session |
| F-07 | Aggregate scoring per student across all sessions |
| F-08 | Interactive results table with drilldown |
| F-09 | Distribution visualization (pie chart, progress bars) |
| F-10 | Export results as CSV, TXT, or PDF |
| F-11 | Admin: view and manage all users |
| F-12 | Admin: view and clear activity audit logs |

### 2.3 User Classes and Characteristics

| User Class | Description | Technical Expertise |
|-----------|-------------|---------------------|
| Instructor | Primary user; uploads attendance files, configures parameters, exports results | Low; expects intuitive UI |
| Administrator | Manages user accounts and reviews audit logs | Moderate; uses admin panel |
| System Admin | Deploys and maintains the server, manages environment variables | High |

### 2.4 Assumptions and Dependencies

- Users have access to MS Teams attendance report exports.
- The server host provides persistent file storage for the SQLite database.
- SMTP credentials are optional; the system degrades gracefully without email.
- Client browsers support ES2020 and the File API.
- The deployment environment supports Node.js 18+.

---

## 3. Functional Requirements

### 3.1 Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | The system shall allow users to register with a unique email and password (min 8 chars). | High |
| FR-02 | Passwords shall be hashed using bcrypt with a cost factor of 12 before storage. | High |
| FR-03 | Upon login, the system shall issue a JWT access token (15-minute expiry) and set an httpOnly refresh token cookie (30-day expiry). | High |
| FR-04 | The system shall silently refresh the access token using the refresh cookie when a 401 response is received. | High |
| FR-05 | The system shall support email verification; unverified accounts may optionally be blocked. | Medium |
| FR-06 | The system shall support password reset via a time-limited (1-hour) token sent to the registered email. | Medium |
| FR-07 | Logout shall invalidate the server-side refresh token record and clear the cookie. | High |
| FR-08 | The system shall log all authentication events (signup, login, logout, reset) to the activity_log table. | Medium |

### 3.2 File Upload and Parsing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-09 | The system shall accept `.xlsx`, `.xls`, `.csv`, `.pdf`, `.docx` attendance files. | High |
| FR-10 | File parsing shall occur entirely in the browser (client-side); files shall not be transmitted to the server. | High |
| FR-11 | The parser shall auto-detect the header row within the first 25 rows by identifying at least 2 of 4 expected column groups. | High |
| FR-12 | The parser shall handle MS Teams multi-section reports, stopping at section headers matching the pattern `^\d+\.\s`. | High |
| FR-13 | The parser shall strip date suffixes appended to student names (e.g., "Name - 12/11/25"). | Medium |
| FR-14 | For students with multiple join rows per session, only the earliest join time shall be used. | High |
| FR-15 | The system shall support drag-and-drop and click-to-select file upload. | Medium |
| FR-16 | The system shall support uploading multiple files simultaneously (one per class session). | High |

### 3.3 Attendance Analysis

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-17 | The system shall automatically detect class start time from uploaded files using the 25th percentile of all join times. | Medium |
| FR-18 | The detected class times shall be locked after the first detection to prevent overwrite on subsequent uploads. | Medium |
| FR-19 | The user shall be able to manually configure class start time, class end time, late threshold (minutes), and absent threshold (minutes). | High |
| FR-20 | The system shall classify each student per session as On-Time, Late, or Absent based on the join time relative to class start. | High |
| FR-21 | Students absent from a session file entirely shall be marked Absent for that session. | High |
| FR-22 | The final score shall be computed as: `max(0, maxScore − late × latePenalty − absent × absentPenalty)`. | High |
| FR-23 | Configuration parameters (maxScore, latePenalty, absentPenalty) shall be user-adjustable. | High |

### 3.4 Results Display

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-24 | The results table shall display: Role, Name, Student ID, First Date, Last Date, Total Classes, On-Time count, Late count, Absent count, Score. | High |
| FR-25 | The table shall support sorting by any column and text search. | Medium |
| FR-26 | Clicking a student row shall expand a per-session breakdown showing session file name, date, status, and join time. | High |
| FR-27 | Summary cards shall display: total students, total sessions, average score, and count of at-risk students (score < 60). | Medium |
| FR-28 | A pie chart shall display the proportion of On-Time, Late, and Absent classifications. | Low |

### 3.5 Export

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-29 | The system shall export results as a comma-separated CSV file. | High |
| FR-30 | The system shall export results as a fixed-width plain text table with scoring formula header. | Medium |
| FR-31 | The system shall export results as a landscape PDF with styled header row and zebra-striped data rows. | Medium |

### 3.6 Admin Panel

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-32 | Admin users shall access a paginated list of all registered accounts with email, role, verified status, created date, and last login. | High |
| FR-33 | Admin users shall be able to toggle any user's role between 'user' and 'admin'. | High |
| FR-34 | Admin users shall view a paginated, searchable activity log of all system events. | Medium |
| FR-35 | Admin users shall be able to clear activity logs (all or by user email). | Low |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-01 | Client-side parsing of a 500-row XLSX file shall complete within 3 seconds on a modern browser. |
| NFR-02 | API responses for authentication endpoints shall return within 1 second under normal load. |
| NFR-03 | The dashboard shall render analysis results for 100 students × 20 sessions within 500 ms. |

### 4.2 Security

| ID | Requirement |
|----|-------------|
| NFR-04 | Access tokens shall expire in 15 minutes; refresh tokens in 30 days. |
| NFR-05 | Refresh tokens shall be stored in httpOnly, SameSite=Strict cookies to prevent XSS access. |
| NFR-06 | All API responses shall include security headers via Helmet (HSTS, CSP, X-Frame-Options). |
| NFR-07 | Password reset endpoints shall not reveal whether an email is registered (anti-enumeration). |
| NFR-08 | The forgot-password email link shall expire after 1 hour. |
| NFR-09 | Rate limiting shall be applied to auth endpoints in production (configurable via `express-rate-limit`). |

### 4.3 Reliability

| ID | Requirement |
|----|-------------|
| NFR-10 | The SQLite database shall run in WAL mode to support concurrent reads. |
| NFR-11 | The system shall restart automatically on crash (Railway: max 5 retries). |
| NFR-12 | The refresh token mechanism shall allow users to stay authenticated across browser sessions up to 30 days. |

### 4.4 Usability

| ID | Requirement |
|----|-------------|
| NFR-13 | The application shall be fully usable on desktop browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+). |
| NFR-14 | The interface shall provide immediate visual feedback on file upload via drag-and-drop highlighting. |
| NFR-15 | Error messages from the API shall be human-readable and displayed as toast notifications. |

### 4.5 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-16 | Frontend source code shall be written in TypeScript with strict type definitions for all data models. |
| NFR-17 | Backend routes shall be organized into separate route files by domain (auth, admin). |
| NFR-18 | Environment configuration shall be managed entirely through environment variables (no hardcoded secrets in production). |

### 4.6 Scalability

| ID | Requirement |
|----|-------------|
| NFR-19 | The system shall support horizontal scaling of the frontend via CDN (Vercel). |
| NFR-20 | The backend shall be stateless for access-token-based requests, enabling future horizontal scaling. |

---

## 5. System Constraints

| ID | Constraint |
|----|-----------|
| C-01 | SQLite is used as the persistence layer; the database file is stored on the server host filesystem. |
| C-02 | Email functionality requires SMTP credentials; the system degrades gracefully if none are provided. |
| C-03 | All file parsing is performed client-side; the backend does not store or process uploaded attendance files. |
| C-04 | The admin seed account credentials are currently hardcoded in `server/src/index.js` — this must be replaced with environment variables before production use. |
| C-05 | The "Remember Me" feature currently stores credentials in localStorage — this is a known security concern and should be remediated. |

---

## 6. External Interface Requirements

### 6.1 User Interface

- React SPA with Tailwind CSS using a dark custom color palette (`ink` tokens)
- Fonts: DM Sans (body), JetBrains Mono (code), Syne (display)
- Responsive layout with sidebar configuration panel and main content area

### 6.2 Hardware Interfaces

- No hardware interfaces beyond standard browser/server compute resources.

### 6.3 Software Interfaces

| System | Interface Type | Purpose |
|--------|---------------|---------|
| Microsoft Teams | File-based (XLSX/CSV export) | Source of attendance data |
| SMTP Server | Network (nodemailer) | Email verification and password reset |
| SQLite | File system (better-sqlite3) | Data persistence |

### 6.4 Communications Interfaces

- HTTPS for all client-server communication in production
- REST JSON API at `/api/*`
- Cookie-based refresh token delivery (httpOnly, SameSite=Strict)
- Bearer JWT in Authorization header for access tokens

---

## 7. Use Cases

### UC-01: Analyze Attendance

**Actor:** Instructor
**Precondition:** User is authenticated; has MS Teams attendance report files
**Main Flow:**
1. User navigates to Dashboard
2. User drags and drops one or more attendance files onto the upload zone
3. System parses files client-side; auto-detects class start time
4. User reviews/adjusts configuration (thresholds, scoring)
5. User clicks "Analyze"
6. System classifies and scores each student; displays results table and charts
7. User optionally expands a student row to view per-session breakdown
8. User exports results as CSV/TXT/PDF

**Alternate Flow (manual time):** User adjusts class start time before clicking Analyze.
**Exception:** Unrecognized file format → toast error shown; file rejected.

### UC-02: User Registration

**Actor:** Instructor
**Main Flow:**
1. User navigates to `/signup`
2. Submits email and password
3. System creates account (password hashed, role=user)
4. If SMTP configured: verification email sent; user redirected to login
5. User verifies email via link; account marked verified

### UC-03: Admin Manages Users

**Actor:** Administrator
**Main Flow:**
1. Admin navigates to `/admin` → Users tab
2. System displays paginated user list
3. Admin can toggle any user's role using the role dropdown
4. Changes persist immediately to the database
