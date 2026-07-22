import React from 'react';
import Sidebar from '../../Sidebar';
import Header from '../../Header';
import PCard from '../../icons/StudentPortalIcons/PCard'; 
import Input from '../../form/Input';
import { HiSave } from "react-icons/hi";

const Profile = () => {
  return (
    <div className="flex min-h-screen bg-slate-50/30">
      <Sidebar />
      
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        {/* showSearch={false} AND showProfile={false} to clean the header */}
        <Header title="My Profile" showSearch={false} showProfile={false} />

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-4">
            
            {/* Hero Profile Card */}
            <PCard>
              <div className="flex items-center gap-6 px-8 py-3"> 
                <div className="avatar">
                  <div className="w-16 rounded-full border-2 border-slate-50 shadow-sm">
                    <img src="/nailong-avatar.png" alt="Profile" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Nailong Andrei Amurao</h2>
                  <p className="text-slate-500 text-sm font-medium">LRN: 136676090147</p>
                </div>
              </div>
            </PCard>

            {/* Information Card */}
            <PCard>
              <div className="p-6">
                {/* Personal Information Section */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-[10px] font-bold text-[#800000] uppercase tracking-[0.2em]">
                      Personal Information
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-12 gap-y-4 mb-10">
                  <Input label="BIRTHDATE" defaultValue="October 12, 2008" />
                  <Input label="BIRTHPLACE" defaultValue="Marikina City, Philippines" />
                  <Input label="GENDER" defaultValue="Male" />
                  <Input label="NATIONALITY" defaultValue="Filipino" />
                </div>

                {/* Contact Information Section */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-[10px] font-bold text-[#800000] uppercase tracking-[0.2em]">
                      Contact Information
                    </span>
                  </div>
                </div>

                <div className="flex justify-end mb-2">
                    <span className="text-[9px] text-slate-400 font-bold uppercase italic">Editable Fields</span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 md:gap-x-12">
                    <Input label="MOBILE NUMBER" defaultValue="+63 917 123 4567" />
                    <Input label="EMAIL ADDRESS" defaultValue="juan.delacruz@student.nsdga.edu.ph" />
                  </div>
                  <Input label="COMPLETE ADDRESS" defaultValue="Block 6 Lot 12 Mahogany St., Brgy. San Antonio, Pasig City, Metro Manila" />
                </div>

                {/* Action Button */}
                <div className="mt-8 flex justify-end">
                  <button className="bg-[#800000] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#600000] transition-all shadow-lg shadow-red-900/20 text-sm">
                    <HiSave size={18} />
                    Save Changes
                  </button>
                </div>
              </div>
            </PCard>

            <footer className="mt-8 pb-4 text-center">
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;