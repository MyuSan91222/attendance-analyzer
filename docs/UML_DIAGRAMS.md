# UML Diagrams — Attendance Analyzer

All diagrams are written in **PlantUML** syntax. Render them at https://www.plantuml.com/plantuml or using a PlantUML VS Code extension.

---

## 1. Use Case Diagram

```plantuml
@startuml use_case_diagram
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome
skinparam usecase {
  BackgroundColor #1e3a4a
  BorderColor #3d7a90
  FontColor #ffffff
}
skinparam actor {
  BackgroundColor #3d7a90
  BorderColor #ffffff
  FontColor #ffffff
}

actor "Instructor" as instructor
actor "Administrator" as admin
actor "Email Server\n(SMTP)" as smtp <<system>>
actor "Browser\n(File System)" as browser <<system>>

rectangle "Attendance Analyzer" {
  ' Auth use cases
  usecase "Register Account" as UC_REGISTER
  usecase "Verify Email" as UC_VERIFY
  usecase "Login" as UC_LOGIN
  usecase "Logout" as UC_LOGOUT
  usecase "Reset Password" as UC_RESET

  ' Analysis use cases
  usecase "Upload Attendance Files" as UC_UPLOAD
  usecase "Parse Files Client-Side" as UC_PARSE
  usecase "Configure Parameters" as UC_CONFIG
  usecase "Auto-Detect Class Times" as UC_DETECT
  usecase "Analyze Attendance" as UC_ANALYZE
  usecase "View Results" as UC_VIEW
  usecase "Expand Student Detail" as UC_DETAIL
  usecase "Export Results" as UC_EXPORT

  ' Admin use cases
  usecase "View All Users" as UC_USERS
  usecase "Toggle User Role" as UC_ROLE
  usecase "View Activity Logs" as UC_LOGS
  usecase "Clear Activity Logs" as UC_CLEAR
}

' Instructor associations
instructor --> UC_REGISTER
instructor --> UC_LOGIN
instructor --> UC_LOGOUT
instructor --> UC_RESET
instructor --> UC_UPLOAD
instructor --> UC_CONFIG
instructor --> UC_ANALYZE
instructor --> UC_VIEW
instructor --> UC_DETAIL
instructor --> UC_EXPORT

' Admin inherits instructor
admin --|> instructor
admin --> UC_USERS
admin --> UC_ROLE
admin --> UC_LOGS
admin --> UC_CLEAR

' Include/extend relationships
UC_REGISTER .> UC_VERIFY : <<include>>
UC_RESET .> smtp : <<include>>
UC_REGISTER .> smtp : <<extend>>\n[if SMTP configured]
UC_UPLOAD .> browser : <<include>>
UC_UPLOAD .> UC_PARSE : <<include>>
UC_PARSE .> UC_DETECT : <<extend>>\n[auto-detect enabled]
UC_ANALYZE .> UC_CONFIG : <<include>>
UC_VIEW .> UC_DETAIL : <<extend>>\n[on row click]
UC_EXPORT .> UC_VIEW : <<include>>
@enduml
```

---

## 2. Class Diagram

