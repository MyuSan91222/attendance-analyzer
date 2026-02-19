import type { AttendanceConfig, Student, SessionRecord, AttendanceStatus } from '../types';
import type { ParsedFile } from '../types';
import { extractEarliestJoins } from './excelParser';

function parseTimeToDate(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(0);
  d.setHours(h, m, 0, 0);
  return d;
}

function classifyJoinTime(joinTime: Date | undefined, config: AttendanceConfig): AttendanceStatus {
  if (!joinTime) return 'Absent';
  
  const classStart = parseTimeToDate(config.classStart);
  const refDate = new Date(joinTime);
  refDate.setFullYear(1970, 0, 1);
  classStart.setFullYear(1970, 0, 1);

  const diffMinutes = (refDate.getTime() - classStart.getTime()) / 60000;

  if (diffMinutes <= config.lateThreshold) return 'Normal';
  if (diffMinutes <= config.absentThreshold) return 'Late';
  return 'Absent';
}

export function analyzeAttendance(files: ParsedFile[], config: AttendanceConfig): Student[] {
  // Build a master map: studentName -> per-session records
  const studentMap = new Map<string, { id?: string; role?: string; sessions: SessionRecord[] }>();

  for (const file of files) {
    const earliestJoins = extractEarliestJoins(file);

    for (const [nameKey, { joinTime, id }] of earliestJoins) {
      const originalRecord = file.records.find(r => r.name.toLowerCase() === nameKey);
      const role = originalRecord?.role;

      const existing = studentMap.get(nameKey);
      const isoDate = joinTime
        ? joinTime.toISOString().split('T')[0]
        : undefined;
      const sessionRecord: SessionRecord = {
        filename: file.filename,
        date: file.detectedDate || isoDate,
        status: classifyJoinTime(joinTime, config),
        joinTime: joinTime?.toLocaleTimeString(),
      };

      if (existing) {
        existing.sessions.push(sessionRecord);
        if (!existing.role && role) existing.role = role;
      } else {
        studentMap.set(nameKey, {
          id: id || undefined,
          role: role || undefined,
          sessions: [sessionRecord],
        });
      }
    }
  }

  // Also account for students absent in some sessions (files they don't appear in)
  // Students who appear in fewer files than total get Absent for missing sessions
  const totalSessions = files.length;
  for (const [nameKey, data] of studentMap) {
    const presentFiles = new Set(data.sessions.map(s => s.filename));
    for (const file of files) {
      if (!presentFiles.has(file.filename)) {
        data.sessions.push({
          filename: file.filename,
          date: file.detectedDate,
          status: 'Absent',
          joinTime: undefined,
        });
      }
    }
  }

  // Compute scores
  const students: Student[] = [];
  for (const [nameKey, data] of studentMap) {
    const originalRecord = files.flatMap(f => f.records).find(r => r.name.toLowerCase() === nameKey);
    const name = originalRecord?.name || nameKey;

    const normal = data.sessions.filter(s => s.status === 'Normal').length;
    const late   = data.sessions.filter(s => s.status === 'Late').length;
    const absent = data.sessions.filter(s => s.status === 'Absent').length;
    const score  = Math.max(0, config.maxScore - late * config.latePenalty - absent * config.absentPenalty);

    // First/last date from sessions where they actually attended (not absent)
    const attendedDates = data.sessions
      .filter(s => s.status !== 'Absent' && s.date)
      .map(s => s.date!)
      .sort();
    const firstDate = attendedDates[0];
    const lastDate  = attendedDates[attendedDates.length - 1];

    students.push({
      name, id: data.id, role: data.role,
      normal, late, absent, score,
      sessions: data.sessions,
      firstDate, lastDate,
    });
  }

  return students.sort((a, b) => b.score - a.score);
}

export function autoDetectClassTimes(files: ParsedFile[]): { start: string; end: string } | null {
  const allJoinTimes: Date[] = [];
  for (const file of files) {
    for (const record of file.records) {
      if (record.joinTime) allJoinTimes.push(record.joinTime);
    }
  }
  if (allJoinTimes.length === 0) return null;

  // Use 25th percentile as class start estimate
  const sorted = [...allJoinTimes].sort((a, b) => {
    const aMin = a.getHours() * 60 + a.getMinutes();
    const bMin = b.getHours() * 60 + b.getMinutes();
    return aMin - bMin;
  });

  const p25 = sorted[Math.floor(sorted.length * 0.25)];
  const startHour = p25.getHours();
  const startMin = p25.getMinutes();
  const start = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
  const endHour = startHour + 1;
  const end = `${String(endHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;

  return { start, end };
}
