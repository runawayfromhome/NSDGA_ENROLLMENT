import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import TotalPendingCard from '../../icons/TotalPendingCard';
import DocumentReviewcard from '../../icons/RegistrarIcons/DocumentReviewcard';
import UrgentTaskCard from '../../icons/RegistrarIcons/UrgentTaskCard';
import ApplicationCard from '../../icons/RegistrarIcons/ApplicationCard';
import { HiOutlineUserAdd, HiOutlineDocumentDuplicate, HiOutlineExclamationCircle } from "react-icons/hi";

const STATUS_STYLES = {
  'PENDING REVIEW': { bg: 'bg-[#F2F6D0]', text: 'text-[#9A9E4C]', label: 'PENDING REVIEW' },
  'APPROVED': { bg: 'bg-[#D1F7E2]', text: 'text-[#48A675]', label: 'APPROVED' },
  'NEEDS CORRECTION': { bg: 'bg-[#FCE4E4]', text: 'text-[#C55A5A]', label: 'NEEDS CORRECTION' }
};

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={true} />
        <main className="p-12 max-w-[1400px]">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Registrar Overview</h1>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Academic Year 2026-2027</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <NavLink to="/RegistrarPortal/Applications" className="active:scale-[0.98] transition-transform">
              <TotalPendingCard>
                <div className="flex items-center gap-6 group cursor-pointer">
                  <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <HiOutlineUserAdd className="text-[#800000]" size={28} />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-800">1,284</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Pending Applications</p>
                  </div>
                </div>
              </TotalPendingCard>
            </NavLink>

            <NavLink to="/RegistrarPortal/Documents" className="active:scale-[0.98] transition-transform">
              <DocumentReviewcard>
                <div className="flex items-center gap-6 group cursor-pointer">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                    <HiOutlineDocumentDuplicate className="text-slate-400" size={28} />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-800">452</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Documents for Review</p>
                  </div>
                </div>
              </DocumentReviewcard>
            </NavLink>

            <NavLink to="/RegistrarPortal/Settings" className="active:scale-[0.98] transition-transform">
              <UrgentTaskCard>
                <div className="flex items-center gap-6 group cursor-pointer">
                  <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                    <HiOutlineExclamationCircle className="text-slate-400" size={28} />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-slate-800">2</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Urgent Tasks</p>
                  </div>
                </div>
              </UrgentTaskCard>
            </NavLink>
          </div>

          <div className="flex justify-between items-end mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Newest Application</h2>
            <NavLink to="/RegistrarPortal/Applications" className="text-[#800000] font-bold text-sm flex items-center gap-2 hover:opacity-70 transition-all">
              View All Records <span className="text-lg">→</span>
            </NavLink>
          </div>

          <ApplicationCard>
            <div className="overflow-x-auto">
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
                  <TableRow name="SEAN ANDREI AMURAO" id="APP-2026-0001" status="PENDING REVIEW" date="APRIL 15, 2026" onClick={() => navigate('/RegistrarPortal/Applications/1')} />
                  <TableRow name="ALIYAH THURSDAY FRANCISCO" id="APP-2026-0002" status="APPROVED" date="APRIL 15, 2026" onClick={() => navigate('/RegistrarPortal/Applications/2')} />
                  <TableRow name="RAFAEL RYAN TILACAS" id="APP-2026-0003" status="NEEDS CORRECTION" date="APRIL 15, 2026" onClick={() => navigate('/RegistrarPortal/Applications/3')} />
                </tbody>
              </table>
            </div>
          </ApplicationCard>
        </main>
      </div>
    </div>
  );
};

const TableRow = ({ name, id, status, date, onClick }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES['PENDING REVIEW'];
  return (
    <tr onClick={onClick} className="group hover:bg-gray-50 transition-colors cursor-pointer">
      <td className="py-5 text-[13px] font-bold text-slate-700 tracking-tight">{name}</td>
      <td className="py-5 text-[12px] font-medium text-slate-500">{id}</td>
      <td className="py-5">
        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-tighter ${style.bg} ${style.text}`}>{style.label}</span>
      </td>
      <td className="py-5 text-[12px] font-medium text-slate-500">{date}</td>
    </tr>
  );
};

export default Dashboard;