```plantuml
@startuml class_diagram
skinparam classBackgroundColor #1e3a4a
skinparam classBorderColor #3d7a90
skinparam classHeaderBackgroundColor #3d7a90
skinparam classFontColor #ffffff
skinparam classAttributeFontColor #cce8f4
skinparam arrowColor #3d7a90
skinparam stereotypeCBackgroundColor #3d7a90

' ─── Domain Types ───────────────────────────────────────

class AttendanceConfig {
  +classStart: string
  +classEnd: string
  +lateThreshold: number
  +absentThreshold: number
  +maxScore: number
  +latePenalty: number
  +absentPenalty: number
  +timesLocked: boolean
}

class RawRecord {
  +name: string
  +id?: string
  +role?: string
  +joinTime?: Date
}

class ParsedFile {
  +filename: string
  +records: RawRecord[]
  +detectedDate?: string
}

class SessionRecord {
  +filename: string
  +date?: string
  +status: AttendanceStatus
  +joinTime?: string
}

class Student {
  +name: string
  +id?: string
  +role?: string
  +normal: number
  +late: number
  +absent: number
  +score: number
  +sessions: SessionRecord[]
  +firstDate?: string
  +lastDate?: string
}

enum AttendanceStatus {
  Normal
  Late
  Absent
}

' ─── Utilities / Services ─────────────────────────────

class ExcelParser <<utility>> {
  +parseFile(file: File): Promise<ParsedFile>
  +extractEarliestJoins(file: ParsedFile): Map<string, RawRecord>
  -detectHeaderRow(rows: any[][]): number
  -detectColumns(header: string[]): ColumnMap
  -cleanName(raw: string): string
  -parseJoinTime(raw: any): Date | undefined
  -autoDetectSeparator(text: string): string
}

class ScoringEngine <<utility>> {
  +analyzeAttendance(files: ParsedFile[], config: AttendanceConfig): Student[]
  +classifyJoinTime(joinTime: Date | undefined, config: AttendanceConfig): AttendanceStatus
  +autoDetectClassTimes(files: ParsedFile[]): Partial<AttendanceConfig>
  -computeScore(student: StudentAccumulator, config: AttendanceConfig): number
  -normalizeToDay(date: Date): Date
}

class ExportService <<utility>> {
  +exportCSV(students: Student[], config: AttendanceConfig): void
  +exportTXT(students: Student[], config: AttendanceConfig): void
  +exportPDF(students: Student[], config: AttendanceConfig): void
  -downloadBlob(content: string, filename: string, mime: string): void
}

' ─── Zustand Stores ───────────────────────────────────

class AuthStore <<store>> {
  +user: User | null
  +accessToken: string | null
  +isLoading: boolean
  +setAuth(user: User, token: string): void
  +setToken(token: string): void
  +clearAuth(): void
  +setLoading(loading: boolean): void
}

class AppStore <<store>> {
  +config: AttendanceConfig
  +students: Student[]
  +numSessions: number
  +fileNames: string[]
  +setConfig(config: Partial<AttendanceConfig>): void
  +setResults(students: Student[], numSessions: number): void
  +setFileNames(names: string[]): void
}

' ─── API Layer ────────────────────────────────────────

class ApiClient <<singleton>> {
  -baseURL: string
  -axiosInstance: AxiosInstance
  +authApi: AuthApi
  +adminApi: AdminApi
  -onRequest(config): AxiosRequestConfig
  -onResponseError(error): Promise
}

class AuthApi {
  +signup(email, password): Promise<void>
  +login(email, password): Promise<LoginResponse>
  +logout(): Promise<void>
  +refresh(): Promise<RefreshResponse>
  +verifyEmail(token): Promise<void>
  +forgotPassword(email): Promise<void>
  +resetPassword(token, password): Promise<void>
}

class AdminApi {
  +getUsers(page, search): Promise<UsersResponse>
  +getActivity(page, email): Promise<ActivityResponse>
  +clearActivity(email?): Promise<void>
  +updateRole(email, role): Promise<void>
}

' ─── User & Admin Models (Backend) ────────────────────

class User {
  +email: string
  +role: "user" | "admin"
  +verified: boolean
  +createdAt: string
  +lastLogin?: string
}

class ActivityLog {
  +id: number
  +userEmail: string
  +action: string
  +detail?: string
  +createdAt: string
}

' ─── Relationships ────────────────────────────────────

ParsedFile "1" *-- "0..*" RawRecord
Student "1" *-- "1..*" SessionRecord
SessionRecord --> AttendanceStatus

ExcelParser ..> ParsedFile : creates
ExcelParser ..> RawRecord : creates
ScoringEngine ..> Student : creates
ScoringEngine ..> SessionRecord : creates
ScoringEngine --> AttendanceConfig : uses
ScoringEngine --> AttendanceStatus : assigns
ExportService --> Student : reads

AppStore --> Student : stores
AppStore --> AttendanceConfig : stores
AuthStore --> User : stores

ApiClient --> AuthApi : contains
ApiClient --> AdminApi : contains
ApiClient --> AuthStore : reads token from

@enduml
```

---

## 3. Sequence Diagram — User Login

