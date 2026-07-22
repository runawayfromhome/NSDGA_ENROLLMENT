import React from 'react';
import { IoSearchOutline } from "react-icons/io5";
import { useLocation } from 'react-router-dom';

const Header = ({ showSearch = true, showProfile = true, profileName }) => {
  const location = useLocation();
  const isRegistrar = location.pathname.startsWith('/RegistrarPortal');
  const isStudent = location.pathname.startsWith('/StudentPortal');
  const roleLabel = isRegistrar ? 'Registrar' : isStudent ? 'Student' : 'Guest';
  const displayName = profileName || (isRegistrar ? 'Nailong A. Bcdeghi' : isStudent ? 'Student User' : 'Guest User');
  const avatarSeed = isRegistrar ? 'Nailong' : isStudent ? 'Student' : 'Guest';
  
  return (
    /* 
       Removed px-8 or px-10. 
       The background (bg-white) will now start immediately at the sidebar border.
    */
    <header className="bg-white h-20 border-b border-gray-100 sticky top-0 z-40 flex items-center w-full justify-between">
      
      {/* Left side spacer - stays empty to keep the left side flush */}
      <div className="flex-1"></div>

      <div className="flex items-center gap-8 pr-12">
        {showSearch && (
          <div className="relative group">
            <IoSearchOutline 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" 
              size={18} 
            />
            <input 
              type="text" 
              placeholder="Search records..." 
              className="pl-12 pr-6 py-2.5 w-[320px] bg-[#F0F4F8] border-none rounded-xl text-[13px] focus:outline-none"
            />
          </div>
        )}
        
        {showProfile && (
          <div className="flex items-center gap-4 border-l border-gray-100 pl-8 h-10">
            <div className="text-right flex flex-col justify-center">
              <p className="text-[14px] font-black text-slate-800 leading-none">
                {displayName}
              </p>
              <p className="text-[10px] text-[#800000] font-bold uppercase tracking-[1px] mt-1">
                {roleLabel}
              </p>
            </div>
            <div className="relative">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full bg-slate-100 border border-gray-200"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;