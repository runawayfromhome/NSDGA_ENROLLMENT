import React from 'react';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import { LuUser, LuBriefcase, LuContact, LuIdCard } from "react-icons/lu";

import RegistrarProfileCard from '../../icons/RegistrarIcons/RegistrarProfileCard'; 
import RegistrarPersonInfoCard from '../../icons/RegistrarIcons/RegistrarPersonInfoCard';
import RegistrarProfDetailsCard from '../../icons/RegistrarIcons/RegistrarProfDetailsCard';
import RegistarContactInfoCard from '../../icons/RegistrarIcons/RegistarContactInfoCard';

const MyProfile = () => {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />

        <main className="p-12 max-w-[1200px] mx-auto w-full space-y-8">
          
          {/* Main Profile Header Card */}
          <RegistrarProfileCard>
            <div className="flex items-center gap-8">
              <div className="w-32 h-32 rounded-2xl overflow-hidden bg-amber-100 flex items-center justify-center">
                <img 
                  src="/path-to-your-mascot-image.png" 
                  alt="Profile Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-[#4A1010]">Sean Andrei Amurao</h1>
                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <LuIdCard size={18} className="text-[#800000]" />
                    <span>Registrar</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span>EMPLOYEE ID NO. 2024-00892</span>
                </div>
              </div>
            </div>
          </RegistrarProfileCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-2">
                <div className="p-2 bg-slate-100 rounded-lg text-[#800000]">
                  <LuUser size={20} />
                </div>
                <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Personal Information</h2>
              </div>
              
              <RegistrarPersonInfoCard>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-y-8 gap-x-2 md:gap-x-4">
                  <ProfileField label="Full Name" value="Sean Andrei Amurao" />
                  <ProfileField label="Gender" value="Male" />
                  <ProfileField label="Birthdate" value="April 16, 2004" />
                  <ProfileField label="Nationality" value="Filipino" />
                </div>
              </RegistrarPersonInfoCard>
            </div>

            {/* Professional Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 ml-2">
                <div className="p-2 bg-slate-100 rounded-lg text-[#800000]">
                  <LuBriefcase size={20} />
                </div>
                <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Professional Details</h2>
              </div>

              <RegistrarProfDetailsCard>
                <div className="space-y-6 md:space-y-8">
                  <ProfileField label="Department" value="Office of the Registrar" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ProfileField label="Date Hired" value="August 15, 2015" />
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employment Status</label>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-blue-700"></span>
                        Full-Time
                      </div>
                    </div>
                  </div>
                </div>
              </RegistrarProfDetailsCard>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg text-[#800000]">
                  <LuContact size={20} />
                </div>
                <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">Contact Information</h2>
              </div>
              <button className="bg-[#4A1010] text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#300a0a] transition-colors shadow-md cursor-pointer">
                Save Changes
              </button>
            </div>

            <RegistarContactInfoCard>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <EditableField label="Email Address" value="e.rodriguez@guia-academy.edu" />
                <EditableField label="Phone Number" value="+63 917 555 0123" />
                <EditableField label="Home Address" value="seanandreamurao@gmail.com" />
              </div>
            </RegistarContactInfoCard>
          </div>

        </main>
      </div>
    </div>
  );
};

const ProfileField = ({ label, value }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <p className="text-sm font-bold text-slate-700">{value}</p>
  </div>
);

const EditableField = ({ label, value }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <input 
      type="text" 
      defaultValue={value}
      className="w-full bg-[#E2E4E7] border-none rounded-lg p-3 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-[#800000]/20 outline-none"
    />
  </div>
);

export default MyProfile;