```plantuml
@startuml seq_login
skinparam sequenceArrowThickness 2
skinparam roundcorner 10
skinparam sequenceParticipantBackgroundColor #1e3a4a
skinparam sequenceParticipantBorderColor #3d7a90
skinparam sequenceParticipantFontColor #ffffff
skinparam sequenceGroupBodyBackgroundColor #0f2233
skinparam noteBorderColor #3d7a90
skinparam noteBackgroundColor #1e3a4a
skinparam noteFontColor #cce8f4

actor User
participant "LoginPage\n(React)" as UI
participant "AuthStore\n(Zustand)" as Store
participant "ApiClient\n(Axios)" as API
participant "Express\n/api/auth/login" as Server
database "SQLite DB" as DB

User -> UI: Enter email + password, click Login
UI -> API: authApi.login(email, password)
API -> Server: POST /api/auth/login\n{email, password}
Server -> DB: SELECT user WHERE email = ?
DB --> Server: user record
Server -> Server: bcrypt.compare(password, hash)
alt Invalid credentials
  Server --> API: 401 Unauthorized
  API --> UI: throw error
  UI --> User: toast "Invalid credentials"
else Valid credentials
  Server -> DB: INSERT refresh_token\n(token, expires_at)
  Server -> DB: UPDATE users SET last_login = NOW()
  Server -> DB: INSERT activity_log\n(email, 'login')
  Server --> API: 200 OK\n{accessToken, user}\nSet-Cookie: refreshToken (httpOnly)
  API -> Store: setAuth(user, accessToken)
  Store --> UI: auth state updated
  UI --> User: redirect to /dashboard
end
@enduml
```

---

## 4. Sequence Diagram — Attendance Analysis

```plantuml
@startuml seq_analysis
skinparam sequenceArrowThickness 2
skinparam roundcorner 10
skinparam sequenceParticipantBackgroundColor #1e3a4a
skinparam sequenceParticipantBorderColor #3d7a90
skinparam sequenceParticipantFontColor #ffffff
skinparam noteBorderColor #3d7a90
skinparam noteBackgroundColor #1e3a4a
skinparam noteFontColor #cce8f4

actor Instructor
participant "DashboardPage\n(React)" as UI
participant "ExcelParser\n(Browser)" as Parser
participant "ScoringEngine" as Scorer
participant "AppStore\n(Zustand)" as Store
participant "ExportService" as Exporter

Instructor -> UI: Drop/select attendance files
loop For each file
  UI -> Parser: parseFile(file)
  Parser -> Parser: detectHeaderRow(rows)
  Parser -> Parser: detectColumns(header)
  Parser -> Parser: extractEarliestJoins()
  Parser --> UI: ParsedFile{filename, records[]}
end
UI -> UI: autoDetectClassTimes(files)\n[25th percentile of join times]
UI -> Store: setConfig({classStart, classEnd, timesLocked: true})

Instructor -> UI: Adjust thresholds (optional)\nClick "Analyze"
UI -> Store: read current config
UI -> Scorer: analyzeAttendance(files, config)

loop For each ParsedFile
  loop For each student record
    Scorer -> Scorer: classifyJoinTime(joinTime, config)
    note right: Normal / Late / Absent\nbased on minute diff
    Scorer -> Scorer: accumulate session record
  end
  Scorer -> Scorer: mark absent students\n(in master set but not in this file)
end

loop For each student
  Scorer -> Scorer: computeScore()\nmax(0, 100 − late×p − absent×p)
end
Scorer --> UI: Student[] sorted by score desc

UI -> Store: setResults(students, numSessions)
Store --> UI: state updated
UI --> Instructor: render results table + charts

Instructor -> UI: Click export button
UI -> Exporter: exportCSV / exportTXT / exportPDF
Exporter -> Exporter: format data + formula header
Exporter --> Instructor: browser download triggered
@enduml
```

---

## 5. Sequence Diagram — Token Refresh (Silent)

