import { useState } from 'react'
import RegistrarSidebar from '../../RegistrarSidebar'
import ProfileOverviewCard from '../../icons/RegistrarIcons/ProfileOverviewCard'
import AcadHistoryCard from '../../icons/RegistrarIcons/AcadHistoryCard'     
import UploadedDocsCard from '../../icons/RegistrarIcons/UploadedDocsCard'   
import { LuPencilLine } from "react-icons/lu" 

const DocuStudentProfile = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const studentData = {
    name: "Sean Andrei Amurao",
    lrn: "136676090157",
    grade: "11",
    status: "Currently Enrolled"
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* 
        Note: The sidebar stays active because we are within the 
        Documents file path structure. 
      */}
      <RegistrarSidebar activePage="documents" />
      
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <main className="p-12 max-w-[1400px] w-full mx-auto space-y-8">
          
          {/* Breadcrumbs */}
          <nav className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex gap-2 cursor-default">
            <span>Documents</span>
            <span>{">"}</span>
            <span className="text-slate-800">Student Profile</span>
          </nav>

          {/* Header Profile Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 shadow-sm border border-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop" 
                  alt="Student Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-800">{studentData.name}</h1>
                  <span className="bg-[#E8F8F0] text-[#2D8A5B] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tight">
                    {studentData.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                  LRN: {studentData.lrn} - GRADE {studentData.grade}
                </p>
              </div>
            </div>
            
            <button className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white cursor-pointer hover:shadow-md transition-all active:scale-95 outline-none">
              <LuPencilLine size={14} className="text-[#800000]" /> Edit Profile
            </button>
          </div>

          {/* Tabs Navigation Buttons */}
          <div className="flex border-b border-slate-200">
            {[
              { id: 'overview', label: 'Profile Overview' },
              { id: 'academic', label: 'Academic History' },
              { id: 'documents', label: 'Verified Documents' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-8 text-xs font-black uppercase tracking-widest transition-all border-b-2 cursor-pointer outline-none ${
                  activeTab === tab.id 
                    ? 'border-[#800000] text-[#800000]' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === 'overview' && (
              <div className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                <ProfileOverviewCard />
              </div>
            )}

            {activeTab === 'academic' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Senior High School</h3>
                  <AcadHistoryCard>
                    <div className="flex border-l-4 border-[#800000] pl-6 py-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-700">Grade 11</h4>
                          <span className="bg-[#FFF1F1] text-[#800000] text-[8px] font-black px-2 py-0.5 rounded uppercase">Current</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Nuestra Señora de Guia Academy</p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase">A.Y. 2025-2026</p>
                      </div>
                    </div>
                  </AcadHistoryCard>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Junior High School</h3>
                  <AcadHistoryCard>
                    <div className="pl-6 py-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-700">Grade 10</h4>
                        <span className="bg-[#E8F8F0] text-[#2D8A5B] text-[8px] font-black px-2 py-0.5 rounded uppercase">Completed</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Biringan National High School</p>
                      <p className="text-[10px] font-bold text-slate-300 uppercase">A.Y. 2024-2025</p>
                    </div>
                  </AcadHistoryCard>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <UploadedDocsCard />
                {/* Comment Box colored per Screen Shot 2026-05-03 at 2.20.22 AM.png */}
                <div className="w-full h-32 bg-[#D9D9D9] rounded-xl flex items-center justify-center border border-slate-200 shadow-inner">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comment Box</span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DocuStudentProfile