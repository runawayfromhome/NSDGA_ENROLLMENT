// Registrar → Documents — real document-submission tracking across all
// applications. Shows how many required docs each applicant uploaded, what's
// missing, and links to the application to view/verify them.
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../Header';
import RegistrarSidebar from '../../RegistrarSidebar';
import { LuSearch } from "react-icons/lu";
import { listApplications, applicantName } from '../../../lib/registrar';
import { REQUIRED_DOCS } from '../../../lib/student';

const STATUS_STYLE = {
  'Complete': 'bg-emerald-50 text-emerald-600',
  'Pending Review': 'bg-blue-50 text-blue-600',
  'Incomplete': 'bg-amber-50 text-amber-700',
  'No Documents': 'bg-slate-100 text-slate-400',
};
const FILTERS = ['All', 'Complete', 'Pending Review', 'Incomplete', 'No Documents'];
const PAGE_SIZE = 10;

function summarize(app) {
  const docs = app.documents || {};
  const uploaded = REQUIRED_DOCS.filter((d) => docs[d.key]?.path).length;
  const verified = REQUIRED_DOCS.filter((d) => docs[d.key]?.status === 'verified').length;
  const missing = REQUIRED_DOCS.filter((d) => !docs[d.key]?.path).map((d) => d.label);
  let status;
  if (uploaded === 0) status = 'No Documents';
  else if (missing.length) status = 'Incomplete';
  else if (verified === REQUIRED_DOCS.length) status = 'Complete';
  else status = 'Pending Review';
  return { uploaded, verified, missing, status, total: REQUIRED_DOCS.length };
}

const Documents = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => { listApplications().then(setApps); }, []);
  useEffect(() => { setVisible(PAGE_SIZE); }, [q, filter]);

  const rows = useMemo(() => (apps || []).map((a) => ({ app: a, sum: summarize(a) })), [apps]);
  const filtered = rows.filter(({ app, sum }) => {
    if (filter !== 'All' && sum.status !== filter) return false;
    const s = (applicantName(app) + ' ' + (app.form?.lrn || '') + ' ' + app.grade_level).toLowerCase();
    return s.includes(q.toLowerCase());
  });
  const shown = filtered.slice(0, visible);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="p-8 md:p-12 max-w-[1400px] w-full mx-auto space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">Documents</h1>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-end gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Submission Status</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-[#F1F3F6] p-3.5 pr-8 rounded-xl text-sm font-bold text-slate-600 border-none outline-none w-56">
                {FILTERS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[240px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Search</label>
              <div className="relative">
                <LuSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input value={q} onChange={(e) => setQ(e.target.value)} type="text" placeholder="Search by name, LRN, or grade…"
                  className="w-full bg-[#F1F3F6] border-none rounded-xl py-3.5 pl-14 pr-6 text-sm font-medium outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#FAF8F6]">
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Documents</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Missing</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apps === null && <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">Loading…</td></tr>}
                  {apps && filtered.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-slate-400 text-sm">No applications match.</td></tr>}
                  {shown.map(({ app, sum }) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-5 px-6">
                        <div className="font-bold text-slate-700 text-sm">{applicantName(app)}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{app.form?.lrn ? `LRN: ${app.form.lrn}` : app.grade_level}</div>
                      </td>
                      <td className="py-5 px-6 text-sm font-medium text-slate-600">{app.student_type}</td>
                      <td className="py-5 px-6 text-sm font-bold text-slate-700">{sum.uploaded} / {sum.total}<span className="text-[11px] font-medium text-emerald-600 ml-2">{sum.verified} verified</span></td>
                      <td className="py-5 px-6 text-[12px] text-slate-500 max-w-[220px]">{sum.missing.length ? sum.missing.join(', ') : '—'}</td>
                      <td className="py-5 px-6"><span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black ${STATUS_STYLE[sum.status]}`}>{sum.status}</span></td>
                      <td className="py-5 px-6 text-right">
                        <button onClick={() => navigate('/RegistrarPortal/Applications/' + app.id)} className="px-4 py-2 bg-[#800000] text-white rounded-lg text-[11px] font-black hover:bg-[#600000] transition-all cursor-pointer">View / Verify</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {apps && filtered.length > 0 && (
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

export default Documents;
