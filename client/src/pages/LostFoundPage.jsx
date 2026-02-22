import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  Search, MapPin, Plus, X, CheckCircle, AlertTriangle, Clock,
  Phone, Mail, ChevronLeft, Bell, Filter, Award,
  ShieldCheck, Trash2, Package,
  Smartphone, Shirt, ShoppingBag, Gem, Key, FileText,
  PawPrint, BookOpen, Trophy, Glasses, Gamepad2, User as UserIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLostFoundStore, CATEGORIES } from '../store/lostFoundStore';
import { useAuth } from '../hooks/useAuth';

// ── Category image & icon maps ─────────────────────────────────────────────────

const CATEGORY_IMAGES = {
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
  clothing:    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80',
  bags:        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
  jewelry:     'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80',
  keys:        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  documents:   'https://images.unsplash.com/photo-1568667256549-094345857c50?w=600&q=80',
  pets:        'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&q=80',
  books:       'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80',
  sports:      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=80',
  glasses:     'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&q=80',
  toys:        'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=600&q=80',
  other:       'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&q=80',
};

const CATEGORY_ICON_MAP = {
  electronics: Smartphone,
  clothing:    Shirt,
  bags:        ShoppingBag,
  jewelry:     Gem,
  keys:        Key,
  documents:   FileText,
  pets:        PawPrint,
  books:       BookOpen,
  sports:      Trophy,
  glasses:     Glasses,
  toys:        Gamepad2,
  other:       Package,
};

function getCategoryImage(id) { return CATEGORY_IMAGES[id]  ?? CATEGORY_IMAGES.other; }
function getCategoryIcon(id)  { return CATEGORY_ICON_MAP[id] ?? Package; }
function getCategoryLabel(id) { return CATEGORIES.find(c => c.id === id)?.label ?? 'Other'; }

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Type Badge ─────────────────────────────────────────────────────────────────

function TypeBadge({ type, status }) {
  if (status === 'resolved')
    return <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-ink-700/90 text-ink-400 backdrop-blur-sm">Resolved</span>;
  if (type === 'lost')
    return <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-danger text-white shadow-sm">Lost</span>;
  return <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500 text-white shadow-sm">Found</span>;
}

// ── Item Card (photo-based) ────────────────────────────────────────────────────