```plantuml
@startuml seq_refresh
skinparam sequenceArrowThickness 2
skinparam roundcorner 10
skinparam sequenceParticipantBackgroundColor #1e3a4a
skinparam sequenceParticipantBorderColor #3d7a90
skinparam sequenceParticipantFontColor #ffffff

participant "React App" as App
participant "Axios\nInterceptor" as Interceptor
participant "Express\n/api/auth/refresh" as RefreshRoute
database "SQLite\nrefresh_tokens" as DB
participant "AuthStore" as Store

App -> Interceptor: Any API request (expired access token)
Interceptor -> RefreshRoute: POST /api/auth/refresh\n[Cookie: refreshToken]
RefreshRoute -> RefreshRoute: verifyRefreshToken(cookie)
RefreshRoute -> DB: SELECT token WHERE token = ?
alt Token not found or expired
  DB --> RefreshRoute: not found
  RefreshRoute --> Interceptor: 401 Unauthorized
  Interceptor -> Store: clearAuth()
  Interceptor --> App: redirect to /login
else Token valid
  DB --> RefreshRoute: token record
  RefreshRoute -> RefreshRoute: generateAccessToken(email, role)
  RefreshRoute --> Interceptor: 200 OK {accessToken}
  Interceptor -> Store: setToken(accessToken)
  Interceptor -> Interceptor: retry all queued requests\nwith new token
  Interceptor --> App: original response
end
@enduml
```

---

## 6. Sequence Diagram — Password Reset

```plantuml
@startuml seq_reset
skinparam sequenceArrowThickness 2
skinparam roundcorner 10
skinparam sequenceParticipantBackgroundColor #1e3a4a
skinparam sequenceParticipantBorderColor #3d7a90
skinparam sequenceParticipantFontColor #ffffff

actor User
participant "ForgotPasswordPage" as ForgotUI
participant "ResetPasswordPage" as ResetUI
participant "Express /api/auth/forgot" as ForgotRoute
participant "Express /api/auth/reset" as ResetRoute
participant "Nodemailer\n(SMTP)" as Mail
database "SQLite" as DB

User -> ForgotUI: Enter email, submit
ForgotUI -> ForgotRoute: POST /api/auth/forgot {email}
ForgotRoute -> DB: SELECT user WHERE email = ?
note right: Anti-enumeration:\nalways returns 200 OK
alt User exists
  ForgotRoute -> ForgotRoute: generateToken(32 bytes)
  ForgotRoute -> DB: UPDATE users SET reset_token,\nreset_token_expires = now+1h
  ForgotRoute -> Mail: sendResetEmail(email, token)
  Mail --> User: Email with reset link\n/reset-password?token=XYZ
end
ForgotRoute --> ForgotUI: 200 OK (always)
ForgotUI --> User: "If your email is registered,\nyou will receive a link"

User -> ResetUI: Click email link, enter new password
ResetUI -> ResetRoute: POST /api/auth/reset {token, password}
ResetRoute -> DB: SELECT user WHERE reset_token = ?\nAND expires > NOW()
alt Token invalid or expired
  DB --> ResetRoute: not found
  ResetRoute --> ResetUI: 400 Bad Request
  ResetUI --> User: "Invalid or expired link"
else Token valid
  ResetRoute -> ResetRoute: bcrypt.hash(newPassword, 12)
  ResetRoute -> DB: UPDATE users SET password_hash,\nreset_token=NULL, expires=NULL
  ResetRoute -> DB: DELETE FROM refresh_tokens\nWHERE user_email = ?
  ResetRoute --> ResetUI: 200 OK
  ResetUI --> User: redirect to /login\n"Password reset successful"
end
@enduml
```

---

## 7. Component Diagram

