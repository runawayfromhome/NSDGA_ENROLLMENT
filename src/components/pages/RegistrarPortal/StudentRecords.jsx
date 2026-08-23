// Registrar → Student Records — real list of ENROLLED students (from
// applications with status 'enrolled'), searchable + filterable by grade.
import React, { useEffect, useMemo, useState } from 'react';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import { LuSearch } from "react-icons/lu";
import { listEnrolled, applicantName } from '../../../lib/registrar';

const StudentRecords = () => {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [grade, setGrade] = useState('All Levels');

  useEffect(() => { listEnrolled().then(setRows); }, []);

  const grades = useMemo(() => ['All Levels', ...Array.from(new Set((rows || []).map((r) => r.grade_level).filter(Boolean)))], [rows]);

  const filtered = (rows || []).filter((r) => {
    if (grade !== 'All Levels' && r.grade_level !== grade) return false;
    const s = (applicantName(r) + ' ' + (r.student_no || '') + ' ' + (r.form?.lrn || '')).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={true} />
        <main className="p-8 md:p-12 max-w-[1400px] w-full mx-auto space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Student Records</h1>
            <span className="text-sm font-bold text-slate-500">{rows ? `${rows.length} enrolled` : ''}</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-end gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="bg-[#F1F3F6] p-3.5 pr-8 rounded-xl text-sm font-bold text-slate-600 border-none outline-none w-64">
                {grades.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[240px]">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Search</label>
              <div className="relative">
                <LuSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input value={q} onChange={(e) => setQ(e.target.value)} type="text" placeholder="Search by name, Student No., or LRN…"
                  className="w-full bg-[#F1F3F6] border-none rounded-xl py-3.5 pl-14 pr-6 text-sm font-medium outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#FAF8F6]">
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student No.</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">LRN</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade / Program</th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows === null && <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">Loading…</td></tr>}
                  {rows && filtered.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">No enrolled students{q || grade !== 'All Levels' ? ' match your filters' : ' yet'}.</td></tr>}
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-5 px-6 text-sm font-bold text-[#800000]">{r.student_no || '—'}</td>
                      <td className="py-5 px-6 text-sm font-bold text-slate-700">{applicantName(r)}</td>
                      <td className="py-5 px-6 text-sm text-slate-500">{r.form?.lrn || '—'}</td>
                      <td className="py-5 px-6 text-sm text-slate-700">{r.form?.strand ? `${r.grade_level} · ${r.form.strand}` : r.grade_level}</td>
                      <td className="py-5 px-6 text-right"><span className="inline-flex px-4 py-1.5 rounded-full text-[10px] font-black bg-[#D1F7E2] text-[#48A675]">ENROLLED</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentRecords;
