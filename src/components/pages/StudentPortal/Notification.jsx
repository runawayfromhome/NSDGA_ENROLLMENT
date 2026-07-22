import React from 'react';
import Sidebar from '../../Sidebar';
import NotifCard from '../../icons/StudentPortalIcons/NotifCard';
import Header from '../../Header'; // Ensure correct path
import { HiOutlineExclamationCircle, HiOutlineInformationCircle } from "react-icons/hi";

const Notification = () => {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      
      {/* Container matches the sidebar visibility */}
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col min-h-screen">
        
        {/* Styled Header */}
        <Header title="Notifications" />

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-10 py-8">
          <div className="max-w-5xl mx-auto">
            
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Inbox</h2>
                <p className="text-sm text-gray-500 mt-1">You have 2 new actions required</p>
              </div>
              <button className="text-sm font-bold text-[#800000] hover:underline transition-all cursor-pointer">
                Mark all as read
              </button>
            </div>

            {/* TODAY SECTION */}
            <div className="mb-10">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[2px] mb-4">Today</h3>
              <NotifCard>
                <NotifItem 
                  icon={<HiOutlineExclamationCircle size={22} className="text-slate-400" />}
                  title="Action Needed: Please resubmit a clear copy of your Report Card"
                  desc="The previous upload was blurry and unreadable. Please ensure all details are visible before uploading to avoid further delays in your processing."
                  time="2 hours ago"
                  isUnread={true}
                  isFirst={true}
                />
                <NotifItem 
                  icon={<HiOutlineInformationCircle size={22} className="text-slate-400" />}
                  title="Enrollment Status: Your enrollment application is currently being reviewed"
                  desc="Your application for the Academic Year 2024-2025 has been successfully received and is now in the verification queue. Expect an update within 3-5 working days."
                  time="5 hours ago"
                  isUnread={true}
                />
              </NotifCard>
            </div>

            {/* YESTERDAY SECTION */}
            <div className="mb-10">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[2px] mb-4">Yesterday</h3>
              <NotifCard>
                 <div className="h-32 flex items-center justify-center border border-dashed border-gray-100 rounded-lg">
                    <p className="text-gray-300 text-sm italic">No notifications for yesterday</p>
                 </div>
              </NotifCard>
            </div>

            <div className="flex justify-center pb-12">
              <button className="px-12 py-2.5 border border-gray-200 rounded-full text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                Load older notifications
              </button>
            </div>

            <p className="text-center text-[11px] text-gray-400 tracking-wide mb-8">
              © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const NotifItem = ({ icon, title, desc, time, isUnread, isFirst }) => (
  <div className={`flex gap-5 p-4 -mx-4 rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer relative ${!isFirst ? 'mt-4 border-t border-gray-100 pt-6' : ''}`}>
    <div className="flex-shrink-0 w-11 h-11 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
      {icon}
    </div>
    <div className="flex-1 space-y-1">
      <div className="flex justify-between items-start">
        <h4 className="text-sm font-bold text-slate-800 pr-12 leading-snug">{title}</h4>
        <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">{time}</span>
      </div>
      <p className="text-[13px] text-slate-500 leading-relaxed max-w-3xl">{desc}</p>
    </div>
    {isUnread && (
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
      </div>
    )}
  </div>
);

export default Notification;