```plantuml
@startuml component_diagram
skinparam componentBackgroundColor #1e3a4a
skinparam componentBorderColor #3d7a90
skinparam componentFontColor #ffffff
skinparam packageBackgroundColor #0f2233
skinparam packageBorderColor #3d7a90
skinparam packageFontColor #cce8f4
skinparam arrowColor #3d7a90
skinparam interfaceBackgroundColor #3d7a90

package "Client (Browser / Vercel CDN)" {
  package "Pages" {
    [DashboardPage] as Dashboard
    [LoginPage] as Login
    [SignupPage] as Signup
    [AuthPages] as AuthPgs
    [AdminPage] as Admin
  }

  package "State Management" {
    [AuthStore] as AuthSt
    [AppStore] as AppSt
  }

  package "Utilities" {
    [ExcelParser] as Parser
    [ScoringEngine] as Scorer
    [ExportService] as Exporter
  }

  package "API Layer" {
    [Axios Client] as AxiosClient
    [Request Interceptor] as ReqInt
    [Response Interceptor\n(Token Refresh)] as ResInt
  }

  package "UI Components" {
    [AppLayout / Navbar] as Layout
    [ConfigPanel] as ConfigUI
    [ResultsTable] as Table
    [Charts (Recharts)] as Charts
  }

  Dashboard --> Parser : uses
  Dashboard --> Scorer : uses
  Dashboard --> Exporter : uses
  Dashboard --> ConfigUI : renders
  Dashboard --> Table : renders
  Dashboard --> Charts : renders
  Layout --> AuthSt : reads
  AxiosClient --> AuthSt : reads token
  AxiosClient --> ReqInt : uses
  AxiosClient --> ResInt : uses
}

package "Server (Railway / Render)" {
  package "Express API" {
    [Auth Routes\n/api/auth/*] as AuthRoutes
    [Admin Routes\n/api/admin/*] as AdminRoutes
    [Static File Server\n/client/dist] as Static
    [Health Check\n/api/health] as Health
  }

  package "Middleware" {
    [Helmet] as Helmet
    [CORS] as CORS
    [requireAuth] as AuthMW
    [requireAdmin] as AdminMW
  }

  package "Services" {
    [JWT Utils] as JWT
    [Email Utils\n(Nodemailer)] as Email
  }

  database "SQLite\n(better-sqlite3)" as DB

  AuthRoutes --> JWT : uses
  AuthRoutes --> Email : uses
  AuthRoutes --> DB : reads/writes
  AdminRoutes --> AuthMW : guarded by
  AdminRoutes --> AdminMW : guarded by
  AdminRoutes --> DB : reads/writes
  AuthRoutes --> AuthMW : partial
}

package "External Services" {
  [SMTP Server] as SMTP
  [Browser\nFile System] as FileSystem
}

' Inter-package connections
AxiosClient ..> AuthRoutes : REST /api/auth/*\n(JSON + Cookie)
AxiosClient ..> AdminRoutes : REST /api/admin/*\n(Bearer JWT)
Email --> SMTP : SMTP
Dashboard --> FileSystem : File API (parsing)
@enduml
```

---

## 8. Deployment Diagram

```plantuml
@startuml deployment_diagram
skinparam nodeBackgroundColor #1e3a4a
skinparam nodeBorderColor #3d7a90
skinparam nodeFontColor #ffffff
skinparam componentBackgroundColor #0f2233
skinparam componentBorderColor #3d7a90
skinparam componentFontColor #cce8f4
skinparam arrowColor #3d7a90
skinparam databaseBackgroundColor #1e3a4a
skinparam databaseBorderColor #3d7a90

node "User's Browser" as Browser {
  component "React SPA\n(Vite build)" as ReactApp
  component "ExcelParser\n(WebAssembly / JS)" as WasmParser
}

node "Vercel CDN\n(Edge Network)" as Vercel {
  component "Static Assets\n(HTML, JS, CSS)" as Assets
  note right of Assets: client/dist/\nSPA rewrites → index.html
}

node "Railway / Render\n(Node.js 18 Container)" as Backend {
  component "Express Server\n(:3001)" as Express
  component "Auth Routes" as AuthR
  component "Admin Routes" as AdminR
  component "Static Fallback\n(client/dist)" as StaticFallback

  database "SQLite\n(WAL mode)" as SQLite
  note bottom of SQLite: ~/.attendance-analyzer/app.db\nPersisted on host filesystem
}

node "SMTP Server\n(Optional)" as SMTP {
  component "Email Service" as EmailSvc
}

' Connections
Browser --> Vercel : HTTPS\n(GET static assets)
Vercel --> Browser : HTML/JS/CSS bundle
Browser --> Backend : HTTPS REST API\n/api/* (JSON + cookies)
Express --> AuthR
Express --> AdminR
Express --> SQLite : better-sqlite3\n(synchronous)
AuthR --> EmailSvc : SMTP (nodemailer)
EmailSvc --> SMTP

note "Development:\nClient (Vite :5173) proxies\n/api → Express (:3001)" as DevNote
@enduml
```

---

## 9. Entity-Relationship (ER) Diagram

