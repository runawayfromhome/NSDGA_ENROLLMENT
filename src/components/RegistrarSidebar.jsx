import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import AcademyLogo from '../assets/nuestralogo.jpg'; 
import { 
  HiOutlineViewGrid, 
  HiOutlineDocumentText, 
  HiOutlineFolder, 
  HiOutlineAcademicCap, 
  HiOutlineUser, 
  HiOutlineCog,
  HiOutlineLogout 
} from "react-icons/hi";

const RegistrarSidebar = ({ activePage }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: HiOutlineViewGrid, path: '/RegistrarPortal/Dashboard' },
    { name: 'Applications', icon: HiOutlineDocumentText, path: '/RegistrarPortal/Applications' },
    { name: 'Documents', icon: HiOutlineFolder, path: '/RegistrarPortal/Documents' },
    { name: 'Student Records', icon: HiOutlineAcademicCap, path: '/RegistrarPortal/StudentRecords' },
    { name: 'My Profile', icon: HiOutlineUser, path: '/RegistrarPortal/Profile' },
    { name: 'Settings', icon: HiOutlineCog, path: '/RegistrarPortal/Settings' },
  ];

  const closeDrawer = () => setIsDrawerOpen(false);

  const SidebarContent = ({ mobile = false }) => (
    <>
      {/* Header Section */}
      <div className={`${mobile ? 'p-4' : 'p-8 pb-10'} flex items-center gap-3`}>
        <img src={AcademyLogo} alt="Academy Logo" className={`${mobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover`} />
        <div className="flex flex-col">
          <h1 className={`${mobile ? 'text-[10px]' : 'text-[11px]'} font-black leading-[1.1] tracking-tight uppercase text-[#800000]`}>
            Nuestra Señora de Guia Academy of Marikina
          </h1>
          <span className={`${mobile ? 'text-[8px]' : 'text-[9px]'} text-slate-400 font-bold uppercase tracking-[1px] mt-1`}>Registrar Access</span>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className={`${mobile ? 'space-y-1' : 'space-y-0.5'} flex-1`}>
        {menuItems.map((item) => {
          // Logic: Active if NavLink says so OR if the activePage prop matches the item name
          const isForcedActive = activePage?.toLowerCase() === item.name.toLowerCase();

          return (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={mobile ? closeDrawer : undefined}
              className={({ isActive }) => {
                const trulyActive = isActive || isForcedActive;
                return `
                  relative flex items-center gap-4 px-6 md:px-8 py-3 md:py-3.5 text-[13px] md:text-[14px] transition-all duration-200 group cursor-pointer
                  ${trulyActive 
                    ? 'bg-white text-[#800000] font-bold shadow-sm' 
                    : 'hover:bg-gray-200/50 text-slate-500'
                  }
                `;
              }}
            >
              {({ isActive }) => {
                const trulyActive = isActive || isForcedActive;
                return (
                  <>
                    {trulyActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#800000] rounded-r-md" />
                    )}
                    <item.icon 
                      size={22} 
                      className={`shrink-0 ${trulyActive ? 'text-[#800000]' : 'text-slate-500 opacity-70'}`} 
                    />
                    <span className={trulyActive ? "translate-x-0.5 transition-transform" : ""}>
                      {item.name}
                    </span>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout Section */}
      <div className={`${mobile ? 'p-4' : 'p-6'} mt-auto`}>
        <div className={`w-full h-[1px] bg-gray-200 mb-6 mx-auto ${mobile ? 'w-[85%]' : 'w-[85%]'}`} />
        <button 
          className="flex items-center justify-center gap-3 w-full py-3 bg-[#E2E4E7] hover:bg-gray-300 text-slate-500 rounded-xl text-[13px] md:text-[14px] font-bold transition-all active:scale-95 cursor-pointer"
          onClick={() => console.log("Registrar Logging out...")}
        >
          <HiOutlineLogout size={18} className="text-slate-500" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="fixed left-0 top-20 hidden lg:flex flex-col h-[calc(100vh-80px)] w-64 bg-[#F4F4F4] text-slate-600 font-sans shrink-0 z-40">
        <SidebarContent mobile={false} />
      </div>

      {/* Mobile Hamburger Button - Visible only on mobile/tablet */}
      <div className="lg:hidden fixed left-4 top-24 z-40">
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="btn btn-circle btn-sm bg-white text-[#800000] border-none hover:bg-gray-100 shadow-lg"
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
          <div className="fixed left-0 top-20 bottom-0 w-56 bg-[#F4F4F4] text-slate-600 font-sans shadow-2xl overflow-y-auto z-40 flex flex-col lg:hidden">
            <SidebarContent mobile={true} />
          </div>
        </>
      )}
    </>
  );
};

export default RegistrarSidebar;