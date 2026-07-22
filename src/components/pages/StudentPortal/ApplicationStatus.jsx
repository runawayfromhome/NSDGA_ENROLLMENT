import React from 'react'
import Sidebar from '../../Sidebar';
import Header from '../../Header';
import StatusCard from '../../icons/StudentPortalIcons/StatusCard';
import NotesCard from '../../icons/StudentPortalIcons/NotesCard';
import ViewDetailsModal from '../../icons/StudentPortalIcons/ViewDetailsModal';
import { HiOutlineInformationCircle } from "react-icons/hi";

const ApplicationStatus = () => {
  return (
    <div className="flex min-h-screen bg-white">    
      <Sidebar />
      
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col min-h-screen">
        <Header title="Application Status" />

        <div className="flex-1 overflow-y-auto bg-slate-50/30 p-10">
          <div className="max-w-5xl mx-auto">
            
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome, Nailong!</h2>
                <p className="text-slate-500 mt-1">Track your progress and recent updates here.</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Application ID No.: 123456789</p>
              </div>
            </div>

            <StatusCard />

            <NotesCard>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-slate-50 border border-gray-100 rounded-xl flex items-center justify-center shadow-sm">
                    <HiOutlineInformationCircle size={28} className="text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">Additional Notes</h3>
                    <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
                      Your application is currently being processed by the Registrar office. 
                      Expect a response regarding your interview schedule within 3-5 business days.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => document.getElementById('task_details_modal').showModal()}
                  className="px-10 py-3 bg-[#A02E23] hover:bg-[#800000] text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 active:scale-95 cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </NotesCard>

            <footer className="mt-20 text-center">
              <p className="text-[11px] text-gray-400 tracking-wide">
                © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
              </p>
            </footer>
          </div>
        </div>
      </div>

      {/* Render the Modal component at the root level of the page */}
      <ViewDetailsModal />
    </div>
  )
}

export default ApplicationStatus;