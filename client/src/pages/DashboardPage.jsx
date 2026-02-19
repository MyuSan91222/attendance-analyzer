import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, FileSpreadsheet, X, Play, RotateCcw, ChevronDown,
  ChevronUp, Download, FileText, FileType, BarChart2, Users, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppStore } from '../store/appStore';
import { parseExcelFile } from '../utils/excelParser';
import { analyzeAttendance, autoDetectClassTimes } from '../utils/scoring';
import { exportCSV, exportTXT, exportPDF } from '../utils/exporters';

const SCORE_COLORS = { high: '#1565c0', mid: '#7c4900', low: '#374151' };
const PIE_COLORS = ['#024e78', '#1e293b', '#5c3c14'];

function getScoreColor(score, max) {
  const pct = score / max;
  if (pct >= 0.9) return SCORE_COLORS.high;
  if (pct >= 0.7) return SCORE_COLORS.mid;
  return SCORE_COLORS.low;
}

function RoleBadge({ role }) {
  const isOrganizer = role?.toLowerCase() === 'organizer';
  const isPresenter = role?.toLowerCase() === 'presenter';
  
  if (isOrganizer) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-ink-700/50 text-ink-300 border border-ink-600/50">
        Organizer
      </span>
    );
  }
  
  if (isPresenter) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-ink-700/50 text-ink-300 border border-ink-600/50">
        Presenter
      </span>
    );
  }
  
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium bg-ink-800 text-ink-400">
      Attendee
    </span>
  );
}

// ── iPhone-style wheel picker ──────────────────────────────────────────────────

