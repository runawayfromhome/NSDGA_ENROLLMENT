// Registrar → Student Records — students across the lifecycle (enrolled /
// withdrawn / graduated / archived), searchable + filterable. Click a row to
// open the student and manage their lifecycle.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import { LuSearch } from "react-icons/lu";
import { listStudents, applicantName, APP_DISPLAY, bulkArchive, latestAppDates } from '../../../lib/registrar';
import { ALL_GRADES } from '../../../lib/grades';
import { TableSkeleton } from '../../Skeleton';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'completed', label: 'Completed' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];

const StudentRecords = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [latest, setLatest] = useState({}); // student_id -> newest app created_at
  const [q, setQ] = useState('');
  const [grade, setGrade] = useState('All Grades');
  const [status, setStatus] = useState('enrolled');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [sel, setSel] = useState({}); // { appId: true } for bulk actions
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => { listStudents().then(setRows); latestAppDates().then(setLatest); };
  useEffect(() => { load(); }, []);
  useEffect(() => { setVisible(PAGE_SIZE); setSel({}); }, [q, grade, status]);

  const grades = useMemo(() => ['All Grades', ...ALL_GRADES], []);

  const filtered = (rows || []).filter((r) => {
    // A 'completed' record that a re-enrollment has superseded is stale history —
    // hide it here (it lives in the student's profile timeline) so it can't be
    // mistaken for a leftover and bulk-archived by accident.
    if (r.status === 'completed' && latest[r.student_id] && r.created_at !== latest[r.student_id]) return false;
    if (status !== 'all' && r.status !== status) return false;
    if (grade !== 'All Grades' && (r.form?.grade || '') !== grade) return false;
    const s = (applicantName(r) + ' ' + (r.student_no || '') + ' ' + (r.form?.lrn || '')).toLowerCase();
    return s.includes(q.toLowerCase());
  });
  const shown = filtered.slice(0, visible);
  const anyFilter = q || grade !== 'All Grades' || status !== 'enrolled';

  const selIds = shown.filter((r) => sel[r.id]).map((r) => r.id);
  const allShownSelected = shown.length > 0 && selIds.length === shown.length;
  const toggleAll = () => setSel(allShownSelected ? {} : Object.fromEntries(shown.map((r) => [r.id, true])));
  const doBulkArchive = async () => {
    if (!selIds.length) return;
    if (!window.confirm(`Archive ${selIds.length} student record${selIds.length === 1 ? '' : 's'}? Login is revoked but records are kept — you can reactivate them later.`)) return;
    setBusy(true); setMsg('');
    const r = await bulkArchive(selIds);
    setBusy(false);
    if (!r.ok) return setMsg('⚠️ ' + r.error);
    setMsg(`✓ Archived ${r.count} record${r.count === 1 ? '' : 's'}.`); setSel({}); await load();
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="p-8 md:p-12 max-w-[1400px] w-full mx-auto space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Student Records</h1>
            <span className="text-sm font-bold text-slate-500">{rows ? `${filtered.length} shown` : ''}</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-end gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[#F1F3F6] p-3.5 pr-8 rounded-xl text-sm font-bold text-slate-600 border-none outline-none w-48">
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="bg-[#F1F3F6] p-3.5 pr-8 rounded-xl text-sm font-bold text-slate-600 border-none outline-none w-56">
                {grades.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[220px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Search</label>
              <div className="relative">
                <LuSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input value={q} onChange={(e) => setQ(e.target.value)} type="text" placeholder="Search by name, Student No., or LRN…"
                  className="w-full bg-[#F1F3F6] border-none rounded-xl py-3.5 pl-14 pr-6 text-sm font-medium outline-none" />
              </div>
            </div>
          </div>

          {msg && <div className={`rounded-xl px-5 py-3 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}

          {selIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#800000]/5 border border-[#800000]/20 rounded-2xl px-5 py-4">
              <span className="text-sm font-bold text-[#800000]">{selIds.length} selected</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setSel({})} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100">Clear</button>
                <button disabled={busy} onClick={doBulkArchive} className="px-5 py-2 rounded-lg text-sm font-bold bg-slate-700 hover:bg-slate-800 text-white disabled:opacity-60">{busy ? 'Archiving…' : `Archive ${selIds.length} selected`}</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#FAF8F6]">
                    <th className="py-4 pl-6 pr-2 w-10"><input type="checkbox" checked={allShownSelected} onChange={toggleAll} className="accent-[#800000] w-4 h-4 align-middle" title="Select all shown" /></th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student No.</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">LRN</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade / Program</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows === null && <TableSkeleton rows={8} cols={6} />}
                  {rows && filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">No students{anyFilter ? ' match your filters' : ' yet'}.</td></tr>}
                  {shown.map((r) => {
                    const st = APP_DISPLAY[r.status] || APP_DISPLAY.enrolled;
                    return (
                      <tr key={r.id} onClick={() => navigate('/RegistrarPortal/Student/' + r.student_id)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                        <td className="py-5 pl-6 pr-2 w-10" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={!!sel[r.id]} onChange={(e) => setSel({ ...sel, [r.id]: e.target.checked })} className="accent-[#800000] w-4 h-4 align-middle" /></td>
                        <td className="py-5 px-6 text-sm font-bold text-[#800000]">{r.student_no || '—'}</td>
                        <td className="py-5 px-6 text-sm font-bold text-slate-700">{applicantName(r)}</td>
                        <td className="py-5 px-6 text-sm text-slate-500">{r.form?.lrn || '—'}</td>
                        <td className="py-5 px-6 text-sm text-slate-700">{r.form?.grade || r.grade_level}{r.form?.strand ? ` · ${r.form.strand}` : ''}</td>
                        <td className="py-5 px-6 text-right"><span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black ${st.bg} ${st.text}`}>{st.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {rows && filtered.length === 0 && <p className="py-8 text-center text-slate-400 text-sm">No students{anyFilter ? ' match your filters' : ' yet'}.</p>}
              {shown.map((r) => {
                const st = APP_DISPLAY[r.status] || APP_DISPLAY.enrolled;
                return (
                  <div key={r.id} onClick={() => navigate('/RegistrarPortal/Student/' + r.student_id)} className="p-4 active:bg-slate-50 cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <input type="checkbox" checked={!!sel[r.id]} onClick={(e) => e.stopPropagation()} onChange={(e) => setSel({ ...sel, [r.id]: e.target.checked })} className="accent-[#800000] w-4 h-4 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{applicantName(r)}</p>
                          <p className="text-[12px] font-bold text-[#800000]">{r.student_no || '—'}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 inline-flex px-3 py-1.5 rounded-full text-[9px] font-black ${st.bg} ${st.text}`}>{st.label}</span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1.5">{r.form?.grade || r.grade_level}{r.form?.strand ? ` · ${r.form.strand}` : ''}{r.form?.lrn ? ` · LRN ${r.form.lrn}` : ''}</p>
                  </div>
                );
              })}
            </div>
            {rows && filtered.length > 0 && (
              <div className="flex items-center justify-between px-6 py-5 border-t border-gray-50">
                <span className="text-xs font-semibold text-slate-400">Showing {shown.length} of {filtered.length}</span>
                {visible < filtered.length && (
                  <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="px-6 py-2.5 bg-[#800000] text-white rounded-lg font-bold text-sm hover:bg-[#600000] cursor-pointer">Load More</button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentRecords;
