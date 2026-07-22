import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import AcademyLogo from '../assets/nuestralogo.jpg'; 
import HomeIcon from './icons/HomeIcon';
import FileIcon from './icons/FileIcon';
import Folder from './icons/Folder';
import Notif from './icons/Notif';
import PersonIcon from './icons/PersonIcon';
import Setting from './icons/Setting';
import LogOutIcon from './icons/LogOutIcon';

const Sidebar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const menuItems = [
    // MATCH THIS TO YOUR App.js: /StudentPortal/ApplicationStatus
    { name: 'Application Status', icon: HomeIcon, path: '/StudentPortal/ApplicationStatus' },
    { name: 'Enrollment Form', icon: FileIcon, path: '/StudentPortal/EnrollmentForm' },
    { name: 'My Documents', icon: Folder, path: '/StudentPortal/Documents' },
    { name: 'Notifications', icon: Notif, path: '/StudentPortal/Notifications' },
    { name: 'My Profile', icon: PersonIcon, path: '/StudentPortal/Profile' },
    { name: 'Settings', icon: Setting, path: '/StudentPortal/Settings' },
  ];

  const closeDrawer = () => setIsDrawerOpen(false);

  // Sidebar content component
  const SidebarContent = ({ mobile = false }) => (
    <>
      <div className={`${mobile ? 'p-4' : 'p-3 md:p-6'} flex items-center gap-3`}>
        <img src={AcademyLogo} alt="Academy Logo" className={`${mobile ? 'w-10 h-10' : 'w-8 md:w-10 h-8 md:h-10'} rounded-full border border-white/20 object-cover`} />
        <div className="flex flex-col">
          <h1 className={`${mobile ? 'text-xs' : 'text-[8px] md:text-[10px]'} font-bold leading-tight tracking-tight uppercase`}>
            Nuestra Señora de Guia <br /> Academy of Marikina
          </h1>
          <span className={`${mobile ? 'text-[8px]' : 'text-[7px] md:text-[8px]'} opacity-60 uppercase tracking-[2px] mt-0.5`}>Student Portal</span>
        </div>
      </div>

      <nav className={`${mobile ? 'px-3 py-4 space-y-2' : 'px-2 md:px-3 py-4 space-y-1'}`}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end
            onClick={mobile ? closeDrawer : undefined}
            className={({ isActive }) => `
              flex items-center gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3 rounded-lg text-[11px] md:text-[13px] transition-all duration-200 group cursor-pointer
              ${isActive 
                ? 'bg-white/20 shadow-sm font-semibold opacity-100' 
                : 'hover:bg-white/10 opacity-80 hover:opacity-100'
              }
            `}
          >
            <item.icon size={18} color="white" className="shrink-0" />
            <span className={mobile ? 'inline' : 'hidden sm:inline'}>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {mobile && <div className="flex-grow"></div>}

      <div className={`${mobile ? 'p-4 mb-2' : 'p-3 md:p-4 mb-4'}`}>
        <button 
          className="flex items-center justify-center gap-2 md:gap-3 w-full py-2 md:py-3 bg-black/10 hover:bg-black/20 border border-white/10 rounded-xl text-[11px] md:text-[13px] font-bold transition-all active:scale-95 cursor-pointer"
          onClick={() => console.log("Logging out...")}
        >
          <LogOutIcon size={16} color="white" />
          <span className="uppercase tracking-widest text-[9px] md:text-[11px]">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="fixed left-0 top-20 hidden lg:flex flex-col h-[calc(100vh-80px)] w-64 bg-[#800000] text-white font-sans shrink-0 border-r border-black/10 z-40">
        <SidebarContent mobile={false} />
      </div>

      {/* Mobile Hamburger Button - Visible only on mobile/tablet */}
      <div className="lg:hidden fixed left-4 top-24 z-40">
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="btn btn-circle btn-sm bg-[#800000] text-white border-none hover:bg-[#600000] shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer - Visible when opened */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 lg:hidden z-30"
            onClick={closeDrawer}
          ></div>

          {/* Drawer */}
          <div className="fixed left-0 top-20 bottom-0 w-56 bg-[#800000] text-white font-sans shadow-2xl overflow-y-auto z-40 flex flex-col lg:hidden">
            <SidebarContent mobile={true} />
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;