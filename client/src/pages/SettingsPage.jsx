import { useState, useRef } from 'react';
import {
  Settings, Download, User, RotateCcw,
  Save, Mail, CheckCircle, AlertTriangle, ChevronRight, Palette, Crown, Clock, Calendar,
  Bookmark, Zap, Database, Trash2, Plus, Eye, EyeOff, RefreshCw,
  HardDrive, FileJson, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore, FACTORY_DEFAULTS, ACCENT_PRESETS, FONT_PRESETS, BUILTIN_PRESETS } from '../store/settingsStore';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatRelativeTime(isoStr) {
  if (!isoStr) return null;
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(isoStr).toLocaleDateString();
}

function formatDate(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-ink-800 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={15} className="text-accent" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink-100" style={{ fontFamily: 'Syne' }}>{title}</h2>
          <p className="text-xs text-ink-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Row inside a section ──────────────────────────────────────────────────────
function SettingField({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-ink-800/60 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-ink-200">{label}</p>
        {hint && <p className="text-xs text-ink-600 mt-0.5">{hint}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Appearance ────────────────────────────────────────────────────────────────
function AppearanceSection() {
  const { accentPreset, setAccentPreset, bodyFont, setBodyFont } = useSettingsStore();

  const handleAccent = (key) => {
    setAccentPreset(key);
    const preset = ACCENT_PRESETS[key];
    const root = document.documentElement;
    root.style.setProperty('--accent',       preset.rgb);
    root.style.setProperty('--accent-hover', preset.hover);
    root.style.setProperty('--accent-dark',  preset.dark);
    toast.success(`Accent: ${preset.label}`);
  };

  const handleFont = (font) => {
    setBodyFont(font);
    const preset = FONT_PRESETS.find(f => f.value === font);
    if (preset?.google) {
      const id = 'dynamic-google-font';
      let link = document.getElementById(id);
      if (!link) {
        link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
    }
    document.documentElement.style.setProperty('--font-body', `'${font}'`);
    toast.success(`Font: ${font}`);
  };

  return (
    <Section
      icon={Palette}
      title="Appearance"
      description="Personalize the app's accent color and body font"
    >
      {/* Accent color */}
      <p className="text-xs text-ink-500 uppercase tracking-wider mb-3" style={{ fontFamily: 'Syne' }}>
        Accent Color
      </p>
      <div className="flex gap-2.5 flex-wrap mb-6">
        {Object.entries(ACCENT_PRESETS).map(([key, preset]) => {
          const active = accentPreset === key;
          return (
            <button
              key={key}
              onClick={() => handleAccent(key)}
              title={preset.label}
              className={`group relative flex flex-col items-center gap-1.5 transition-all`}
            >
              <span
                className={`w-8 h-8 rounded-full block transition-all ring-offset-2 ring-offset-ink-900 ${
                  active ? 'ring-2 scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: preset.hex,
                  ringColor: preset.hex,
                  boxShadow: active ? `0 0 0 2px #fffffe, 0 0 0 4px ${preset.hex}` : undefined,
                }}
              />
              <span className={`text-[10px] ${active ? 'text-ink-200' : 'text-ink-600 group-hover:text-ink-400'} transition-colors`}>
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Font */}
      <p className="text-xs text-ink-500 uppercase tracking-wider mb-3" style={{ fontFamily: 'Syne' }}>
        Body Font
      </p>
      <div className="grid grid-cols-1 gap-2">
        {FONT_PRESETS.map((f) => {
          const active = bodyFont === f.value;
          return (
            <button
              key={f.value}
              onClick={() => handleFont(f.value)}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-left ${
                active
                  ? 'border-accent bg-accent/10'
                  : 'border-ink-700 hover:border-ink-500 hover:bg-ink-800/40'
              }`}
            >
              <span
                className={`text-sm ${active ? 'text-ink-100 font-semibold' : 'text-ink-400'}`}
                style={{ fontFamily: `'${f.value}', sans-serif` }}
              >
                {f.label}
              </span>
              <span className={`text-xs ${active ? 'text-accent' : 'text-ink-600'}`}>
                {active ? '✓ Active' : f.google ? 'Google Fonts' : 'Built-in'}
              </span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

// ── Default Config ────────────────────────────────────────────────────────────
function DefaultConfigSection() {
  const { defaultConfig, updateDefaultConfig } = useSettingsStore();
  const [local, setLocal] = useState({ ...defaultConfig });
  const [dirty, setDirty] = useState(false);

  const update = (key, val) => {
    setLocal((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const handleSave = () => {
    updateDefaultConfig(local);
    setDirty(false);
    toast.success('Default configuration saved');
  };

  const handleReset = () => {
    const d = FACTORY_DEFAULTS.defaultConfig;
    setLocal({ ...d });
    updateDefaultConfig(d);
    setDirty(false);
    toast.success('Restored factory defaults');
  };

  return (
    <Section
      icon={Sliders}
      title="Default Analysis Configuration"
      description="These values load when you open the Dashboard or press Reset"
    >
      <SettingField label="Class Start" hint="Default class start time">
        <input type="time" className="input text-sm w-32" value={local.classStart}
          onChange={(e) => update('classStart', e.target.value)} />
      </SettingField>
      <SettingField label="Class End" hint="Default class end time">
        <input type="time" className="input text-sm w-32" value={local.classEnd}
          onChange={(e) => update('classEnd', e.target.value)} />
      </SettingField>
      <SettingField label="Late After (min)" hint="Minutes after class start to be considered late">
        <input type="number" className="input text-sm w-24" min={0} max={60} value={local.lateThreshold}
          onChange={(e) => update('lateThreshold', +e.target.value)} />
      </SettingField>
      <SettingField label="Absent After (min)" hint="Minutes after class start to be marked absent">
        <input type="number" className="input text-sm w-24" min={0} max={240} value={local.absentThreshold}
          onChange={(e) => update('absentThreshold', +e.target.value)} />
      </SettingField>
      <SettingField label="Max Score" hint="Full marks available per student">
        <input type="number" className="input text-sm w-24" min={0} value={local.maxScore}
          onChange={(e) => update('maxScore', +e.target.value)} />
      </SettingField>
      <SettingField label="Late Penalty" hint="Points deducted per late attendance">
        <input type="number" className="input text-sm w-24" min={0} step={0.5} value={local.latePenalty}
          onChange={(e) => update('latePenalty', +e.target.value)} />
      </SettingField>
      <SettingField label="Absent Penalty" hint="Points deducted per absence">
        <input type="number" className="input text-sm w-24" min={0} step={0.5} value={local.absentPenalty}
          onChange={(e) => update('absentPenalty', +e.target.value)} />
      </SettingField>

      <div className="flex items-center gap-3 pt-4">
        <button onClick={handleSave} disabled={!dirty}
          className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          <Save size={13} />Save Defaults
        </button>
        <button onClick={handleReset}
          className="text-xs text-ink-500 border border-ink-700 rounded px-3 py-1.5 flex items-center gap-1.5 hover:border-ink-500 hover:text-ink-300 transition-all">
          <RotateCcw size={12} />Factory Reset
        </button>
      </div>
    </Section>
  );
}

// ── Account ───────────────────────────────────────────────────────────────────
function AccountSection() {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setSending(true);
    try {
      await authApi.forgot(user.email);
      setSent(true);
      toast.success('Password reset email sent — check your inbox');
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setSending(false);
    }
  };

  return (
    <Section icon={User} title="Account" description="Your account information and security settings">

      {/* Profile card — mirrors the old Navbar user info */}
      <div className={`flex items-center gap-4 p-4 rounded-xl mb-5 border ${
        isAdmin ? 'bg-amber-500/5 border-amber-500/20' : 'bg-ink-900/60 border-ink-700'
      }`}>
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
          isAdmin ? 'bg-amber-500/20 ring-2 ring-amber-500/40' : 'bg-ink-800 ring-1 ring-ink-700'
        }`}>
          {isAdmin
            ? <Crown size={20} className="text-amber-400" />
            : <User size={20} className="text-ink-400" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-ink-100 truncate">{user?.email}</p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Crown size={9} /> Admin
              </span>
            )}
            {user?.verified && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle size={9} /> Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            {user?.lastLogin ? (
              <span className="flex items-center gap-1 text-[11px] text-ink-500">
                <Clock size={10} /> Last login: {formatRelativeTime(user.lastLogin)}
              </span>
            ) : (
              <span className="text-[11px] text-ink-600">First login</span>
            )}
            {user?.createdAt && (
              <span className="flex items-center gap-1 text-[11px] text-ink-600">
                <Calendar size={10} /> Joined: {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fields */}
      <SettingField label="Email">
        <span className="text-sm font-mono text-ink-300">{user?.email || '—'}</span>
      </SettingField>
      <SettingField label="Role">
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
          isAdmin
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            : 'bg-ink-800 text-ink-400 border border-ink-700'
        }`}>
          {isAdmin ? 'Admin' : 'User'}
        </span>
      </SettingField>
      <SettingField label="Email Verified">
        <span className={`flex items-center gap-1.5 text-xs ${user?.verified ? 'text-emerald-400' : 'text-amber-400'}`}>
          {user?.verified
            ? <><CheckCircle size={13} /> Verified</>
            : <><AlertTriangle size={13} /> Not verified</>}
        </span>
      </SettingField>
      <SettingField label="Account Created">
        <span className="text-xs text-ink-400">{formatDate(user?.createdAt)}</span>
      </SettingField>
      <SettingField label="Last Login">
        <span className="text-xs text-ink-400">{formatDate(user?.lastLogin)}</span>
      </SettingField>

      {/* Security */}
      <div className="pt-4">
        <p className="text-xs text-ink-500 mb-3">Password & Security</p>
        <button onClick={handlePasswordReset} disabled={sending || sent}
          className="flex items-center gap-2 text-sm text-ink-300 border border-ink-700 rounded-lg px-4 py-2 hover:border-accent hover:text-accent hover:bg-accent/5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {sent ? <CheckCircle size={14} className="text-emerald-400" /> : <Mail size={14} />}
          {sent ? 'Reset email sent' : sending ? 'Sending…' : 'Send Password Reset Email'}
        </button>
        <p className="text-xs text-ink-600 mt-2">A reset link will be sent to your registered email</p>
      </div>
    </Section>
  );
}

// ── Scoring Presets ───────────────────────────────────────────────────────────
function PresetsSection() {
  const { customPresets, savePreset, deletePreset, renamePreset } = useSettingsStore();
  const { config, setConfig } = useAppStore();
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const allPresets = [...BUILTIN_PRESETS, ...customPresets];

  const handleLoad = (preset) => {
    const { id, name, isBuiltIn, ...cfg } = preset;
    setConfig({ ...cfg, timesLocked: false });
    toast.success(`Loaded "${name}" — go to Dashboard and click Analyze`);
  };

  const handleSave = () => {
    if (!newName.trim()) { toast.error('Enter a preset name'); return; }
    setSaving(true);
    savePreset(newName.trim(), {
      classStart: config.classStart, classEnd: config.classEnd,
      lateThreshold: config.lateThreshold, absentThreshold: config.absentThreshold,
      maxScore: config.maxScore, latePenalty: config.latePenalty, absentPenalty: config.absentPenalty,
    });
    toast.success(`Preset "${newName.trim()}" saved`);
    setNewName('');
    setSaving(false);
  };

  const handleRename = (id) => {
    if (!renameVal.trim()) return;
    renamePreset(id, renameVal.trim());
    toast.success('Preset renamed');
    setRenamingId(null);
    setRenameVal('');
  };

  return (
    <Section icon={Bookmark} title="Scoring Presets"
      description="Save and load named scoring configurations for different class types">

      <div className="space-y-2 mb-5">
        {allPresets.map((preset) => (
          <div key={preset.id} className="flex items-center gap-2 p-3 rounded-lg border border-ink-700 bg-ink-900/40">
            <div className="flex-1 min-w-0">
              {renamingId === preset.id ? (
                <input autoFocus className="input text-sm py-1 w-full"
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleRename(preset.id); if (e.key === 'Escape') setRenamingId(null); }}
                />
              ) : (
                <>
                  <p className="text-sm font-medium text-ink-200">{preset.name}
                    {preset.isBuiltIn && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-ink-800 text-ink-500">Built-in</span>}
                  </p>
                  <p className="text-xs text-ink-600 mt-0.5">
                    {preset.classStart}–{preset.classEnd} · Late +{preset.lateThreshold}m · Max {preset.maxScore} pts · −{preset.latePenalty}/{preset.absentPenalty}
                  </p>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => handleLoad(preset)}
                className="text-xs px-2.5 py-1 rounded border border-ink-700 text-ink-400 hover:border-accent hover:text-accent transition-all">
                Load
              </button>
              {!preset.isBuiltIn && renamingId !== preset.id && (
                <button onClick={() => { setRenamingId(preset.id); setRenameVal(preset.name); }}
                  className="text-xs px-2 py-1 rounded border border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-300 transition-all">
                  Rename
                </button>
              )}
              {renamingId === preset.id && (
                <button onClick={() => handleRename(preset.id)}
                  className="text-xs px-2.5 py-1 rounded border border-accent text-accent hover:bg-accent/10 transition-all">
                  Save
                </button>
              )}
              {!preset.isBuiltIn && (
                <button onClick={() => { deletePreset(preset.id); toast.success('Preset deleted'); }}
                  className="p-1.5 rounded text-ink-600 hover:text-danger hover:bg-danger/10 transition-all">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-800 pt-4">
        <p className="text-xs text-ink-500 mb-2">Save current Dashboard config as preset</p>
        <div className="flex gap-2">
          <input className="input text-sm flex-1" placeholder="Preset name…"
            value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()} />
          <button onClick={handleSave} disabled={saving || !newName.trim()}
            className="btn-primary flex items-center gap-1.5 px-3 disabled:opacity-40">
            <Plus size={13} />Save
          </button>
        </div>
        <p className="text-xs text-ink-600 mt-1.5">Current: {config.maxScore} pts · Late −{config.latePenalty} · Absent −{config.absentPenalty}</p>
      </div>
    </Section>
  );
}

// ── Table Settings ────────────────────────────────────────────────────────────
const COLUMN_LABELS = {
  role: 'Role', name: 'Name', id: 'Student ID',
  firstDate: 'First Date', lastDate: 'Last Date',
  totalClasses: 'Total Classes', onTime: 'On-Time', late: 'Late',
  absent: 'Absent', grade: 'Grade', score: 'Score',
};

function TableSection() {
  const {
    visibleColumns, toggleColumn, resetColumns,
    gradeThresholds, updateGradeThreshold, updateGradeColor, resetGradeThresholds,
    highScoreThreshold, midScoreThreshold, setHighScoreThreshold, setMidScoreThreshold,
    atRiskThreshold, setAtRiskThreshold,
  } = useSettingsStore();

  return (
    <div className="space-y-5">
      {/* Column visibility */}
      <Section icon={Table2} title="Column Visibility"
        description="Toggle which columns appear in the student results table">
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {Object.entries(COLUMN_LABELS).map(([id, label]) => {
            const visible = visibleColumns[id] !== false;
            return (
              <button key={id} onClick={() => toggleColumn(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left ${
                  visible ? 'border-accent bg-accent/10 text-ink-100' : 'border-ink-700 text-ink-500 hover:border-ink-500'
                }`}>
                {visible ? <Eye size={13} className="text-accent flex-shrink-0" /> : <EyeOff size={13} className="flex-shrink-0" />}
                {label}
              </button>
            );
          })}
        </div>
        <button onClick={() => { resetColumns(); toast.success('Columns reset'); }}
          className="text-xs text-ink-500 flex items-center gap-1.5 hover:text-ink-300 transition-colors">
          <RotateCcw size={11} />Reset to defaults
        </button>
      </Section>

      {/* Grade thresholds */}
      <Section icon={Tag} title="Grade Thresholds"
        description="Configure the minimum score percentage for each letter grade">
        <div className="space-y-2 mb-4">
          {gradeThresholds.map((t) => (
            <div key={t.grade} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: t.color }}>{t.grade}</span>
              <span className="text-sm text-ink-300 w-4">{t.grade}</span>
              <div className="flex items-center gap-1.5 flex-1">
                <input type="number" min={0} max={100}
                  className="input text-sm w-20 py-1.5"
                  value={t.min}
                  onChange={e => updateGradeThreshold(t.grade, e.target.value)} />
                <span className="text-xs text-ink-500">% and above</span>
              </div>
              <input type="color" value={t.color}
                onChange={e => updateGradeColor(t.grade, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-ink-700 bg-ink-900 p-0.5" />
            </div>
          ))}
        </div>
        <button onClick={() => { resetGradeThresholds(); toast.success('Grade thresholds reset'); }}
          className="text-xs text-ink-500 flex items-center gap-1.5 hover:text-ink-300 transition-colors">
          <RotateCcw size={11} />Reset to defaults
        </button>
      </Section>

      {/* Score color thresholds */}
      <Section icon={Sliders} title="Score Color Thresholds"
        description="Percentage cutoffs that determine score badge color in the table">
        <SettingField label="High Score (blue)" hint={`≥ ${highScoreThreshold}% shown in blue`}>
          <div className="flex items-center gap-2">
            <input type="range" min={50} max={100} step={5}
              value={highScoreThreshold}
              onChange={e => { setHighScoreThreshold(+e.target.value); }}
              className="w-28 accent-[#1565c0]" />
            <span className="text-sm font-mono text-ink-300 w-10 text-right">{highScoreThreshold}%</span>
          </div>
        </SettingField>
        <SettingField label="Mid Score (amber)" hint={`≥ ${midScoreThreshold}% shown in amber`}>
          <div className="flex items-center gap-2">
            <input type="range" min={30} max={90} step={5}
              value={midScoreThreshold}
              onChange={e => { setMidScoreThreshold(+e.target.value); }}
              className="w-28 accent-[#7c4900]" />
            <span className="text-sm font-mono text-ink-300 w-10 text-right">{midScoreThreshold}%</span>
          </div>
        </SettingField>
        <SettingField label="At-Risk Threshold" hint="Students below this % flagged as at-risk">
          <div className="flex items-center gap-2">
            <input type="range" min={30} max={95} step={5}
              value={atRiskThreshold}
              onChange={e => { setAtRiskThreshold(+e.target.value); }}
              className="w-28" />
            <span className="text-sm font-mono text-ink-300 w-10 text-right">{atRiskThreshold}%</span>
          </div>
        </SettingField>
      </Section>
    </div>
  );
}

// ── Advanced ──────────────────────────────────────────────────────────────────
function AdvancedSection() {
  const {
    autoReanalyze, setAutoReanalyze,
    anonymizeExports, setAnonymizeExports,
    persistResults, setPersistResults,
    exportFormat, setExportFormat,
  } = useSettingsStore();

  const Toggle = ({ value, onChange, label, hint }) => (
    <SettingField label={label} hint={hint}>
      <button onClick={() => onChange(!value)}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-ink-900 ${
          value ? 'bg-accent shadow-lg shadow-accent/30' : 'bg-ink-700 hover:bg-ink-600'
        }`}
        title={value ? 'Enabled' : 'Disabled'}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-all duration-200 ${
          value ? 'translate-x-7' : 'translate-x-1'
        }`} />
      </button>
    </SettingField>
  );

  return (
    <Section icon={Zap} title="Advanced Behaviour"
      description="Fine-tune analysis and export behaviour">
      <Toggle
        value={autoReanalyze}
        onChange={(v) => { setAutoReanalyze(v); toast.success(v ? 'Auto-reanalyze ON' : 'Auto-reanalyze OFF'); }}
        label="Auto-Reanalyze"
        hint="Automatically re-run analysis when scoring config changes (requires files to be loaded)"
      />
      <Toggle
        value={anonymizeExports}
        onChange={(v) => { setAnonymizeExports(v); toast.success(v ? 'Exports will be anonymized' : 'Exports will show real names'); }}
        label="Anonymize Exports"
        hint="Replace student names with Student 001, 002… in CSV, TXT, and PDF exports"
      />
      <Toggle
        value={persistResults}
        onChange={(v) => { setPersistResults(v); toast.success(v ? 'Results will be saved across sessions' : 'Results cleared on page close'); }}
        label="Persist Results"
        hint="Save last analysis results to browser storage so they reappear after page refresh"
      />
      <SettingField label="Default Export Format" hint="Format pre-selected when you click export on the Dashboard">
        <select className="input text-sm w-24" value={exportFormat}
          onChange={(e) => { setExportFormat(e.target.value); toast.success(`Export format: ${e.target.value.toUpperCase()}`); }}>
          <option value="csv">CSV</option>
          <option value="txt">TXT</option>
          <option value="pdf">PDF</option>
        </select>
      </SettingField>
    </Section>
  );
}

// ── Data Management ───────────────────────────────────────────────────────────
function DataSection() {
  const { resetAll, exportSettingsJSON, importSettingsJSON } = useSettingsStore();
  const { students, clearResults } = useAppStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const importRef = useRef(null);

  const storageBytes = (() => {
    try {
      let total = 0;
      ['aa_settings', 'aa_results'].forEach(k => {
        const v = localStorage.getItem(k);
        if (v) total += new Blob([v]).size;
      });
      return total;
    } catch { return 0; }
  })();

  const handleExportSettings = () => {
    const json = exportSettingsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attendance-analyzer-settings.json';
    a.click(); URL.revokeObjectURL(url);
    toast.success('Settings exported');
  };

  const handleImportSettings = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importSettingsJSON(ev.target.result);
        toast.success('Settings imported — refresh the page to apply all changes');
      } catch {
        toast.error('Invalid settings file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Storage */}
      <Section icon={HardDrive} title="Storage Usage"
        description="Data stored in your browser's localStorage">
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-1.5 bg-ink-800 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min((storageBytes / 51200) * 100, 100)}%` }} />
          </div>
          <span className="text-xs font-mono text-ink-400 flex-shrink-0">
            {(storageBytes / 1024).toFixed(1)} KB
          </span>
        </div>
        <p className="text-xs text-ink-600">Keys: <code className="text-ink-500">aa_settings</code>, <code className="text-ink-500">aa_results</code></p>
      </Section>

      {/* Import / Export settings */}
      <Section icon={FileJson} title="Settings Backup"
        description="Export your settings as JSON or import a previously saved backup">
        <div className="flex gap-3">
          <button onClick={handleExportSettings}
            className="flex items-center gap-2 text-sm border border-ink-700 rounded-lg px-4 py-2 text-ink-300 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all">
            <Download size={14} />Export JSON
          </button>
          <button onClick={() => importRef.current?.click()}
            className="flex items-center gap-2 text-sm border border-ink-700 rounded-lg px-4 py-2 text-ink-300 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all">
            <FileJson size={14} />Import JSON
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportSettings} />
        </div>
      </Section>

      {/* Danger zone */}
      <Section icon={AlertCircle} title="Danger Zone"
        description="Irreversible actions — proceed with caution">
        <div className="space-y-3">
          {/* Clear results */}
          <div className="flex items-center justify-between gap-4 py-3 border-b border-ink-800/60">
            <div>
              <p className="text-sm text-ink-200">Clear Saved Results</p>
              <p className="text-xs text-ink-600 mt-0.5">
                Remove the {students.length > 0 ? `${students.length} students'` : ''} analysis data from browser storage
              </p>
            </div>
            {confirmClear ? (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => { clearResults(); setConfirmClear(false); toast.success('Results cleared'); }}
                  className="text-xs px-3 py-1.5 rounded bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-all">
                  Confirm
                </button>
                <button onClick={() => setConfirmClear(false)} className="text-xs px-3 py-1.5 rounded border border-ink-700 text-ink-400 hover:border-ink-500 transition-all">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs text-danger border border-danger/30 rounded-lg px-3 py-1.5 hover:bg-danger/10 transition-all">
                <Trash2 size={12} />Clear
              </button>
            )}
          </div>

          {/* Factory reset */}
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm text-ink-200">Factory Reset Settings</p>
              <p className="text-xs text-ink-600 mt-0.5">Reset all preferences, presets, and appearance to defaults</p>
            </div>
            {confirmReset ? (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => { resetAll(); setConfirmReset(false); toast.success('Settings reset to factory defaults'); window.location.reload(); }}
                  className="text-xs px-3 py-1.5 rounded bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20 transition-all">
                  Confirm & Reload
                </button>
                <button onClick={() => setConfirmReset(false)} className="text-xs px-3 py-1.5 rounded border border-ink-700 text-ink-400 hover:border-ink-500 transition-all">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs text-danger border border-danger/30 rounded-lg px-3 py-1.5 hover:bg-danger/10 transition-all">
                <RefreshCw size={12} />Reset All
              </button>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette   },
    { id: 'presets',    label: 'Presets',    icon: Bookmark  },
    { id: 'advanced',   label: 'Advanced',   icon: Zap       },
    { id: 'account',    label: 'Account',    icon: User      },
    { id: 'data',       label: 'Data',       icon: Database  },
  ];

  const [activeTab, setActiveTab] = useState('appearance');

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-52 border-r border-ink-800 flex flex-col bg-ink-950 flex-shrink-0 pt-4">
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-accent" />
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider" style={{ fontFamily: 'Syne' }}>
              Settings
            </span>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 overflow-y-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`sidebar-item rounded-lg text-sm ${activeTab === id ? 'active' : ''}`}>
              <Icon size={15} />
              <span>{label}</span>
              {activeTab === id && <ChevronRight size={12} className="ml-auto text-ink-500" />}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-2xl space-y-5 pb-8">
          <div className="mb-2">
            <h1 className="text-xl font-bold text-ink-100" style={{ fontFamily: 'Syne' }}>Settings</h1>
            <p className="text-xs text-ink-500 mt-1">Preferences are saved to your browser automatically</p>
          </div>

          {activeTab === 'appearance' && <AppearanceSection />}
          {activeTab === 'presets'    && <PresetsSection />}
          {activeTab === 'advanced'   && <AdvancedSection />}
          {activeTab === 'account'    && <AccountSection />}
          {activeTab === 'data'       && <DataSection />}
        </div>
      </main>
    </div>
  );
}
