// src/components/MyActivity.jsx
// Shared "My Activity" feed — the signed-in user's OWN audit trail, read via the
// self-select RLS policy (email = auth.email()). Used by the Student, Registrar,
// and Admin portals; each sees only their own events, and the category tabs
// adapt to whatever that role actually does. A polished vertical timeline.
import { useEffect, useMemo, useState } from 'react';
import { listMyActivity } from '../lib/registrar';
import { CardSkeleton } from './Skeleton';
import {
  HiOutlineClipboardCheck, HiOutlineDocumentText, HiOutlineViewGrid, HiOutlineRefresh,
  HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlinePencilAlt, HiOutlineClock, HiOutlineSparkles,
} from 'react-icons/hi';

// category → how it looks (icon + accent tints for the timeline node and badge).
const CAT = {
  applications: { label: 'Applications', icon: HiOutlineClipboardCheck, dot: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100' },
  documents:    { label: 'Documents',    icon: HiOutlineDocumentText,   dot: 'bg-sky-500',     soft: 'bg-sky-50 text-sky-600',         ring: 'ring-sky-100' },
  sections:     { label: 'Sections',     icon: HiOutlineViewGrid,       dot: 'bg-violet-500',  soft: 'bg-violet-50 text-violet-600',   ring: 'ring-violet-100' },
  lifecycle:    { label: 'Lifecycle',    icon: HiOutlineRefresh,        dot: 'bg-indigo-500',  soft: 'bg-indigo-50 text-indigo-600',   ring: 'ring-indigo-100' },
  accounts:     { label: 'Accounts',     icon: HiOutlineUserGroup,      dot: 'bg-amber-500',   soft: 'bg-amber-50 text-amber-700',     ring: 'ring-amber-100' },
  security:     { label: 'Security',     icon: HiOutlineShieldCheck,    dot: 'bg-rose-500',    soft: 'bg-rose-50 text-rose-600',       ring: 'ring-rose-100' },
  content:      { label: 'Content',      icon: HiOutlinePencilAlt,      dot: 'bg-orange-500',  soft: 'bg-orange-50 text-orange-600',   ring: 'ring-orange-100' },
  other:        { label: 'Other',        icon: HiOutlineSparkles,       dot: 'bg-slate-400',   soft: 'bg-slate-100 text-slate-500',    ring: 'ring-slate-100' },
};

// action → friendly label + category.
const ACTION = {
  APPLY_SIGNUP:   ['Account created',        'applications'],
  APPLY_SUBMIT:   ['Application submitted',   'applications'],
  APPLY_RESUBMIT: ['Application resubmitted', 'applications'],
  ENROLL:         ['Enrolled',               'applications'],
  REJECT:         ['Application rejected',    'applications'],
  RETURN:         ['Returned for correction', 'applications'],
  REVIEW:         ['Marked under review',     'applications'],
  DOC_UPLOAD:     ['Document uploaded',       'documents'],
  DOC_VERIFY:     ['Document verified',       'documents'],
  DOC_REJECT:     ['Document rejected',       'documents'],
  SECTION_CREATE:    ['Section created',    'sections'],
  SECTION_RENAME:    ['Section renamed',    'sections'],
  SECTION_SUBMIT:    ['Section submitted',  'sections'],
  SECTION_DELETE:    ['Section deleted',    'sections'],
  SECTION_ASSIGN:    ['Students assigned',  'sections'],
  SECTION_UNASSIGN:  ['Students removed',   'sections'],
  SECTION_APPROVE:   ['Section approved',   'sections'],
  SECTION_UNAPPROVE: ['Section un-approved', 'sections'],
  COMPLETE:   ['Year completed', 'lifecycle'],
  GRADUATED:  ['Graduated',      'lifecycle'],
  WITHDRAWN:  ['Withdrawn',      'lifecycle'],
  ARCHIVED:   ['Archived',       'lifecycle'],
  REACTIVATE: ['Reactivated',    'lifecycle'],
  READMIT:    ['Re-admitted',    'lifecycle'],
  BULK_ARCHIVE: ['Records archived', 'lifecycle'],
  ACCOUNT_CREATE:    ['Account created',    'accounts'],
  ACCOUNT_DISABLE:   ['Account disabled',   'accounts'],
  ACCOUNT_ENABLE:    ['Account enabled',    'accounts'],
  ROLE_CHANGE:       ['Role changed',       'accounts'],
  HEADADMIN_PROMOTE: ['Promoted to HeadAdmin', 'accounts'],
  ACCOUNT_VERIFY:    ['Account verified',   'accounts'],
  PROFILE_RETURN:    ['Profile returned',   'accounts'],
  PASSWORD_RESET:    ['Password reset (user)', 'accounts'],
  MFA_RESET:         ['MFA removed (user)',  'accounts'],
  PASSWORD_CHANGE: ['Password changed', 'security'],
  MFA_ENABLE:      ['MFA enabled',      'security'],
  MFA_DISABLE:     ['MFA disabled',     'security'],
  MFA_FAIL:        ['MFA code failed',  'security'],
  CONTENT_EDIT:    ['Content edited',   'content'],
};
const metaFor = (action) => {
  const [label, cat] = ACTION[action] || [(action || 'Action').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()), 'other'];
  return { label, cat, ...CAT[cat] };
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const m = Math.floor(secs / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const fullDate = (iso) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');
const dayKey = (iso) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const PAGE_SIZE = 15;

export default function MyActivity({ title = 'My Activity', subtitle = "Everything you've done in the portal, newest first." }) {
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => { listMyActivity().then(setRows); }, []);
  useEffect(() => { setPage(1); }, [tab]);

  // Only offer tabs for categories that actually appear in this user's history.
  const cats = useMemo(() => {
    const present = new Set((rows || []).map((r) => metaFor(r.action).cat));
    return Object.keys(CAT).filter((c) => present.has(c));
  }, [rows]);

  const filtered = useMemo(() => (rows || []).filter((r) => tab === 'all' || metaFor(r.action).cat === tab), [rows, tab]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const shown = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  // Group the visible slice by calendar day for date dividers.
  const groups = useMemo(() => {
    const out = [];
    shown.forEach((r) => {
      const key = dayKey(r.created_at);
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(r);
      else out.push({ key, items: [r] });
    });
    return out;
  }, [shown]);

  return (
    <main className="p-6 md:p-12 max-w-[920px] w-full mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div className="flex items-center gap-4">
          <div className="w-2 h-10 bg-[#800000]" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          </div>
        </div>
        {rows && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-3 text-center">
            <p className="text-2xl font-black text-[#800000] leading-none">{rows.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total actions</p>
          </div>
        )}
      </div>

      {/* Category tabs (only those present) */}
      {rows && rows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-7">
          <Chip active={tab === 'all'} onClick={() => setTab('all')} label="All" count={rows.length} />
          {cats.map((c) => (
            <Chip key={c} active={tab === c} onClick={() => setTab(c)} label={CAT[c].label}
              count={rows.filter((r) => metaFor(r.action).cat === c).length} />
          ))}
        </div>
      )}

      {rows === null && <CardSkeleton lines={8} />}

      {rows && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <HiOutlineClock size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-semibold">No activity yet</p>
          <p className="text-slate-400 text-sm mt-1">Your actions will show up here as you use the portal.</p>
        </div>
      )}

      {rows && filtered.length > 0 && (
        <>
          <div className="space-y-8">
            {groups.map((g) => (
              <div key={g.key}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{g.key}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <ol className="relative border-l-2 border-gray-100 ml-4 space-y-5">
                  {g.items.map((r) => {
                    const m = metaFor(r.action);
                    const Icon = m.icon;
                    return (
                      <li key={r.id} className="relative pl-8">
                        <span className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full ${m.dot} ring-4 ${m.ring} flex items-center justify-center`}>
                          <Icon size={13} className="text-white" />
                        </span>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-3.5 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-3">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black tracking-wide ${m.soft}`}>{m.label}</span>
                            <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0" title={fullDate(r.created_at)}>{timeAgo(r.created_at)}</span>
                          </div>
                          {r.reason && <p className="text-[13px] text-slate-600 leading-relaxed mt-2">{r.reason}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 mt-10">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={curPage <= 1}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">← Previous</button>
              <span className="text-sm font-semibold text-slate-500">Page {curPage} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={curPage >= totalPages}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Next →</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

const Chip = ({ active, onClick, label, count }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-full text-[12px] font-bold transition-colors cursor-pointer ${active ? 'bg-[#800000] text-white' : 'bg-white border border-gray-200 text-slate-500 hover:bg-gray-50'}`}>
    {label} <span className={active ? 'opacity-80' : 'text-slate-400'}>({count})</span>
  </button>
);
