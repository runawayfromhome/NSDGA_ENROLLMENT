// Registrar → History — the signed-in staff member's own activity feed, read
// from audit_log (approvals, returns, rejections, sectioning, etc.). Login /
// logout rows are excluded in listMyActivity.
import { useEffect, useMemo, useState } from 'react';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import { listMyActivity } from '../../../lib/registrar';
import { CardSkeleton } from '../../Skeleton';
import { HiOutlineClock } from 'react-icons/hi';

// How each logged action shows: friendly label, badge colour, and category.
const ACTION_META = {
  ENROLL:            { label: 'Enrolled',           cls: 'bg-emerald-50 text-emerald-600', cat: 'applications' },
  REJECT:            { label: 'Rejected',           cls: 'bg-rose-50 text-rose-600',       cat: 'applications' },
  RETURN:            { label: 'Returned',           cls: 'bg-amber-50 text-amber-700',     cat: 'applications' },
  REVIEW:            { label: 'Under Review',       cls: 'bg-blue-50 text-blue-600',       cat: 'applications' },
  COMPLETE:          { label: 'Year Completed',     cls: 'bg-teal-50 text-teal-600',       cat: 'applications' },
  READMIT:           { label: 'Re-admitted',        cls: 'bg-indigo-50 text-indigo-600',   cat: 'applications' },
  REACTIVATE:        { label: 'Reactivated',        cls: 'bg-indigo-50 text-indigo-600',   cat: 'applications' },
  BULK_ARCHIVE:      { label: 'Archived',           cls: 'bg-slate-100 text-slate-500',    cat: 'applications' },
  WITHDRAWN:         { label: 'Withdrawn',          cls: 'bg-orange-50 text-orange-600',   cat: 'applications' },
  GRADUATED:         { label: 'Graduated',          cls: 'bg-indigo-50 text-indigo-600',   cat: 'applications' },
  SECTION_CREATE:    { label: 'Section created',    cls: 'bg-violet-50 text-violet-600',   cat: 'sections' },
  SECTION_RENAME:    { label: 'Section renamed',    cls: 'bg-violet-50 text-violet-600',   cat: 'sections' },
  SECTION_SUBMIT:    { label: 'Section submitted',  cls: 'bg-teal-50 text-teal-600',       cat: 'sections' },
  SECTION_DELETE:    { label: 'Section deleted',    cls: 'bg-rose-50 text-rose-600',       cat: 'sections' },
  SECTION_ASSIGN:    { label: 'Students assigned',  cls: 'bg-teal-50 text-teal-600',       cat: 'sections' },
  SECTION_UNASSIGN:  { label: 'Students removed',   cls: 'bg-amber-50 text-amber-700',     cat: 'sections' },
  SECTION_APPROVE:   { label: 'Section approved',   cls: 'bg-emerald-50 text-emerald-600', cat: 'sections' },
  SECTION_UNAPPROVE: { label: 'Section un-approved', cls: 'bg-amber-50 text-amber-700',    cat: 'sections' },
};
const metaFor = (action) => ACTION_META[action] || { label: (action || 'Action').replace(/_/g, ' '), cls: 'bg-slate-100 text-slate-500', cat: 'other' };

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'applications', label: 'Applications' },
  { key: 'sections', label: 'Sections' },
];
const PAGE_SIZE = 20;

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

const History = () => {
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => { listMyActivity().then(setRows); }, []);
  useEffect(() => { setPage(1); }, [tab]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => tab === 'all' || metaFor(r.action).cat === tab);
  }, [rows, tab]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const shown = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar activePage="History" />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="p-8 md:p-12 max-w-[1000px] w-full mx-auto space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">My Activity History</h1>
            <p className="text-slate-500 text-sm mt-1">Everything you've done — application reviews, enrollments, and sectioning.</p>
          </div>

          {/* tabs */}
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition ${tab === t.key ? 'bg-[#800000] text-white' : 'bg-white border border-gray-200 text-slate-500 hover:bg-gray-50'}`}>
                {t.label}
              </button>
            ))}
            <div className="ml-auto self-center text-sm font-semibold text-slate-500">{rows ? `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}` : ''}</div>
          </div>

          {rows === null && <CardSkeleton lines={6} />}
          {rows && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-slate-400">
              <HiOutlineClock size={32} className="mx-auto mb-3 opacity-50" />
              No activity yet.
            </div>
          )}

          {rows && filtered.length > 0 && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {shown.map((r) => {
                  const m = metaFor(r.action);
                  return (
                    <div key={r.id} className="flex items-start gap-4 px-6 py-4">
                      <span className={`mt-0.5 inline-flex px-3 py-1 rounded-full text-[10px] font-black tracking-wide shrink-0 ${m.cls}`}>{m.label}</span>
                      <p className="flex-1 text-sm text-slate-700 leading-relaxed">{r.reason || m.label}</p>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0" title={fullDate(r.created_at)}>{timeAgo(r.created_at)}</span>
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <button onClick={() => setPage((pg) => Math.max(1, pg - 1))} disabled={curPage <= 1}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">← Previous</button>
                  <span className="text-sm font-semibold text-slate-500">Page {curPage} of {totalPages}</span>
                  <button onClick={() => setPage((pg) => Math.min(totalPages, pg + 1))} disabled={curPage >= totalPages}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default History;
