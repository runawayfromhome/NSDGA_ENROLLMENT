// src/components/AdminSidebar.jsx
// Navigation shell for the Admin portal (website/content management).
// Same visual language as the Registrar & HeadAdmin sidebars; real logout.
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AcademyLogo from '../assets/nuestralogo.jpg';
import {
  HiOutlineViewGrid,
  HiOutlinePhone,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineSpeakerphone,
  HiOutlineClipboardCheck,
  HiOutlineCurrencyDollar,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineLogout,
} from 'react-icons/hi';
import { useSession } from '../contexts/useSession';

const MENU = [
  { name: 'Dashboard', icon: HiOutlineViewGrid, path: '/AdminPortal/Dashboard' },
  { name: 'Enrollment', icon: HiOutlineSpeakerphone, path: '/AdminPortal/EditEnrollment' },
  { name: 'Contact Info', icon: HiOutlinePhone, path: '/AdminPortal/EditContactUs' },
  { name: 'School Events', icon: HiOutlineCalendar, path: '/AdminPortal/EditSchoolEvent' },
  { name: 'Executive Board', icon: HiOutlineUserGroup, path: '/AdminPortal/EditExecutiveBoard' },
  { name: 'Academic Schedule', icon: HiOutlineAcademicCap, path: '/AdminPortal/EditAcademicSched' },
  { name: 'SHS Courses', icon: HiOutlineBookOpen, path: '/AdminPortal/EditStrands' },
  { name: 'Section Approvals', icon: HiOutlineClipboardCheck, path: '/AdminPortal/SectionApprovals' },
  { name: 'Finance Export', icon: HiOutlineCurrencyDollar, path: '/AdminPortal/Billing' },
  { name: 'Manage Student', icon: HiOutlineShieldCheck, path: '/AdminPortal/ManageStudent' },
  { name: 'My Activity', icon: HiOutlineClock, path: '/AdminPortal/Activity' },
  { name: 'My Profile', icon: HiOutlineUser, path: '/AdminPortal/Profile' },
  { name: 'Settings', icon: HiOutlineCog, path: '/AdminPortal/Settings' },
];

const AdminSidebar = () => {
  const [open, setOpen] = useState(false);
  const { session, logout } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/AdminPortal/Login', { replace: true });
  };

  const Content = ({ mobile = false }) => (
    <>
      <div className={`${mobile ? 'p-4' : 'p-8 pb-6'} flex items-center gap-3`}>
        <img src={AcademyLogo} alt="Academy Logo" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex flex-col">
          <h1 className="text-[11px] font-black leading-[1.1] tracking-tight uppercase text-[#800000]">
            Nuestra Señora de Guia Academy of Marikina
          </h1>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[1px] mt-1">Admin Access</span>
        </div>
      </div>

      <nav className="space-y-0.5 flex-1 overflow-y-auto">
        {MENU.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={mobile ? () => setOpen(false) : undefined}
            className={({ isActive }) => `
              relative flex items-center gap-4 px-6 md:px-8 py-3.5 text-[14px] transition-all duration-200 cursor-pointer
              ${isActive ? 'bg-white text-[#800000] font-bold shadow-sm' : 'hover:bg-gray-200/50 text-slate-500'}
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#800000] rounded-r-md" />}
                <item.icon size={22} className={`shrink-0 ${isActive ? 'text-[#800000]' : 'text-slate-500 opacity-70'}`} />
                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* User + Logout at the bottom, below Settings (scrolls with the menu) */}
        <div className="px-6 md:px-8 pt-5 mt-3 border-t border-gray-200">
          {session && (
            <div className="mb-3">
              <p className="text-[13px] font-bold text-slate-700 truncate">{session.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{session.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full py-3 bg-[#E2E4E7] hover:bg-gray-300 text-slate-500 rounded-xl text-[14px] font-bold transition-all active:scale-95 cursor-pointer"
          >
            <HiOutlineLogout size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

    </>
  );

  return (
    <>
      <div className="fixed left-0 top-0 hidden lg:flex flex-col h-screen w-64 bg-[#F4F4F4] text-slate-600 font-sans shrink-0 z-40">
        <Content />
      </div>

      <div className="lg:hidden fixed left-4 top-4 z-40">
        <button
          onClick={() => setOpen(!open)}
          className="btn btn-circle btn-sm bg-white text-[#800000] border-none hover:bg-gray-100 shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 lg:hidden z-30" onClick={() => setOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-56 bg-[#F4F4F4] text-slate-600 font-sans shadow-2xl overflow-y-auto z-40 flex flex-col lg:hidden">
            <Content mobile />
          </div>
        </>
      )}
    </>
  );
};

export default AdminSidebar;