function WheelColumn({ items, selected, onChange, disabled, format }) {
  const ref = useRef(null);
  const isProgrammatic = useRef(false);
  const ITEM_HEIGHT = 40;
  const PADDING = 2;

  useEffect(() => {
    if (!ref.current) return;
    isProgrammatic.current = true;
    const idx = items.indexOf(selected);
    ref.current.scrollTop = (idx < 0 ? 0 : idx) * ITEM_HEIGHT;
    const t = setTimeout(() => { isProgrammatic.current = false; }, 200);
    return () => clearTimeout(t);
  }, [selected, items]);

  const handleScroll = useCallback(() => {
    if (isProgrammatic.current || !ref.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (items[clamped] !== selected) onChange(items[clamped]);
  }, [items, selected, onChange]);

  return (
    <div className="relative flex-1" style={{ height: ITEM_HEIGHT * 5, overflow: 'hidden' }}>
      {/* Top fade */}
      <div className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ height: ITEM_HEIGHT * 2, background: 'linear-gradient(to bottom, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0) 100%)' }} />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ height: ITEM_HEIGHT * 2, background: 'linear-gradient(to top, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0) 100%)' }} />
      {/* Center selection bar */}
      <div className="absolute inset-x-2 z-10 pointer-events-none rounded-lg border border-accent/40 bg-accent/8"
        style={{ top: ITEM_HEIGHT * PADDING, height: ITEM_HEIGHT }} />

      <div ref={ref} onScroll={handleScroll} className="wheel-scroll h-full overflow-y-scroll"
        style={{ scrollSnapType: 'y mandatory' }}>
        {Array.from({ length: PADDING }).map((_, i) => (
          <div key={`t${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}
        {items.map((item, idx) => {
          const dist = Math.abs(idx - items.indexOf(selected));
          return (
            <div key={item} onClick={() => !disabled && onChange(item)}
              style={{
                height: ITEM_HEIGHT, scrollSnapAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: dist === 0 ? '22px' : dist === 1 ? '15px' : '12px',
                fontWeight: dist === 0 ? 700 : 400,
                color: dist === 0 ? '#142333' : dist === 1 ? '#4f6c7c' : '#c8d3dc',
                opacity: disabled ? 0.45 : 1,
                cursor: disabled ? 'default' : 'pointer',
                userSelect: 'none', transition: 'font-size 0.1s, color 0.1s',
              }}>
              {format(item)}
            </div>
          );
        })}
        {Array.from({ length: PADDING }).map((_, i) => (
          <div key={`b${i}`} style={{ height: ITEM_HEIGHT }} />
        ))}
      </div>
    </div>
  );
}

function TimeWheelPicker({ value, onChange, disabled }) {
  const [hStr, mStr] = value.split(':');
  const hours = parseInt(hStr) || 0;
  const minutes = parseInt(mStr) || 0;
  const pad = (n) => String(n).padStart(2, '0');
  const hourItems = Array.from({ length: 24 }, (_, i) => i);
  const minuteItems = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={`flex items-stretch border-2 rounded-2xl overflow-hidden bg-white ${disabled ? 'border-ink-800 opacity-60' : 'border-accent/40'}`}
      style={{ height: 40 * 5 }}>
      <WheelColumn items={hourItems} selected={hours} disabled={disabled} format={pad}
        onChange={(h) => !disabled && onChange(`${pad(h)}:${pad(minutes)}`)} />
      <div className="flex flex-col items-center justify-center gap-3 px-1 select-none">
        <div className="w-1.5 h-1.5 rounded-full bg-ink-500" />
        <div className="w-1.5 h-1.5 rounded-full bg-ink-500" />
      </div>
      <WheelColumn items={minuteItems} selected={minutes} disabled={disabled} format={pad}
        onChange={(m) => !disabled && onChange(`${pad(hours)}:${pad(m)}`)} />
    </div>
  );
}

// ── Config panel ───────────────────────────────────────────────────────────────

function ConfigPanel({ hasChanges, onApply, onCancel, hasGoBack, onGoBack }) {
  const { config, setConfig, resetConfig } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Class Schedule */}
      <div>
        <p className="label mb-3">Class Schedule</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-ink-500 mb-2 block">Start</label>
            <TimeWheelPicker value={config.classStart} disabled={config.timesLocked}
              onChange={v => setConfig({ classStart: v })} />
          </div>
          <div>
            <label className="text-xs text-ink-500 mb-2 block">End</label>
            <TimeWheelPicker value={config.classEnd} disabled={config.timesLocked}
              onChange={v => setConfig({ classEnd: v })} />
          </div>
        </div>
        {config.timesLocked && (
          <button onClick={() => setConfig({ timesLocked: false })}
            className="text-xs text-ink-500 hover:text-accent transition-colors mt-2">
            Override lock
          </button>
        )}
      </div>

      {/* Thresholds */}
      <div>
        <p className="label mb-3">Thresholds (minutes)</p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-ink-400">Late after</label>
              <span className="text-xs font-mono text-accent">{config.lateThreshold}m</span>
            </div>
            <input type="range" min={0} max={60} value={config.lateThreshold}
              onChange={e => setConfig({ lateThreshold: +e.target.value })}
              className="w-full accent-accent" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-ink-400">Absent after</label>
              <span className="text-xs font-mono text-accent">{config.absentThreshold}m</span>
            </div>
            <input type="range" min={0} max={240} value={config.absentThreshold}
              onChange={e => setConfig({ absentThreshold: +e.target.value })}
              className="w-full accent-accent" />
          </div>
        </div>
      </div>

      {/* Scoring */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="label">Scoring</p>
          <button onClick={resetConfig} className="text-xs text-ink-500 hover:text-accent transition-colors flex items-center gap-1">
            <RotateCcw size={11} />Reset
          </button>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-ink-400 mb-1 block">Max Score</label>
            <input type="number" className="input text-sm" value={config.maxScore} min={0}
              onChange={e => setConfig({ maxScore: +e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-ink-400 mb-1 block">Late penalty</label>
              <input type="number" className="input text-sm" value={config.latePenalty} min={0} step={0.5}
                onChange={e => setConfig({ latePenalty: +e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-ink-400 mb-1 block">Absent penalty</label>
              <input type="number" className="input text-sm" value={config.absentPenalty} min={0} step={0.5}
                onChange={e => setConfig({ absentPenalty: +e.target.value })} />
            </div>
          </div>
        </div>
        <div className="mt-3 bg-ink-800/60 rounded-lg p-3">
          <p className="text-xs text-ink-500 font-mono leading-relaxed">
            Score = {config.maxScore}<br />
            &nbsp;&nbsp;− (Late × {config.latePenalty})<br />
            &nbsp;&nbsp;− (Absent × {config.absentPenalty})
          </p>
        </div>
      </div>

      {/* Cancel / Apply — shown when config differs from last analysis */}
      {hasChanges && (
        <div className="pt-2 border-t border-ink-800 space-y-2">
          <p className="text-xs text-warning font-medium">Unsaved changes</p>
          <button onClick={onApply}
            className="w-full btn-primary flex items-center justify-center gap-2 py-2">
            <Play size={12} />Apply Change
          </button>
          <button onClick={onCancel}
            className="w-full btn-ghost flex items-center justify-center gap-2 py-2 text-xs">
            <RotateCcw size={12} />Cancel Change
          </button>
        </div>
      )}

      {/* Go Back — shown after Apply was used at least once */}
      {hasGoBack && !hasChanges && (
        <div className="pt-2 border-t border-ink-800 space-y-2">
          <p className="text-xs text-ink-500">Original auto-detected analysis</p>
          <button onClick={onGoBack}
            className="w-full btn-ghost flex items-center justify-center gap-2 py-2 text-xs text-accent hover:text-accent-dark">
            <RotateCcw size={12} />Go Back to Original
          </button>
        </div>
      )}
    </div>
  );
}

// ── Student table row ─────────────────────────────────────────────────────────

function StudentRow({ student, maxScore, isSelected, onSelect }) {
  const scoreColor = getScoreColor(student.score, maxScore);
  const isOrganizer = student.role?.toLowerCase() === 'organizer';
  const isPresenter = student.role?.toLowerCase() === 'presenter';
  const total = student.normal + student.late + student.absent;

  return (
    <tr
      onClick={() => onSelect(student)}
      className={`border-b border-ink-700 cursor-pointer transition-colors
        ${isSelected
          ? 'bg-accent/10 border-l-4 border-l-accent'
          : isOrganizer
            ? 'bg-ink-800/50 hover:bg-ink-800/70'
            : isPresenter
              ? 'bg-ink-900/30 hover:bg-ink-900/50'
              : 'hover:bg-ink-900/40'}
      `}
    >
      {/* Role */}
      <td className="py-3 pl-4 pr-3 whitespace-nowrap border-r border-ink-700">
        <RoleBadge role={student.role} />
      </td>

      {/* Name */}
      <td className={`py-3 px-3 text-sm whitespace-nowrap border-r border-ink-700 ${isOrganizer ? 'font-bold text-ink-50' : isPresenter ? 'font-semibold text-ink-100' : 'text-ink-200'}`}>
        {student.name}
      </td>

      {/* ID */}
      <td className="py-3 px-3 text-xs text-ink-300 font-mono whitespace-nowrap border-r border-ink-700">
        {student.id ? <span className="bg-ink-800/40 px-2 py-0.5 rounded">{student.id}</span> : <span className="text-ink-600">—</span>}
      </td>

      {/* First Date */}
      <td className="py-3 px-3 text-xs text-ink-400 whitespace-nowrap border-r border-ink-700">
        {student.firstDate || '—'}
      </td>

      {/* Last Date */}
      <td className="py-3 px-3 text-xs text-ink-400 whitespace-nowrap border-r border-ink-700">
        {student.lastDate || '—'}
      </td>

      {/* Total Classes */}
      <td className="py-3 px-3 text-sm text-center font-medium text-ink-300 whitespace-nowrap border-r border-ink-700">
        {total}
      </td>

      {/* On-Time */}
      <td className="py-3 px-3 text-center whitespace-nowrap border-r border-ink-700">
        <span className="badge-normal">{student.normal}</span>
      </td>

      {/* Late */}
      <td className="py-3 px-3 text-center whitespace-nowrap border-r border-ink-700">
        <span className="badge-late">{student.late}</span>
      </td>

      {/* Absent */}
      <td className="py-3 px-3 text-center whitespace-nowrap border-r border-ink-700">
        <span className="badge-absent">{student.absent}</span>
      </td>

      {/* Score */}
      <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
        <span className="text-sm font-bold font-mono" style={{ color: scoreColor }}>
          {student.score.toFixed(1)}
          <span className="text-ink-600 font-normal">/{maxScore}</span>
        </span>
      </td>
    </tr>
  );
}

// ── Individual detail section ─────────────────────────────────────────────────

function IndividualSection({ student, maxScore, onClose }) {
  if (!student) return null;

  const scoreColor = getScoreColor(student.score, maxScore);
  const total = student.normal + student.late + student.absent;
  const pct = (student.score / maxScore) * 100;

  return (
    <div className="card animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-ink-800 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-ink-800 flex items-center justify-center flex-shrink-0">
          <User size={18} className="text-ink-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-ink-100" style={{ fontFamily: 'Syne' }}>
              {student.name}
            </h3>
            <RoleBadge role={student.role} />
          </div>
          <div className="flex items-center gap-4 mt-1">
            {student.id && (
              <span className="text-xs text-ink-500 font-mono">{student.id}</span>
            )}
            <span className="text-xs text-ink-600">
              {student.firstDate && student.lastDate
                ? `${student.firstDate} → ${student.lastDate}`
                : student.firstDate || ''}
            </span>
          </div>
        </div>

        {/* Score block */}
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold font-mono leading-none" style={{ color: scoreColor, fontFamily: 'Syne' }}>
            {student.score.toFixed(1)}
            <span className="text-sm text-ink-600 font-normal">/{maxScore}</span>
          </p>
          <div className="mt-2 flex gap-3 text-xs text-ink-500 justify-end">
            <span style={{ color: '#024e78' }}>{student.normal} on-time</span>
            <span style={{ color: '#1e293b' }}>{student.late} late</span>
            <span style={{ color: '#5c3c14' }}>{student.absent} absent</span>
          </div>
        </div>

        <button onClick={onClose}
          className="text-ink-600 hover:text-ink-300 transition-colors flex-shrink-0 ml-1">
          <X size={16} />
        </button>
      </div>

      {/* Score bar */}
      <div className="px-4 py-3 border-b border-ink-800">
        <div className="flex items-center justify-between text-xs text-ink-500 mb-1.5">
          <span>Score</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: scoreColor }} />
        </div>
      </div>

      {/* Session breakdown table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-ink-800">
              {['#', 'Session File', 'Date', 'Join Time', 'Status'].map((h, i) => (
                <th key={h}
                  className={`py-2.5 text-xs font-medium text-ink-500
                    ${i === 0 ? 'pl-4 pr-2 text-left w-8' :
                      i === 1 ? 'px-3 text-left' :
                      i === 4 ? 'pl-3 pr-4 text-right' : 'px-3 text-left'}`}
                  style={{ fontFamily: 'Syne', letterSpacing: '0.05em' }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {student.sessions.map((s, i) => (
              <tr key={i} className="border-b border-ink-800/40 hover:bg-ink-800/20 transition-colors">
                <td className="py-2.5 pl-4 pr-2 text-xs text-ink-600">{i + 1}</td>
                <td className="py-2.5 px-3 text-xs text-ink-400 max-w-[240px] truncate">
                  {s.filename}
                </td>
                <td className="py-2.5 px-3 text-xs text-ink-500 whitespace-nowrap">
                  {s.date || '—'}
                </td>
                <td className="py-2.5 px-3 text-xs font-mono text-ink-500 whitespace-nowrap">
                  {s.joinTime || '—'}
                </td>
                <td className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                  <span className={`badge-${s.status.toLowerCase()}`}>{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { config, setConfig, committedConfig, commitConfig, originalConfig, setOriginalConfig, clearCommittedConfig, students, numSessions, fileNames, setResults, clearResults } = useAppStore();
  const [parsedFiles, setParsedFiles] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const onDrop = useCallback(async (accepted) => {
    const xlsxFiles = accepted.filter(f =>
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
    );
    if (!xlsxFiles.length) {
      toast.error('Please upload Excel (.xlsx, .xls) or CSV files');
      return;
    }

    const toastId = toast.loading(`Parsing ${xlsxFiles.length} file(s)...`);
    try {
      const parsed = await Promise.all(xlsxFiles.map(parseExcelFile));
      setParsedFiles(prev => {
        const existing = new Set(prev.map(f => f.filename));
        const newFiles = parsed.filter(f => !existing.has(f.filename));
        return [...prev, ...newFiles];
      });

      if (!config.timesLocked) {
        const detected = autoDetectClassTimes(parsed);
        if (detected) {
          setConfig({ classStart: detected.start, classEnd: detected.end, timesLocked: true });
          toast.success(`Auto-detected class time: ${detected.start}`, { id: toastId });
        } else {
          toast.success(`Loaded ${xlsxFiles.length} file(s)`, { id: toastId });
        }
      } else {
        toast.success(`Added ${xlsxFiles.length} file(s)`, { id: toastId });
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
    }
  }, [config.timesLocked]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: true,
  });

  const handleAnalyze = async () => {
    if (!parsedFiles.length) { toast.error('Upload files first'); return; }
    setIsAnalyzing(true);
    setSelectedStudent(null);
    await new Promise(r => setTimeout(r, 50));
    try {
      const results = analyzeAttendance(parsedFiles, config);
      setResults(results, parsedFiles.length, parsedFiles.map(f => f.filename));
      commitConfig();
      if (!originalConfig) setOriginalConfig();
      toast.success(`Analyzed ${results.length} students across ${parsedFiles.length} sessions`);
    } catch (err) {
      toast.error('Analysis failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setParsedFiles([]);
    clearResults();
    clearCommittedConfig();
    setConfig({ timesLocked: false });
    setSelectedStudent(null);
  };

  const handleGoBack = async () => {
    if (!parsedFiles.length || !originalConfig) return;
    setIsAnalyzing(true);
    setSelectedStudent(null);
    setConfig({ ...originalConfig });
    await new Promise(r => setTimeout(r, 50));
    try {
      const results = analyzeAttendance(parsedFiles, originalConfig);
      setResults(results, parsedFiles.length, parsedFiles.map(f => f.filename));
      commitConfig();
      toast.success('Restored original analysis');
    } catch (err) {
      toast.error('Analysis failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = (filename) => {
    setParsedFiles(prev => prev.filter(f => f.filename !== filename));
    if (parsedFiles.length <= 1) { clearResults(); setConfig({ timesLocked: false }); }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(prev => prev?.name === student.name ? null : student);
  };

  const filteredStudents = students
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || (s.id || '').includes(search))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'absent') return b.absent - a.absent;
      if (sortBy === 'role') return (a.role || '').localeCompare(b.role || '');
      return b.score - a.score;
    });

  const totalNormal = students.reduce((s, x) => s + x.normal, 0);
  const totalLate   = students.reduce((s, x) => s + x.late, 0);
  const totalAbsent = students.reduce((s, x) => s + x.absent, 0);
  const pieData = [
    { name: 'On-Time', value: totalNormal },
    { name: 'Late',    value: totalLate },
    { name: 'Absent',  value: totalAbsent },
  ].filter(d => d.value > 0);

  const avgScore = students.length
    ? students.reduce((s, x) => s + x.score, 0) / students.length
    : 0;

  const hasGoBack = originalConfig !== null && committedConfig !== null && students.length > 0 &&
    JSON.stringify(committedConfig) !== JSON.stringify(originalConfig);

  const hasConfigChanges = committedConfig !== null && students.length > 0 && (
    config.classStart !== committedConfig.classStart ||
    config.classEnd !== committedConfig.classEnd ||
    config.lateThreshold !== committedConfig.lateThreshold ||
    config.absentThreshold !== committedConfig.absentThreshold ||
    config.maxScore !== committedConfig.maxScore ||
    config.latePenalty !== committedConfig.latePenalty ||
    config.absentPenalty !== committedConfig.absentPenalty
  );

  const TABLE_HEADERS = ['Role', 'Name', 'ID', 'First Date', 'Last Date', 'Total Classes', 'On-Time', 'Late', 'Absent', 'Score'];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-72 border-r border-ink-800 flex flex-col bg-ink-950 overflow-y-auto flex-shrink-0">
        <div className="p-5 border-b border-ink-800">
          <h2 className="text-sm font-semibold text-ink-100 mb-0.5" style={{ fontFamily: 'Syne' }}>Configuration</h2>
          <p className="text-xs text-ink-500">Rules & scoring parameters</p>
        </div>
        <div className="p-5 flex-1">
          <ConfigPanel
            hasChanges={hasConfigChanges}
            onApply={handleAnalyze}
            onCancel={() => setConfig({ ...committedConfig })}
            hasGoBack={hasGoBack}
            onGoBack={handleGoBack}
          />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-6xl">

          {/* Upload */}
          <div>
            <h1 className="text-2xl font-bold text-ink-100 mb-1" style={{ fontFamily: 'Syne' }}>
              Upload Attendance Files
            </h1>
            <p className="text-ink-500 text-sm mb-4">Microsoft Teams Excel attendance reports (.xlsx, .xls, .csv)</p>

            <div {...getRootProps()} className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-accent bg-accent/5' : 'border-ink-700 hover:border-ink-500 hover:bg-ink-800/30'}
            `}>
              <input {...getInputProps()} />
              <Upload className={`mx-auto mb-3 ${isDragActive ? 'text-accent' : 'text-ink-600'}`} size={28} />
              <p className="text-ink-300 text-sm font-medium">
                {isDragActive ? 'Drop files here' : 'Drag & drop files, or click to browse'}
              </p>
              <p className="text-ink-600 text-xs mt-1">Supports .xlsx, .xls, .csv — multiple files OK</p>
            </div>

            {parsedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {parsedFiles.map(f => (
                  <div key={f.filename} className="flex items-center gap-3 bg-ink-800/50 rounded-lg px-3 py-2">
                    <FileSpreadsheet size={14} className="text-accent flex-shrink-0" />
                    <span className="text-sm text-ink-200 flex-1 truncate">{f.filename}</span>
                    <span className="text-xs text-ink-500">{f.records.length} rows</span>
                    <button onClick={() => removeFile(f.filename)} className="text-ink-600 hover:text-danger transition-colors ml-1">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={handleAnalyze} disabled={isAnalyzing || !parsedFiles.length}
                className="btn-primary flex items-center gap-2">
                {isAnalyzing
                  ? <div className="w-4 h-4 border-2 border-ink-700 border-t-ink-950 rounded-full animate-spin" />
                  : <Play size={14} />}
                Analyze Attendance
              </button>
              {(parsedFiles.length > 0 || students.length > 0) && (
                <button onClick={handleClear} className="btn-ghost flex items-center gap-2">
                  <RotateCcw size={14} />Clear All
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {students.length > 0 && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 animate-slide-up">
                {[
                  { label: 'Students',  value: students.length,                                      color: 'text-ink-300' },
                  { label: 'Sessions',  value: numSessions,                                          color: 'text-ink-300' },
                  { label: 'Avg Score', value: avgScore.toFixed(1),                                  color: getScoreColor(avgScore, config.maxScore) },
                  { label: 'At Risk',   value: students.filter(s => s.score < config.maxScore * 0.7).length, color: '#991b1b' },
                ].map(stat => (
                  <div key={stat.label} className="card p-4">
                    <p className="text-xs text-ink-500 mb-1" style={{ fontFamily: 'Syne' }}>{stat.label.toUpperCase()}</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Syne', color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Chart + Summary */}
              <div className="grid grid-cols-3 gap-6 animate-slide-up">
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-ink-300 mb-4" style={{ fontFamily: 'Syne' }}>
                    DISTRIBUTION
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                        dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #c8d3dc', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: '#142333' }} />
                      <Legend iconType="circle" iconSize={8}
                        formatter={(v) => <span style={{ fontSize: 12, color: '#6e8999' }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="col-span-2 grid grid-rows-3 gap-3">
                  {[
                    { label: 'On-Time',  value: totalNormal, pct: totalNormal / (totalNormal + totalLate + totalAbsent) * 100, color: '#024e78' },
                    { label: 'Late',     value: totalLate,   pct: totalLate   / (totalNormal + totalLate + totalAbsent) * 100, color: '#1e293b' },
                    { label: 'Absent',   value: totalAbsent, pct: totalAbsent / (totalNormal + totalLate + totalAbsent) * 100, color: '#5c3c14' },
                  ].map(item => (
                    <div key={item.label} className="card px-4 py-3 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-ink-400">{item.label}</span>
                          <span className="text-sm font-bold text-ink-200">{item.value}</span>
                        </div>
                        <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${item.pct || 0}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                      <span className="text-sm font-mono text-ink-500">{(item.pct || 0).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Student Table ─────────────────────────────────────────── */}
              <div className="card animate-slide-up">
                {/* Table toolbar */}
                <div className="p-4 border-b border-ink-800 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-ink-500" />
                    <span className="text-xs text-ink-500" style={{ fontFamily: 'Syne' }}>
                      {filteredStudents.length} STUDENTS
                    </span>
                  </div>
                  <input className="input flex-1 min-w-[160px] max-w-xs" placeholder="Search name or ID…"
                    value={search} onChange={e => setSearch(e.target.value)} />
                  <div className="flex items-center gap-2 ml-auto">
                    <label className="text-xs text-ink-500">Sort:</label>
                    <select className="input text-sm py-2 w-auto" value={sortBy}
                      onChange={e => setSortBy(e.target.value)}>
                      <option value="score">Score</option>
                      <option value="name">Name</option>
                      <option value="role">Role</option>
                      <option value="absent">Most Absent</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-ink-600 bg-ink-900/80">
                        {TABLE_HEADERS.map((h, i) => (
                          <th key={h}
                            className={`py-3 text-xs font-semibold text-ink-300 whitespace-nowrap ${
                              i === 0 ? 'pl-4 pr-3 text-left border-r border-ink-600' :
                              i === TABLE_HEADERS.length - 1 ? 'pl-3 pr-4 text-right' :
                              i <= 4 ? 'px-3 text-left border-r border-ink-600' : 'px-3 text-center border-r border-ink-600'
                            }`}
                            style={{ fontFamily: 'Syne', letterSpacing: '0.05em' }}>
                            {h.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(s => (
                        <StudentRow
                          key={s.name}
                          student={s}
                          maxScore={config.maxScore}
                          isSelected={selectedStudent?.name === s.name}
                          onSelect={handleSelectStudent}
                        />
                      ))}
                    </tbody>
                  </table>
                  {filteredStudents.length === 0 && (
                    <div className="py-12 text-center text-ink-600 text-sm">No students match your search</div>
                  )}
                </div>

                {selectedStudent && (
                  <div className="p-3 border-t border-ink-800 text-xs text-ink-600 text-center">
                    Click a row to view individual detail · click the selected row again to deselect
                  </div>
                )}
              </div>

              {/* ── Individual Section ────────────────────────────────────── */}
              {selectedStudent && (
                <IndividualSection
                  student={selectedStudent}
                  maxScore={config.maxScore}
                  onClose={() => setSelectedStudent(null)}
                />
              )}

              {/* Export */}
              <div className="card p-5 animate-slide-up">
                <h3 className="text-sm font-semibold text-ink-300 mb-4" style={{ fontFamily: 'Syne' }}>EXPORT REPORT</h3>
                <div className="flex gap-3">
                  <button onClick={() => exportCSV(students)} className="btn-ghost flex items-center gap-2">
                    <Download size={14} />CSV
                  </button>
                  <button onClick={() => exportTXT(students, config)} className="btn-ghost flex items-center gap-2">
                    <FileText size={14} />TXT
                  </button>
                  <button onClick={() => exportPDF(students, config)} className="btn-ghost flex items-center gap-2">
                    <FileType size={14} />PDF
                  </button>
                </div>
              </div>
            </>
          )}

          {students.length === 0 && parsedFiles.length === 0 && (
            <div className="text-center py-20 text-ink-700">
              <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium" style={{ fontFamily: 'Syne' }}>No data yet</p>
              <p className="text-sm mt-1">Upload Excel files to get started</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
