import { create } from 'zustand';

const DEFAULT_CONFIG = {
  classStart: '09:00',
  classEnd: '10:00',
  lateThreshold: 10,
  absentThreshold: 30,
  maxScore: 100,
  latePenalty: 1.0,
  absentPenalty: 2.0,
  timesLocked: false,
};

export const useAppStore = create((set) => ({
  config: { ...DEFAULT_CONFIG },
  committedConfig: null,
  originalConfig: null,
  students: [],
  numSessions: 0,
  fileNames: [],

  setConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),
  resetConfig: () => set({ config: { ...DEFAULT_CONFIG } }),
  commitConfig: () => set((s) => ({ committedConfig: { ...s.config } })),
  setOriginalConfig: () => set((s) => ({ originalConfig: { ...s.config } })),
  clearCommittedConfig: () => set({ committedConfig: null, originalConfig: null }),
  setResults: (students, numSessions, fileNames) => set({ students, numSessions, fileNames }),
  clearResults: () => set({ students: [], numSessions: 0, fileNames: [] }),
}));
