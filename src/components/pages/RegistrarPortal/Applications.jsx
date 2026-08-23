import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import ApplicationCard from '../../icons/RegistrarIcons/ApplicationCard';
import { IoSearchOutline, IoFilterOutline, IoCalendarOutline } from "react-icons/io5";
import { listApplications, applicantName, APP_DISPLAY } from '../../../lib/registrar';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '';

const Applications = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => { listApplications().then(setApps); }, []);

  const filtered = (apps || []).filter((a) => {
    const s = (applicantName(a) + ' ' + a.id + ' ' + (a.grade_level || '')).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={true} />
        <main className="p-12 max-w-[1400px]">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#800000] mb-1">Student Applications</h1>
            <p className="text-slate-500 text-[14px]">Manage and review incoming admissions for Academic Year 2026-2027.</p>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <IoSearchOutline className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by student name, grade, or application ID..."
                className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-xl shadow-sm text-[14px] focus:outline-none focus:ring-1 focus:ring-[#800000]/20"
              />
            </div>
            <button className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-xl shadow-sm text-slate-600 text-[14px] font-medium hover:bg-gray-50 transition-colors cursor-pointer">
              <IoFilterOutline size={20} /> Filter by Status
            </button>
            <button className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 rounded-xl shadow-sm text-slate-600 text-[14px] font-medium hover:bg-gray-50 transition-colors cursor-pointer">
              <IoCalendarOutline size={20} /> Date Range
            </button>
          </div>

          <ApplicationCard>
            <div className="overflow-x-auto">
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
                  {apps === null && (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-400 text-sm">Loading applications…</td></tr>
                  )}
                  {apps && filtered.length === 0 && (
                    <tr><td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No applications{q ? ' match your search' : ' yet'}.</td></tr>
                  )}
                  {filtered.map((a) => (
                    <AppTableRow
                      key={a.id}
                      name={applicantName(a).toUpperCase()}
                      id={a.id.slice(0, 8).toUpperCase()}
                      grade={a.grade_level}
                      status={a.status}
                      date={fmtDate(a.created_at)}
                      onClick={() => navigate('/RegistrarPortal/Applications/' + a.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </ApplicationCard>
        </main>
      </div>
    </div>
  );
};

const AppTableRow = ({ name, id, grade, status, date, onClick }) => {
  const style = APP_DISPLAY[status] || APP_DISPLAY.submitted;
  return (
    <tr onClick={onClick} className="group hover:bg-gray-50 transition-colors cursor-pointer">
      <td className="py-6 text-[13px] font-bold text-slate-700 tracking-tight">{name}<span className="block text-[11px] font-medium text-slate-400">{grade}</span></td>
      <td className="py-6 text-[12px] font-medium text-slate-500">{id}</td>
      <td className="py-6">
        <span className={`px-5 py-2 rounded-full text-[9px] font-black tracking-tighter ${style.bg} ${style.text}`}>{style.label}</span>
      </td>
      <td className="py-6 text-[12px] font-medium text-slate-500">{date}</td>
    </tr>
  );
};

export default Applications;