import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import ApplicationCard from '../../icons/RegistrarIcons/ApplicationCard';
import { IoSearchOutline } from "react-icons/io5";
import { HiOutlineCalendar } from "react-icons/hi";
import { listApplications, applicantName, APP_DISPLAY } from '../../../lib/registrar';
import { GRADES_BY_LEVEL } from '../../../lib/grades';
import { TableSkeleton } from '../../Skeleton';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending (all)' },
  { value: 'needs_correction', label: 'Needs Correction' },
  { value: 'resubmitted', label: 'Resubmitted (re-review)' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'rejected', label: 'Rejected' },
];
const LEVELS = ['Elementary', 'Junior High School', 'Senior High School'];
const selCls = 'bg-[#F1F3F6] rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 border-none outline-none';
const PAGE_SIZE = 10;

const Applications = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [apps, setApps] = useState(null);
  // Seed every filter from the URL so a Dashboard card link, a bookmark, or the
  // browser Back button all restore the exact same filtered view.
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [grade, setGrade] = useState(searchParams.get('grade') || 'all');
  const [gradeNum, setGradeNum] = useState(searchParams.get('g') || 'all'); // specific grade within a level
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => { listApplications().then(setApps); }, []);
  // Keep the URL in sync with the filters (replace, so Back returns to the list
  // in its filtered state instead of piling up history entries).
  useEffect(() => {
    const p = {};
    if (q) p.q = q;
    if (status !== 'all') p.status = status;
    if (grade !== 'all') p.grade = grade;
    if (gradeNum !== 'all') p.g = gradeNum;
    if (dateFrom) p.from = dateFrom;
    if (dateTo) p.to = dateTo;
    setSearchParams(p, { replace: true });
  }, [q, status, grade, gradeNum, dateFrom, dateTo, setSearchParams]);
  // Reset how many rows are shown whenever the filters change.
  useEffect(() => { setVisible(PAGE_SIZE); }, [q, status, grade, gradeNum, dateFrom, dateTo]);

  // Changing the level resets the specific-grade sub-filter.
  const onLevel = (v) => { setGrade(v); setGradeNum('all'); };
  const anyFilter = q || status !== 'all' || grade !== 'all' || gradeNum !== 'all' || dateFrom || dateTo;
  const clear = () => { setQ(''); setStatus('all'); setGrade('all'); setGradeNum('all'); setDateFrom(''); setDateTo(''); };

  const filtered = (apps || []).filter((a) => {
    const s = (applicantName(a) + ' ' + a.id + ' ' + (a.grade_level || '')).toLowerCase();
    if (!s.includes(q.toLowerCase())) return false;
    if (status === 'pending') {
      if (!['submitted', 'under_review', 'needs_correction'].includes(a.status)) return false;
    } else if (status === 'resubmitted') {
      if (!(a.status === 'submitted' && a.form?.resubmitted)) return false;
    } else if (status !== 'all' && a.status !== status) return false;
    if (grade !== 'all' && a.grade_level !== grade) return false;
    if (gradeNum !== 'all' && a.form?.grade !== gradeNum) return false;
    if (dateFrom || dateTo) {
      // Compare using the LOCAL date (matches the "Date Submitted" column).
      const d = a.created_at ? new Date(a.created_at).toLocaleDateString('en-CA') : '';
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
    }
    return true;
  });
  const shown = filtered.slice(0, visible);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="p-8 md:p-12 max-w-[1400px]">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#800000] mb-1">Student Applications</h1>
            <p className="text-slate-500 text-[14px]">Manage and review incoming admissions for Academic Year 2026-2027.</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 mb-6 space-y-4">
            <div className="relative">
              <IoSearchOutline className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by student name, grade, or application ID..."
                className="w-full pl-14 pr-6 py-3.5 bg-[#F1F3F6] border-none rounded-xl text-[14px] outline-none"
              />
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={selCls}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Grade Level">
                <select value={grade} onChange={(e) => onLevel(e.target.value)} className={selCls}>
                  <option value="all">All Levels</option>
                  {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              {grade !== 'all' && (
                <Field label="Grade">
                  <select value={gradeNum} onChange={(e) => setGradeNum(e.target.value)} className={selCls}>
                    <option value="all">All Grades</option>
                    {(GRADES_BY_LEVEL[grade] || []).map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
              )}
              <Field label="From">
                <div className="flex items-center gap-2 bg-[#F1F3F6] rounded-xl px-3 py-2.5">
                  <HiOutlineCalendar className="text-slate-400 shrink-0" size={16} />
                  <input type="date" value={dateFrom} max={dateTo || undefined}
                    onChange={(e) => setDateFrom(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()}
                    className="dateip" aria-label="From date" />
                </div>
              </Field>
              <Field label="To">
                <div className="flex items-center gap-2 bg-[#F1F3F6] rounded-xl px-3 py-2.5">
                  <HiOutlineCalendar className="text-slate-400 shrink-0" size={16} />
                  <input type="date" value={dateTo} min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()}
                    className="dateip" aria-label="To date" />
                </div>
              </Field>
              {anyFilter && <button onClick={clear} className="px-4 py-2.5 text-[#800000] font-bold text-sm hover:bg-[#800000]/5 rounded-lg cursor-pointer">Clear filters</button>}
              <div className="ml-auto self-center text-sm font-semibold text-slate-500">{apps ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}` : ''}</div>
            </div>
          </div>

          <ApplicationCard>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                    <th className="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Application ID No.</th>
                    <th className="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="pb-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {apps === null && <TableSkeleton rows={8} cols={4} />}
                  {apps && filtered.length === 0 && (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No applications{anyFilter ? ' match your filters' : ' yet'}.</td></tr>
                  )}
                  {shown.map((a) => (
                    <AppTableRow
                      key={a.id}
                      name={applicantName(a).toUpperCase()}
                      id={a.id.slice(0, 8).toUpperCase()}
                      grade={a.grade_level}
                      status={a.status}
                      resubmitted={!!a.form?.resubmitted && a.status === 'submitted'}
                      date={fmtDate(a.created_at)}
                      onClick={() => navigate('/RegistrarPortal/Applications/' + a.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {apps && filtered.length === 0 && <p className="py-8 text-center text-slate-400 text-sm">No applications{anyFilter ? ' match your filters' : ' yet'}.</p>}
              {shown.map((a) => {
                const style = APP_DISPLAY[a.status] || APP_DISPLAY.submitted;
                return (
                  <div key={a.id} onClick={() => navigate('/RegistrarPortal/Applications/' + a.id)} className="border border-gray-100 rounded-xl p-4 cursor-pointer active:scale-[0.99] transition-transform">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-700 truncate">{applicantName(a).toUpperCase()}</p>
                        <p className="text-[11px] text-slate-400">{a.grade_level}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black tracking-tighter ${style.bg} ${style.text}`}>{style.label}</span>
                        {!!a.form?.resubmitted && a.status === 'submitted' && <span className="px-2.5 py-1 rounded-full text-[9px] font-black tracking-tighter bg-teal-50 text-teal-600">RESUBMITTED</span>}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">ID {a.id.slice(0, 8).toUpperCase()} · {fmtDate(a.created_at)}</p>
                  </div>
                );
              })}
            </div>

            {apps && filtered.length > 0 && (
              <div className="flex items-center justify-between pt-6 mt-2 border-t border-gray-50">
                <span className="text-xs font-semibold text-slate-400">Showing {shown.length} of {filtered.length}</span>
                {visible < filtered.length && (
                  <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="px-6 py-2.5 bg-[#800000] text-white rounded-lg font-bold text-sm hover:bg-[#600000] cursor-pointer">
                    Load More
                  </button>
                )}
              </div>
            )}
          </ApplicationCard>
        </main>
      </div>
      <style>{`
        .dateip { background: transparent; border: none; outline: none; font-size: 0.875rem; font-weight: 600; color: #475569; cursor: pointer; }
        .dateip::-webkit-calendar-picker-indicator { display: none; }
        .dateip:focus { color: #800000; }
      `}</style>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const AppTableRow = ({ name, id, grade, status, resubmitted, date, onClick }) => {
  const style = APP_DISPLAY[status] || APP_DISPLAY.submitted;
  return (
    <tr onClick={onClick} className="group hover:bg-gray-50 transition-colors cursor-pointer">
      <td className="py-6 text-[13px] font-bold text-slate-700 tracking-tight">{name}<span className="block text-[11px] font-medium text-slate-400">{grade}</span></td>
      <td className="py-6 text-[12px] font-medium text-slate-500">{id}</td>
      <td className="py-6">
        <span className={`px-5 py-2 rounded-full text-[9px] font-black tracking-tighter ${style.bg} ${style.text}`}>{style.label}</span>
        {resubmitted && <span className="ml-2 px-3 py-2 rounded-full text-[9px] font-black tracking-tighter bg-teal-50 text-teal-600">RESUBMITTED</span>}
      </td>
      <td className="py-6 text-[12px] font-medium text-slate-500">{date}</td>
    </tr>
  );
};

export default Applications;