function ItemCard({ item, onClick }) {
  const imgSrc = getCategoryImage(item.category);
  const [imgErr, setImgErr] = useState(false);
  const CatIcon = getCategoryIcon(item.category);

  return (
    <div
      onClick={() => onClick(item)}
      className="card cursor-pointer hover:border-accent/50 hover:shadow-xl transition-all duration-200 group overflow-hidden flex flex-col"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-800 flex-shrink-0">
        {!imgErr ? (
          <img
            src={imgSrc}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-75"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CatIcon size={44} className="text-ink-700" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/40 to-transparent pointer-events-none" />

        {/* Reward badge — top-left */}
        {item.reward > 0 && (
          <div className="absolute top-2.5 left-2.5">
            <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 shadow-md">
              <Award size={10} />${item.reward} Reward
            </span>
          </div>
        )}

        {/* Type badge — top-right */}
        <div className="absolute top-2.5 right-2.5">
          <TypeBadge type={item.type} status={item.status} />
        </div>
      </div>

      {/* Text content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-ink-100 text-sm mb-1 line-clamp-1 group-hover:text-accent transition-colors">
          {item.title}
        </h3>
        <p className="text-xs text-ink-500 line-clamp-2 mb-3 leading-relaxed flex-1">
          {item.description}
        </p>
        <div className="flex items-center justify-between text-[11px] text-ink-600">
          <span className="flex items-center gap-1.5 min-w-0">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="truncate">{item.location}</span>
          </span>
          <span className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <Clock size={10} />{formatDate(item.date)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Item Detail Modal ──────────────────────────────────────────────────────────

function ItemDetailModal({ item, onClose, onResolve, onDelete }) {
  const [showContact, setShowContact] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const CatIcon = getCategoryIcon(item.category);

  const handleContact = () => {
    if (!contactMsg.trim()) { toast.error('Please write a message first'); return; }
    toast.success(`Message sent to ${item.contactName}! They will be notified by email.`);
    setContactMsg('');
    setShowContact(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-ink-950 border border-ink-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-ink-800 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-ink-800 border border-ink-700 flex items-center justify-center flex-shrink-0">
            <CatIcon size={24} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-base font-bold text-ink-100" style={{ fontFamily: 'Syne' }}>{item.title}</h2>
              <TypeBadge type={item.type} status={item.status} />
            </div>
            <span className="text-xs text-ink-500">{getCategoryLabel(item.category)}</span>
          </div>
          <button onClick={onClose} className="text-ink-600 hover:text-ink-300 transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <p className="text-xs text-ink-500 uppercase tracking-wider mb-1.5" style={{ fontFamily: 'Syne' }}>Description</p>
            <p className="text-sm text-ink-300 leading-relaxed">{item.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-ink-900/60 rounded-lg p-3 border border-ink-800">
              <p className="text-[10px] text-ink-600 uppercase tracking-wider mb-1">Location</p>
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-accent flex-shrink-0" />
                <span className="text-xs text-ink-200">{item.location}</span>
              </div>
            </div>
            <div className="bg-ink-900/60 rounded-lg p-3 border border-ink-800">
              <p className="text-[10px] text-ink-600 uppercase tracking-wider mb-1">Date</p>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-accent flex-shrink-0" />
                <span className="text-xs text-ink-200">{formatDate(item.date)}</span>
              </div>
            </div>
            <div className="bg-ink-900/60 rounded-lg p-3 border border-ink-800">
              <p className="text-[10px] text-ink-600 uppercase tracking-wider mb-1">Reported by</p>
              <div className="flex items-center gap-1.5">
                <Phone size={12} className="text-accent flex-shrink-0" />
                <span className="text-xs text-ink-200">{item.contactName}</span>
              </div>
            </div>
            {item.reward > 0 && (
              <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/20">
                <p className="text-[10px] text-amber-500/70 uppercase tracking-wider mb-1">Reward Offered</p>
                <div className="flex items-center gap-1.5">
                  <Award size={12} className="text-amber-400 flex-shrink-0" />
                  <span className="text-sm font-bold text-amber-400">${item.reward}</span>
                </div>
              </div>
            )}
          </div>

          {item.tags?.length > 0 && (
            <div>
              <p className="text-[10px] text-ink-500 uppercase tracking-wider mb-2" style={{ fontFamily: 'Syne' }}>Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map(t => (
                  <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-ink-800 text-ink-400 border border-ink-700">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-accent/5 rounded-lg p-3 border border-accent/20">
            <div className="flex items-start gap-2">
              <ShieldCheck size={14} className="text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-accent mb-1">Safety Tips</p>
                <ul className="text-[11px] text-ink-400 space-y-0.5">
                  <li>• Meet in a public, well-lit location</li>
                  <li>• Ask for proof of ownership before handing over valuables</li>
                  <li>• Do not share your home address</li>
                </ul>
              </div>
            </div>
          </div>

          {showContact && (
            <div className="space-y-2">
              <p className="text-xs text-ink-400">Write a message to <span className="text-ink-200">{item.contactName}</span>:</p>
              <textarea
                className="input w-full resize-none text-sm"
                rows={3}
                maxLength={300}
                placeholder="Describe how you can verify this item belongs to you, or where you found it…"
                value={contactMsg}
                onChange={e => setContactMsg(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-600">{contactMsg.length}/300</span>
                <div className="flex gap-2">
                  <button onClick={() => setShowContact(false)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                  <button onClick={handleContact} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
                    <Mail size={12} />Send Message
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-ink-800 flex items-center gap-2 flex-wrap">
          {item.status !== 'resolved' && (
            <>
              {!showContact && (
                <button onClick={() => setShowContact(true)} className="btn-primary flex items-center gap-2 text-sm">
                  <Mail size={14} />Contact Owner
                </button>
              )}
              <button
                onClick={() => { onResolve(item.id); toast.success('Marked as resolved!'); onClose(); }}
                className="flex items-center gap-2 text-sm border border-ink-700 rounded-lg px-3 py-1.5 text-ink-400 hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all"
              >
                <CheckCircle size={14} />Mark Resolved
              </button>
            </>
          )}
          <button
            onClick={() => { onDelete(item.id); toast.success('Listing removed'); onClose(); }}
            className="ml-auto flex items-center gap-1.5 text-xs text-ink-600 hover:text-danger transition-colors"
          >
            <Trash2 size={12} />Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Alerts Modal ───────────────────────────────────────────────────────────────

function AlertsModal({ onClose }) {
  const { alertEmail, alertPrefs, setAlertPrefs } = useLostFoundStore();
  const [email, setEmail] = useState(alertEmail);
  const [prefs, setPrefs] = useState({ ...alertPrefs });

  const handleSave = () => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { toast.error('Enter a valid email'); return; }
    setAlertPrefs(email, prefs);
    toast.success('Alert preferences saved! You will be notified when matching items are posted.');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-ink-950 border border-ink-700 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden">
        <div className="p-5 border-b border-ink-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-ink-100" style={{ fontFamily: 'Syne' }}>Email Alerts</h2>
          </div>
          <button onClick={onClose} className="text-ink-600 hover:text-ink-300 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-ink-500">Get notified when new items matching your criteria are posted.</p>
          <div>
            <label className="label">Your Email</label>
            <input type="email" className="input" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Alert me for category</label>
            <select className="input" value={prefs.category} onChange={e => setPrefs(p => ({ ...p, category: e.target.value }))}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Item Type</label>
            <select className="input" value={prefs.status} onChange={e => setPrefs(p => ({ ...p, status: e.target.value }))}>
              <option value="">Both Lost & Found</option>
              <option value="lost">Lost only</option>
              <option value="found">Found only</option>
            </select>
          </div>
          <div>
            <label className="label">Location keyword (optional)</label>
            <input type="text" className="input" placeholder="e.g. Library, Cafeteria…"
              value={prefs.location} onChange={e => setPrefs(p => ({ ...p, location: e.target.value }))} />
          </div>
        </div>
        <div className="p-4 border-t border-ink-800 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost text-sm px-4">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-sm">
            <Bell size={13} />Save Alerts
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Report Form ────────────────────────────────────────────────────────────────

function ReportForm({ defaultType, onBack, onSuccess, currentUser }) {
  const { addItem } = useLostFoundStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      type: defaultType,
      title: '', category: '', description: '',
      location: '', date: new Date().toISOString().split('T')[0],
      contactName: currentUser?.name ?? '',
      contactEmail: currentUser?.email ?? '',
      tags: '', reward: '',
    },
  });

  const type = watch('type');

  const onSubmit = (data) => {
    const tags = data.tags
      ? data.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      : [];
    addItem({
      type: data.type, title: data.title, description: data.description,
      category: data.category, location: data.location, date: data.date,
      contactName: data.contactName, contactEmail: data.contactEmail,
      tags, reward: data.reward ? Number(data.reward) : 0,
    });
    toast.success(`${data.type === 'lost' ? 'Lost' : 'Found'} item reported successfully!`);
    onSuccess();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-300 mb-6 transition-colors">
        <ChevronLeft size={15} />Back
      </button>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-ink-800">
          <h2 className="text-lg font-bold text-ink-100" style={{ fontFamily: 'Syne' }}>Report an Item</h2>
          <p className="text-xs text-ink-500 mt-0.5">Fill in as much detail as possible to help with identification</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* Type toggle */}
          <div>
            <label className="label">Item Status</label>
            <div className="flex rounded-lg border border-ink-700 overflow-hidden">
              {[
                { value: 'lost',  label: 'I Lost Something'  },
                { value: 'found', label: 'I Found Something' },
              ].map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setValue('type', value)}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                    type === value
                      ? value === 'lost'
                        ? 'bg-danger/10 text-danger'
                        : 'bg-emerald-500/10 text-emerald-400'
                      : 'text-ink-500 hover:bg-ink-800/50'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Title *</label>
              <input className={`input ${errors.title ? 'border-danger' : ''}`}
                placeholder="e.g. Black iPhone 14"
                {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-danger text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="label">Category *</label>
              <select className={`input ${errors.category ? 'border-danger' : ''}`}
                {...register('category', { required: 'Category is required' })}>
                <option value="">Select…</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              {errors.category && <p className="text-danger text-xs mt-1">{errors.category.message}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <textarea className={`input resize-none ${errors.description ? 'border-danger' : ''}`}
              rows={3}
              placeholder="Describe the item in detail — color, brand, distinctive marks, what was inside, etc."
              {...register('description', { required: 'Description is required', minLength: { value: 20, message: 'Please add more detail (at least 20 characters)' } })} />
            {errors.description && <p className="text-danger text-xs mt-1">{errors.description.message}</p>}
          </div>

          {/* Location + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Location *</label>
              <input className={`input ${errors.location ? 'border-danger' : ''}`}
                placeholder="e.g. Library – 2nd Floor"
                {...register('location', { required: 'Location is required' })} />
              {errors.location && <p className="text-danger text-xs mt-1">{errors.location.message}</p>}
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" className={`input ${errors.date ? 'border-danger' : ''}`}
                {...register('date', { required: 'Date is required' })} />
              {errors.date && <p className="text-danger text-xs mt-1">{errors.date.message}</p>}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Your Name *</label>
              <input className={`input ${errors.contactName ? 'border-danger' : ''}`}
                placeholder="Full name"
                {...register('contactName', { required: 'Name is required' })} />
              {errors.contactName && <p className="text-danger text-xs mt-1">{errors.contactName.message}</p>}
            </div>
            <div>
              <label className="label">Your Email *</label>
              <input type="email" className={`input ${errors.contactEmail ? 'border-danger' : ''}`}
                placeholder="you@example.com"
                {...register('contactEmail', {
                  required: 'Email is required',
                  pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                })} />
              {errors.contactEmail && <p className="text-danger text-xs mt-1">{errors.contactEmail.message}</p>}
            </div>
          </div>

          {/* Tags + Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tags</label>
              <input className="input" placeholder="apple, phone, black"
                {...register('tags')} />
              <p className="text-[11px] text-ink-600 mt-1">Comma-separated, helps people find your listing</p>
            </div>
            <div>
              <label className="label">Reward Offered ($)</label>
              <input type="number" min={0} className="input"
                placeholder="0 for no reward"
                {...register('reward')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Plus size={14} />Post Listing
            </button>
            <button type="button" onClick={onBack} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── My Listings View ───────────────────────────────────────────────────────────

function MyListingsView({ onSelectItem, currentUserEmail }) {
  const { items } = useLostFoundStore();

  const myItems = useMemo(() =>
    [...items]
      .filter(i => i.contactEmail?.toLowerCase() === currentUserEmail?.toLowerCase())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items, currentUserEmail]
  );

  if (!currentUserEmail) {
    return (
      <div className="py-20 text-center text-ink-600">
        <UserIcon size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium" style={{ fontFamily: 'Syne' }}>Not signed in</p>
      </div>
    );
  }

  if (myItems.length === 0) {
    return (
      <div className="py-20 text-center text-ink-600">
        <UserIcon size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium text-ink-400" style={{ fontFamily: 'Syne' }}>No listings yet</p>
        <p className="text-sm mt-1">Items you report will appear here</p>
        <p className="text-xs text-ink-700 mt-2">Posting as: {currentUserEmail}</p>
      </div>
    );
  }

  const active   = myItems.filter(i => i.status === 'active').length;
  const resolved = myItems.filter(i => i.status === 'resolved').length;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Posted', value: myItems.length, color: '#094067' },
          { label: 'Active',       value: active,         color: '#3da9fc' },
          { label: 'Resolved',     value: resolved,       color: '#5f6c7b' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'Syne', color: s.color }}>{s.value}</p>
            <p className="text-xs text-ink-600">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {myItems.map(item => (
          <ItemCard key={item.id} item={item} onClick={onSelectItem} />
        ))}
      </div>
    </div>
  );
}

// ── Browse View ────────────────────────────────────────────────────────────────

function BrowseView({ onSelectItem, initialCategory, initialSearch }) {
  const { items } = useLostFoundStore();
  const [search, setSearch]           = useState(initialSearch  || '');
  const [category, setCategory]       = useState(initialCategory || '');
  const [typeFilter, setTypeFilter]   = useState('all');
  const [location, setLocation]       = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [rewardOnly, setRewardOnly]   = useState(false);
  const [sortBy, setSortBy]           = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        i.contactName.toLowerCase().includes(q) ||
        i.tags?.some(t => t.includes(q))
      );
    }
    if (category) list = list.filter(i => i.category === category);
    if (typeFilter !== 'all') list = list.filter(i =>
      typeFilter === 'resolved' ? i.status === 'resolved' : i.type === typeFilter && i.status !== 'resolved'
    );
    if (location.trim()) list = list.filter(i => i.location.toLowerCase().includes(location.toLowerCase()));
    if (dateFrom) list = list.filter(i => i.date >= dateFrom);
    if (dateTo)   list = list.filter(i => i.date <= dateTo);
    if (rewardOnly) list = list.filter(i => i.reward > 0);
    if (sortBy === 'newest') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sortBy === 'oldest') list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (sortBy === 'reward') list.sort((a, b) => (b.reward || 0) - (a.reward || 0));
    return list;
  }, [items, search, category, typeFilter, location, dateFrom, dateTo, rewardOnly, sortBy]);

  const clearFilters = () => {
    setSearch(''); setCategory(''); setTypeFilter('all');
    setLocation(''); setDateFrom(''); setDateTo('');
    setRewardOnly(false); setSortBy('newest');
  };

  const hasFilters = category || typeFilter !== 'all' || location || dateFrom || dateTo || rewardOnly;

  return (
    <div>
      {/* Search + controls */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input className="input pl-9" placeholder="Search items, locations, tags…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-all ${
            showFilters || hasFilters
              ? 'border-accent text-accent bg-accent/5'
              : 'border-ink-700 text-ink-400 hover:border-ink-500 hover:text-ink-300'
          }`}>
          <Filter size={14} />{hasFilters ? 'Filters active' : 'Filters'}
        </button>
        <select className="input text-sm w-36" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="newest">Most Recent</option>
          <option value="oldest">Oldest</option>
          <option value="reward">Highest Reward</option>
        </select>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="card p-4 mb-4 grid grid-cols-2 gap-3 animate-slide-up">
          <div>
            <label className="label">Category</label>
            <select className="input text-sm" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input text-sm" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="label">Location keyword</label>
            <input className="input text-sm" placeholder="Library, Cafeteria…"
              value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="label">Date From</label>
              <input type="date" className="input text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="label">Date To</label>
              <input type="date" className="input text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="col-span-2 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="accent-accent w-4 h-4" checked={rewardOnly} onChange={e => setRewardOnly(e.target.checked)} />
              <span className="text-sm text-ink-400">Show items with reward only</span>
            </label>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-ink-500 hover:text-ink-300 flex items-center gap-1 transition-colors">
                <X size={11} />Clear all
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-ink-500">
          <span className="text-ink-200 font-semibold">{filtered.length}</span> items found
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => <ItemCard key={item.id} item={item} onClick={onSelectItem} />)}
        </div>
      ) : (
        <div className="py-16 text-center text-ink-600">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium" style={{ fontFamily: 'Syne' }}>No items match your search</p>
          <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-xs text-accent hover:text-accent-hover transition-colors">
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Home View ──────────────────────────────────────────────────────────────────

function HomeView({ onBrowse, onReport, onSelectItem }) {
  const { items } = useLostFoundStore();
  const [heroSearch, setHeroSearch] = useState('');

  const stats = useMemo(() => ({
    total:    items.length,
    lost:     items.filter(i => i.type === 'lost'  && i.status !== 'resolved').length,
    found:    items.filter(i => i.type === 'found' && i.status !== 'resolved').length,
    resolved: items.filter(i => i.status === 'resolved').length,
  }), [items]);

  const recentItems = useMemo(() =>
    [...items].filter(i => i.status === 'active')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [items]
  );

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-accent/20 bg-accent/5 p-8 text-center">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #3da9fc 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
            <Search size={11} className="text-accent" />
            <span className="text-[11px] text-accent font-semibold uppercase tracking-wider">Lost & Found Board</span>
          </div>
          <h1 className="text-2xl font-bold text-ink-100 mb-2" style={{ fontFamily: 'Syne' }}>
            Reunite Items with Their Owners
          </h1>
          <p className="text-sm text-ink-500 mb-6 max-w-md mx-auto">
            Browse lost & found listings, report missing or found items, and help bring them home.
          </p>
          <form onSubmit={e => { e.preventDefault(); onBrowse(heroSearch); }} className="flex gap-2 max-w-md mx-auto mb-6">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input className="input pl-9 w-full" placeholder="Search for a lost item…"
                value={heroSearch} onChange={e => setHeroSearch(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary px-4">Search</button>
          </form>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => onReport('lost')}
              className="flex items-center gap-2 text-sm border border-danger/40 text-danger bg-danger/5 hover:bg-danger/10 rounded-lg px-4 py-2 transition-all">
              <AlertTriangle size={14} />Report Lost Item
            </button>
            <button onClick={() => onReport('found')}
              className="flex items-center gap-2 text-sm border border-emerald-500/40 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg px-4 py-2 transition-all">
              <CheckCircle size={14} />Report Found Item
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Listings', value: stats.total,    color: '#094067' },
          { label: 'Lost Items',     value: stats.lost,     color: '#ef4565' },
          { label: 'Found Items',    value: stats.found,    color: '#3da9fc' },
          { label: 'Resolved',       value: stats.resolved, color: '#5f6c7b' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: 'Syne', color: s.color }}>{s.value}</p>
            <p className="text-xs text-ink-600">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category grid — Lucide icons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-ink-300 uppercase tracking-wider" style={{ fontFamily: 'Syne' }}>Browse by Category</h2>
          <button onClick={() => onBrowse('')} className="text-xs text-accent hover:text-accent-hover transition-colors">View all →</button>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {CATEGORIES.map(cat => {
            const CatIcon = getCategoryIcon(cat.id);
            const count = items.filter(i => i.category === cat.id && i.status === 'active').length;
            return (
              <button key={cat.id} onClick={() => onBrowse('', cat.id)}
                className="card p-3 flex flex-col items-center gap-2 hover:border-accent/50 hover:bg-ink-900/60 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-ink-800 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                  <CatIcon size={18} className="text-ink-400 group-hover:text-accent transition-colors" />
                </div>
                <span className="text-[10px] text-ink-500 group-hover:text-ink-300 transition-colors text-center leading-tight">{cat.label}</span>
                {count > 0 && <span className="text-[10px] font-semibold text-accent">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent listings */}
      {recentItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-ink-300 uppercase tracking-wider" style={{ fontFamily: 'Syne' }}>Recent Listings</h2>
            <button onClick={() => onBrowse('')} className="text-xs text-accent hover:text-accent-hover transition-colors">Browse all →</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentItems.map(item => <ItemCard key={item.id} item={item} onClick={onSelectItem} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LostFoundPage() {
  const { user } = useAuth();
  const { resolveItem, deleteItem } = useLostFoundStore();
  const [view, setView]               = useState('home');
  const [reportType, setReportType]   = useState('lost');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAlerts, setShowAlerts]   = useState(false);
  const [browseSearch, setBrowseSearch]     = useState('');
  const [browseCategory, setBrowseCategory] = useState('');

  const navTabs = [
    { id: 'home',    label: 'Home'        },
    { id: 'browse',  label: 'Browse'      },
    { id: 'profile', label: 'My Listings' },
  ];

  const handleBrowse = (search = '', category = '') => {
    setBrowseSearch(search);
    setBrowseCategory(category);
    setView('browse');
  };

  const handleReport = (type) => {
    setReportType(type);
    setView('report');
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-ink-100" style={{ fontFamily: 'Syne' }}>Lost & Found</h1>
            <p className="text-xs text-ink-500 mt-0.5">Campus lost & found board — help reunite items with their owners</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAlerts(true)}
              className="flex items-center gap-2 text-sm border border-ink-700 rounded-lg px-3 py-1.5 text-ink-400 hover:border-accent hover:text-accent hover:bg-accent/5 transition-all">
              <Bell size={14} />Alerts
            </button>
            <button onClick={() => handleReport('lost')} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} />Report Item
            </button>
          </div>
        </div>

        {/* Tab nav */}
        {view !== 'report' && (
          <div className="flex items-center gap-1 border-b border-ink-800 mb-6">
            {navTabs.map(tab => (
              <button key={tab.id} onClick={() => setView(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
                  view === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-ink-500 hover:text-ink-300'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {view === 'home' && (
          <HomeView onBrowse={handleBrowse} onReport={handleReport} onSelectItem={setSelectedItem} />
        )}
        {view === 'browse' && (
          <BrowseView
            key={`${browseSearch}|${browseCategory}`}
            onSelectItem={setSelectedItem}
            initialCategory={browseCategory}
            initialSearch={browseSearch}
          />
        )}
        {view === 'profile' && (
          <MyListingsView onSelectItem={setSelectedItem} currentUserEmail={user?.email} />
        )}
        {view === 'report' && (
          <ReportForm
            defaultType={reportType}
            onBack={() => setView('home')}
            onSuccess={() => setView('profile')}
            currentUser={user}
          />
        )}
      </div>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onResolve={(id) => { resolveItem(id); setSelectedItem(s => s?.id === id ? { ...s, status: 'resolved' } : s); }}
          onDelete={(id) => { deleteItem(id); setSelectedItem(null); }}
        />
      )}

      {showAlerts && <AlertsModal onClose={() => setShowAlerts(false)} />}
    </div>
  );
}
