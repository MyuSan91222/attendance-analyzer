import { create } from 'zustand';
import type { AttendanceConfig, Student } from '../types';

const DEFAULT_CONFIG: AttendanceConfig = {
  classStart: '09:00',
  classEnd: '10:00',
  lateThreshold: 10,
  absentThreshold: 30,
  maxScore: 100,
  latePenalty: 1.0,
  absentPenalty: 2.0,
  timesLocked: false,
};

interface AppState {
  config: AttendanceConfig;
  students: Student[];
  numSessions: number;
  fileNames: string[];
  setConfig: (partial: Partial<AttendanceConfig>) => void;
  resetConfig: () => void;
  setResults: (students: Student[], sessions: number, files: string[]) => void;
  clearResults: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  config: { ...DEFAULT_CONFIG },
  students: [],
  numSessions: 0,
  fileNames: [],

  setConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),
  resetConfig: () => set({ config: { ...DEFAULT_CONFIG } }),
  setResults: (students, numSessions, fileNames) => set({ students, numSessions, fileNames }),
  clearResults: () => set({ students: [], numSessions: 0, fileNames: [] }),
}));
