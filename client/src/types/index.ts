// User & Auth
export interface User {
  email: string;
  role: 'user' | 'admin';
  verified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
}

// Attendance
export type AttendanceStatus = 'Normal' | 'Late' | 'Absent';

export interface SessionRecord {
  filename: string;
  date?: string;
  status: AttendanceStatus;
  joinTime?: string;
}

export interface Student {
  name: string;
  id?: string;
  role?: string;
  normal: number;
  late: number;
  absent: number;
  score: number;
  sessions: SessionRecord[];
  firstDate?: string;
  lastDate?: string;
}

export interface AttendanceConfig {
  classStart: string;        // "09:00"
  classEnd: string;          // "10:00"
  lateThreshold: number;     // minutes
  absentThreshold: number;   // minutes
  maxScore: number;
  latePenalty: number;
  absentPenalty: number;
  timesLocked: boolean;
}

export interface ParsedFile {
  filename: string;
  records: RawRecord[];
  detectedDate?: string;
}

export interface RawRecord {
  name: string;
  id?: string;
  role?: string;
  joinTime?: Date;
}

// Admin
export interface AdminUser {
  email: string;
  role: string;
  verified: number;
  created_at: string;
  last_login?: string;
  last_logout?: string;
}

export interface ActivityLog {
  id: number;
  user_email: string;
  action: string;
  detail?: string;
  created_at: string;
}
