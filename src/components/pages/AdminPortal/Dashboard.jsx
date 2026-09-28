// src/components/pages/AdminPortal/Dashboard.jsx
// Admin portal home — mirrors the Registrar dashboard shell, but for the Admin's
// job (managing public website content). Cards link to each content editor.
import { NavLink } from 'react-router-dom';
import AdminSidebar from '../../AdminSidebar';
import MfaReminder from '../../MfaReminder';
import {
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineSpeakerphone,
} from 'react-icons/hi';

const CARDS = [
  { title: 'Enrollment & Announcements', desc: 'Open/close online admission and post announcements to students.', icon: HiOutlineSpeakerphone, path: '/AdminPortal/EditEnrollment' },
  { title: 'Contact Information', desc: 'Emails, phone numbers & office hours shown to visitors.', icon: HiOutlinePhone, path: '/AdminPortal/EditContactUs' },
  { title: 'School Events', desc: 'Announcements and events on the public calendar.', icon: HiOutlineCalendar, path: '/AdminPortal/EditSchoolEvent' },
  { title: 'Executive Board', desc: 'Officers and leadership listed on the About page.', icon: HiOutlineUserGroup, path: '/AdminPortal/EditExecutiveBoard' },
  { title: 'Academic Schedule', desc: 'Term dates and academic calendar entries.', icon: HiOutlineAcademicCap, path: '/AdminPortal/EditAcademicSched' },
];

const Dashboard = () => (
  <div className="flex min-h-screen bg-[#F8F9FA]">
    <AdminSidebar />
    <div className="flex-1 lg:ml-64 flex flex-col">
      <main className="p-6 md:p-12 max-w-[1400px]">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Admin Overview</h1>
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Website &amp; Content Management</p>
        </div>

        <MfaReminder settingsPath="/AdminPortal/Settings" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CARDS.map((c) => (
            <NavLink
              key={c.title}
              to={c.path}
              className="group bg-white border border-gray-100 rounded-2xl shadow-sm p-7 flex items-start gap-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors shrink-0">
                <c.icon className="text-[#800000]" size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{c.title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{c.desc}</p>
                <span className="inline-block mt-3 text-[#800000] font-bold text-sm">Manage →</span>
              </div>
            </NavLink>
          ))}
        </div>
      </main>
    </div>
  </div>
);

export default Dashboard;
