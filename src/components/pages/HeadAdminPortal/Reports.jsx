// src/components/pages/HeadAdminPortal/Reports.jsx
// School-wide reports & analytics — real data, with a school-year filter,
// CSV export, and grade-level breakdowns.
import { useEffect, useMemo, useState } from 'react';
import HeadAdminSidebar from '../../HeadAdminSidebar';
import {
  HiOutlineUserAdd, HiOutlineAcademicCap, HiOutlineClock, HiOutlineExclamationCircle, HiOutlineDownload,
} from 'react-icons/hi';
import { listApplications, applicantName, APP_DISPLAY } from '../../../lib/registrar';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LEVELS = ['Kindergarten', 'Elementary', 'Junior High School', 'Senior High School'];
const LEVEL_SHORT = { 'Kindergarten': 'Kinder', 'Elementary': 'Elementary', 'Junior High School': 'Junior High', 'Senior High School': 'Senior High' };
const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const Reports = () => {
  const [apps, setApps] = useState(null);
  const [year, setYear] = useState('All');

  useEffect(() => { listApplications().then(setApps); }, []);

  const years = useMemo(
    () => ['All', ...Array.from(new Set((apps || []).map((a) => a.school_year).filter(Boolean))).sort().reverse()],
    [apps]
  );

  const all = (apps || []).filter((a) => year === 'All' || a.school_year === year);
  const total = all.length;
  const enrolled = all.filter((a) => a.status === 'enrolled');
  const pending = all.filter((a) => ['submitted', 'under_review'].includes(a.status));
  const needsCorr = all.filter((a) => a.status === 'needs_correction');
  const rejected = all.filter((a) => a.status === 'rejected');

  const kpis = [
    { label: 'Total Applications', value: total, icon: HiOutlineUserAdd, tint: 'bg-red-50 text-[#800000]' },
    { label: 'Enrolled', value: enrolled.length, icon: HiOutlineAcademicCap, tint: 'bg-blue-50 text-[#3B67B8]' },
    { label: 'Pending Review', value: pending.length, icon: HiOutlineClock, tint: 'bg-yellow-50 text-[#9A9E4C]' },
    { label: 'Needs Correction', value: needsCorr.length, icon: HiOutlineExclamationCircle, tint: 'bg-orange-50 text-[#C55A5A]' },
  ];

  const chartYear = year === 'All' ? new Date().getFullYear() : parseInt(year, 10);
  const monthly = MONTHS.map((m, i) => ({
    m, v: all.filter((a) => { const d = new Date(a.created_at); return d.getFullYear() === chartYear && d.getMonth() === i; }).length,
  }));
  const maxMonthly = Math.max(1, ...monthly.map((d) => d.v));

  const status = [
    { label: 'Enrolled', value: pct(enrolled.length, total), color: '#48A675' },
    { label: 'Pending', value: pct(pending.length, total), color: '#9A9E4C' },
    { label: 'Needs Correction', value: pct(needsCorr.length, total), color: '#C55A5A' },
    { label: 'Rejected', value: pct(rejected.length, total), color: '#94A3B8' },
  ];

  const byLevelApps = LEVELS.map((label) => ({ label: LEVEL_SHORT[label], count: all.filter((a) => a.grade_level === label).length }));
  const maxLevel = Math.max(1, ...byLevelApps.map((b) => b.count));
  const byLevelEnrolled = LEVELS.map((label) => ({ label: LEVEL_SHORT[label], value: pct(enrolled.filter((a) => a.grade_level === label).length, enrolled.length) }));

  // Document storage usage (global — not year-filtered). 1 GB free tier.
  const FREE_BYTES = 1024 * 1024 * 1024;
  let docFiles = 0, docBytes = 0;
  (apps || []).forEach((a) => Object.values(a.documents || {}).forEach((d) => { if (d?.path) { docFiles++; docBytes += d.size || 0; } }));
  const usedMB = docBytes / (1024 * 1024);
  const storagePct = Math.min(100, (docBytes / FREE_BYTES) * 100);

  const exportCsv = () => {
    const header = ['Application ID', 'Name', 'Grade Level', 'Student Type', 'Status', 'Student No.', 'School Year', 'Submitted'];
    const lines = all.map((a) => [
      a.id.slice(0, 8).toUpperCase(), applicantName(a), a.grade_level, a.student_type,
      (APP_DISPLAY[a.status] || {}).label || a.status, a.student_no || '', a.school_year || '',
      a.created_at ? new Date(a.created_at).toLocaleDateString('en-US') : '',
    ].map(csvCell).join(','));
    const csv = [header.map(csvCell).join(','), ...lines].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `applications-${year === 'All' ? 'all' : year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <HeadAdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="p-6 md:p-12 max-w-[1400px]">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Reports &amp; Analytics</h1>
              <p className="text-slate-500 text-sm">School-wide enrollment overview.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">School Year</label>
                <select value={year} onChange={(e) => setYear(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none">
                  {years.map((y) => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
                </select>
              </div>
              <button onClick={exportCsv} disabled={!total} className="mt-4 flex items-center gap-2 bg-[#800000] hover:bg-[#600000] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md disabled:opacity-50 cursor-pointer">
                <HiOutlineDownload size={18} /> Export CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {kpis.map((k) => (
              <div key={k.label} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${k.tint}`}><k.icon size={28} /></div>
                <div>
                  <p className="text-3xl font-black text-slate-800">{apps === null ? '—' : k.value}</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Applications per Month ({chartYear})</h2>
              <div className="flex items-end justify-between gap-3 h-56">
                {monthly.map((d) => (
                  <div key={d.m} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                    <span className="text-[11px] font-bold text-slate-500">{d.v || ''}</span>
                    <div className="w-full rounded-t-lg bg-[#800000]/85 hover:bg-[#800000] transition-all" style={{ height: `${(d.v / maxMonthly) * 100}%` }} title={`${d.v} applications`} />
                    <span className="text-[11px] font-bold text-slate-400">{d.m}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Status Distribution</h2>
              <div className="space-y-5">
                {status.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-[12px] font-semibold text-slate-600 mb-1.5"><span>{s.label}</span><span>{s.value}%</span></div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.value}%`, backgroundColor: s.color }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Applications by Grade Level</h2>
              <div className="space-y-4">
                {byLevelApps.map((b) => (
                  <div key={b.label} className="flex items-center gap-4">
                    <span className="w-24 text-[12px] font-bold text-slate-500 shrink-0">{b.label}</span>
                    <div className="flex-1 h-6 rounded-lg bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-lg bg-[#800000]/80" style={{ width: `${(b.count / maxLevel) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right text-sm font-black text-slate-700">{b.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Enrolled by Level (%)</h2>
              <div className="grid grid-cols-2 gap-6">
                {byLevelEnrolled.map((b) => (
                  <div key={b.label} className="text-center">
                    <p className="text-4xl font-black text-[#800000]">{b.value}%</p>
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mt-1">{b.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8 mt-6">
            <div className="flex justify-between items-end mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-bold text-slate-800">Document Storage</h2>
              <span className="text-sm font-bold text-slate-500">{docFiles} file{docFiles === 1 ? '' : 's'} · ≈ {usedMB.toFixed(1)} MB of 1 GB</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${storagePct}%`, backgroundColor: storagePct < 80 ? '#800000' : '#C55A5A' }} />
            </div>
            <p className="text-[12px] text-slate-400 mt-2">
              {storagePct < 1 ? 'Plenty of room' : `${storagePct.toFixed(1)}% used`} — the free tier includes 1 GB of student-document storage.
              {storagePct >= 80 && ' Approaching the limit — consider archiving old files or upgrading.'}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