```plantuml
@startuml er_diagram
skinparam entityBackgroundColor #1e3a4a
skinparam entityBorderColor #3d7a90
skinparam entityFontColor #ffffff
skinparam arrowColor #3d7a90

entity "users" as Users {
  * id : INTEGER <<PK, AUTOINCREMENT>>
  --
  * email : TEXT <<UNIQUE>>
  * password_hash : TEXT
  * role : TEXT = 'user'
  * verified : INTEGER = 0
  * created_at : TEXT
  verification_token : TEXT
  verification_token_expires : TEXT
  reset_token : TEXT
  reset_token_expires : TEXT
  remember_token : TEXT
  last_login : TEXT
  last_logout : TEXT
}

entity "refresh_tokens" as RefreshTokens {
  * id : INTEGER <<PK, AUTOINCREMENT>>
  --
  * user_email : TEXT <<FK>>
  * token : TEXT <<UNIQUE>>
  * expires_at : TEXT
  * created_at : TEXT
}

entity "activity_log" as ActivityLog {
  * id : INTEGER <<PK, AUTOINCREMENT>>
  --
  * user_email : TEXT <<FK>>
  * action : TEXT
  detail : TEXT
  * created_at : TEXT
}

note right of ActivityLog
  action values:
  'signup', 'login', 'logout',
  'password_reset_requested',
  'password_reset',
  'email_verified',
  'role_changed'
end note

Users ||--o{ RefreshTokens : "has"
Users ||--o{ ActivityLog : "generates"
@enduml
```

---

## 10. Activity Diagram — File Upload and Analysis

```plantuml
@startuml activity_analysis
skinparam activityBackgroundColor #1e3a4a
skinparam activityBorderColor #3d7a90
skinparam activityFontColor #ffffff
skinparam arrowColor #3d7a90
skinparam diamondBackgroundColor #3d7a90
skinparam diamondFontColor #ffffff
skinparam startColor #3d7a90
skinparam endColor #3d7a90

start

:User drops files onto upload zone;

fork
  :Parse File 1 (ExcelParser);
fork again
  :Parse File 2 (ExcelParser);
fork again
  :Parse File N (ExcelParser);
end fork

:Merge all ParsedFile records;

if (timesLocked?) then (no)
  :autoDetectClassTimes()\n[25th percentile of join times];
  :Update config (classStart, classEnd)\nSet timesLocked = true;
else (yes)
  :Keep existing config;
endif

:User reviews/adjusts configuration\n(thresholds, penalties);

:User clicks "Analyze";

:Build master student set\nacross all files;

repeat
  :Process next session file;
  repeat
    :Get earliest join time\nper student in file;
    :classifyJoinTime(joinTime, config)\n→ Normal / Late / Absent;
    :Append SessionRecord to student;
  repeat while (more students in file?)
  :Mark students absent from this file\n(present in master set but not in file);
repeat while (more files?)

:Compute final score for each student\nmax(0, maxScore − late×p − absent×p);

:Sort students by score descending;

:Render results table, stat cards,\npie chart, and progress bars;

if (User clicks Export?) then (CSV)
  :exportCSV() → browser download;
elseif (User clicks Export?) then (TXT)
  :exportTXT() → browser download;
elseif (User clicks Export?) then (PDF)
  :exportPDF() → browser download;
else (no export)
endif

stop
@enduml
```

---

## 11. State Machine — Authentication Flow

```plantuml
@startuml state_auth
skinparam stateBackgroundColor #1e3a4a
skinparam stateBorderColor #3d7a90
skinparam stateFontColor #ffffff
skinparam arrowColor #3d7a90
skinparam startColor #3d7a90
skinparam endColor #3d7a90

[*] --> Loading : App Startup

Loading --> Authenticated : /api/auth/refresh succeeds\n(valid httpOnly cookie)
Loading --> Unauthenticated : /api/auth/refresh fails\n(no cookie / expired)

Unauthenticated --> Authenticated : POST /api/auth/login\n[valid credentials]
Unauthenticated --> Unauthenticated : POST /api/auth/login\n[invalid credentials]
Unauthenticated --> PendingVerification : POST /api/auth/signup\n[SMTP configured]
PendingVerification --> Unauthenticated : GET /api/auth/verify-email\n[valid token]

Authenticated --> Unauthenticated : POST /api/auth/logout
Authenticated --> Authenticated : API 401 →\nsilent token refresh succeeds
Authenticated --> Unauthenticated : silent token refresh fails\n(redirect to /login)

state Authenticated {
  [*] --> UserRole
  UserRole --> AdminRole : PUT /api/admin/users/:email/role\n[self-promotion by existing admin]
  AdminRole --> UserRole : role toggle
}
@enduml
```
