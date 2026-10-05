// Registrar dashboard — real counts + newest applications from Supabase.
import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import RegistrarSidebar from '../../RegistrarSidebar';
import MfaReminder from '../../MfaReminder';
import Header from '../../Header';
import TotalPendingCard from '../../icons/TotalPendingCard';
import DocumentReviewcard from '../../icons/RegistrarIcons/DocumentReviewcard';
import UrgentTaskCard from '../../icons/RegistrarIcons/UrgentTaskCard';
import ApplicationCard from '../../icons/RegistrarIcons/ApplicationCard';
import { HiOutlineUserAdd, HiOutlineAcademicCap, HiOutlineExclamationCircle } from "react-icons/hi";
import { listApplications, applicantName, APP_DISPLAY } from '../../../lib/registrar';
import { TableSkeleton, StatCardsSkeleton } from '../../Skeleton';

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '';

const Dashboard = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState(null);

  useEffect(() => { listApplications().then(setApps); }, []);

  const all = apps || [];
  const pending = all.filter((a) => ['submitted', 'under_review', 'needs_correction'].includes(a.status)).length;
  const enrolled = all.filter((a) => a.status === 'enrolled').length;
  const needsAction = all.filter((a) => a.status === 'needs_correction').length;
  const newest = all.slice(0, 5);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={true} />
        <main className="p-8 md:p-12 max-w-[1400px]">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Registrar Overview</h1>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Academic Year 2026-2027</p>
          </div>

          <MfaReminder settingsPath="/RegistrarPortal/Settings" />

          {apps === null ? (
            <div className="mb-12"><StatCardsSkeleton count={3} /></div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <NavLink to="/RegistrarPortal/Applications" className="active:scale-[0.98] transition-transform">
              <TotalPendingCard>
                <StatBody icon={HiOutlineUserAdd} value={pending} label="Pending Applications" iconBg="bg-red-50" iconColor="text-[#800000]" />
              </TotalPendingCard>
            </NavLink>
            <NavLink to="/RegistrarPortal/StudentRecords" className="active:scale-[0.98] transition-transform">
              <DocumentReviewcard>
                <StatBody icon={HiOutlineAcademicCap} value={enrolled} label="Enrolled Students" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
              </DocumentReviewcard>
            </NavLink>
            <NavLink to="/RegistrarPortal/Applications" className="active:scale-[0.98] transition-transform">
              <UrgentTaskCard>
                <StatBody icon={HiOutlineExclamationCircle} value={needsAction} label="Needs Correction" iconBg="bg-amber-50" iconColor="text-amber-600" />
              </UrgentTaskCard>
            </NavLink>
          </div>
          )}

          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Newest Applications</h2>
            <NavLink to="/RegistrarPortal/Applications" className="text-[#800000] font-bold text-sm flex items-center gap-2 hover:opacity-70 transition-all">
              View All <span className="text-lg">→</span>
            </NavLink>
          </div>

          <ApplicationCard>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                    <th className="pb-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Application ID No.</th>
                    <th className="pb-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="pb-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {apps === null && <TableSkeleton rows={5} cols={4} />}
                  {apps && newest.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No applications yet.</td></tr>}
                  {newest.map((a) => {
                    const style = APP_DISPLAY[a.status] || APP_DISPLAY.submitted;
                    return (
                      <tr key={a.id} onClick={() => navigate('/RegistrarPortal/Applications/' + a.id)} className="group hover:bg-gray-50 transition-colors cursor-pointer">
                        <td className="py-5 text-[13px] font-bold text-slate-700 tracking-tight">{applicantName(a).toUpperCase()}<span className="block text-[11px] font-medium text-slate-400">{a.grade_level}</span></td>
                        <td className="py-5 text-[12px] font-medium text-slate-500">{a.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-5"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-tighter ${style.bg} ${style.text}`}>{style.label}</span></td>
                        <td className="py-5 text-[12px] font-medium text-slate-500">{fmtDate(a.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {apps && newest.length === 0 && <p className="py-8 text-center text-slate-400 text-sm">No applications yet.</p>}
              {newest.map((a) => {
                const style = APP_DISPLAY[a.status] || APP_DISPLAY.submitted;
                return (
                  <div key={a.id} onClick={() => navigate('/RegistrarPortal/Applications/' + a.id)} className="border border-gray-100 rounded-xl p-4 cursor-pointer active:scale-[0.99] transition-transform">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-700 truncate">{applicantName(a).toUpperCase()}</p>
                        <p className="text-[11px] text-slate-400">{a.grade_level}</p>
                      </div>
                      <span className={`shrink-0 px-3 py-1.5 rounded-full text-[9px] font-black tracking-tighter ${style.bg} ${style.text}`}>{style.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2">ID {a.id.slice(0, 8).toUpperCase()} · {fmtDate(a.created_at)}</p>
                  </div>
                );
              })}
            </div>
          </ApplicationCard>
        </main>
      </div>
    </div>
  );
};

const StatBody = ({ icon: Icon, value, label, iconBg, iconColor }) => (
  <div className="flex items-center gap-6 group cursor-pointer">
    <div className={`w-14 h-14 ${iconBg} rounded-xl flex items-center justify-center`}>
      <Icon className={iconColor} size={28} />
    </div>
    <div>
      <h3 className="text-4xl font-black text-slate-800">{value}</h3>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  </div>
);

export default Dashboard;
