import React from 'react'
import { NavLink } from 'react-router-dom'
import Header from '../../Header'
import RegistrarSidebar from '../../RegistrarSidebar'
import StatusTypeLevelCard from '../../icons/RegistrarIcons/StatusTypeLevelCard'    
import DocumentsTblCard from '../../icons/RegistrarIcons/DocumentsTblCard'
import { LuSearch, LuChevronDown, LuBell } from "react-icons/lu"

const Documents = () => {
  const documentData = [
    { name: "Aliyah Thursday Francisco", lrn: "136676090147", type: "New Student", missing: "Good Moral", form138: "Updated", action: true },
    { name: "Sean Andrei Amurao", lrn: "136676090147", type: "New Student", missing: "Form 137", form138: "Updated", action: true },
    { name: "Rafael Ryan Tilacas", lrn: "136676090147", type: "Old Student", missing: "None", form138: "Needs Update", action: true },
    { name: "Teodoro Repizo III", lrn: "136676090147", type: "Transferee", missing: "PSA Birth Certificate", form138: "Updated", action: true },
    { name: "Rheana Lyn Estero", lrn: "136676090147", type: "Graduate", missing: "None", form138: "Updated", action: false },
  ];

  const gradeLevels = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header />
        <main className="p-12 max-w-[1400px] w-full mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Documents</h1>

          <StatusTypeLevelCard>
            <div className="flex items-end justify-between">
              <div className="flex gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Submission Status</label>
                  <div className="dropdown dropdown-bottom w-56 z-50">
                    <div tabIndex={0} role="button" className="bg-[#F1F3F6] p-4 pr-6 rounded-xl flex items-center justify-between text-sm font-bold text-slate-600 cursor-pointer">
                      All Status <LuChevronDown size={18} className="text-slate-400" />
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu bg-white rounded-box z-[1] w-full p-2 shadow-xl border border-slate-100 mt-1">
                      <li><a>All Status</a></li>
                      <li><a>Complete</a></li>
                      <li><a>Incomplete</a></li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Type</label>
                  <div className="dropdown dropdown-bottom w-56 z-50">
                    <div tabIndex={0} role="button" className="bg-[#F1F3F6] p-4 pr-6 rounded-xl flex items-center justify-between text-sm font-bold text-slate-600 cursor-pointer">
                      Old Student <LuChevronDown size={18} className="text-slate-400" />
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu bg-white rounded-box z-[1] w-full p-2 shadow-xl border border-slate-100 mt-1">
                      <li><a>New Student</a></li>
                      <li><a>Old Student</a></li>
                      <li><a>Transferee</a></li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level</label>
                  <div className="dropdown dropdown-bottom w-56 z-50">
                    <div tabIndex={0} role="button" className="bg-[#F1F3F6] p-4 pr-6 rounded-xl flex items-center justify-between text-sm font-bold text-slate-600 cursor-pointer">
                      Grade 1 <LuChevronDown size={18} className="text-slate-400" />
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu bg-white rounded-box z-[1] w-full p-2 shadow-xl border border-slate-100 mt-1 max-h-60 overflow-y-auto">
                      {gradeLevels.map((grade) => (
                        <li key={grade}><a>{grade}</a></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <button className="bg-[#4A1010] text-white px-12 py-3 rounded-xl font-bold hover:bg-[#300a0a] transition-all shadow-md cursor-pointer">
                Apply filter
              </button>
            </div>
          </StatusTypeLevelCard>

          <DocumentsTblCard>
            <div className="space-y-6">
              <div className="relative">
                <LuSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search by Name or LRN No..."
                  className="w-full bg-[#F1F3F6] border-none rounded-xl py-4 pl-14 pr-6 text-sm font-medium focus:ring-2 focus:ring-[#800000]/10 outline-none"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#FAF8F6]">
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Missing Documents</th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Form 138 Status</th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documentData.map((doc, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50 transition-colors relative">
                        <td className="py-5 px-6">
                          {/* This link covers the row area but keeps the data visible */}
                          <NavLink to="/RegistrarPortal/DocuStudentProfile" className="absolute inset-0 z-10" />
                          <div className="relative z-0">
                            <div className="font-bold text-slate-700 text-sm">{doc.name}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase">LRN: {doc.lrn}</div>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-sm font-bold text-slate-700">{doc.type}</td>
                        <td className="py-5 px-6 text-sm font-bold text-slate-700">{doc.missing}</td>
                        <td className="py-5 px-6 text-sm font-bold text-slate-700">{doc.form138}</td>
                        <td className="py-5 px-6 text-right">
                          <div className="relative z-20">
                            {doc.action ? (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="inline-flex items-center gap-1 px-4 py-2 bg-[#FFF9F2] text-[#E6A23C] text-[11px] font-bold rounded-lg border border-[#FDF6EC] hover:bg-[#FDF6EC] transition-all cursor-pointer"
                              >
                                <LuBell size={14} /> Remind Student
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-bold italic">No action needed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </DocumentsTblCard>
        </main>
      </div>
    </div>
  )
}

export default Documents