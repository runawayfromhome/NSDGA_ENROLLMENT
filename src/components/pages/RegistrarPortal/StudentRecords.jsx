import React from 'react';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import AcadYrGreadeLvlCard from '../../icons/RegistrarIcons/AcadYrGreadeLvlCard';

import RecordsTblCard from '../../icons/RegistrarIcons/RecordsTblCard';
import { LuUserPlus, LuSearch, LuChevronDown } from "react-icons/lu";

const StudentRecords = () => {
  const students = [
    { lrn: "136676090147", name: "Aliyah Thursday Francisco", level: "Grade 11", status: "Enrolled" },
    { lrn: "136676090147", name: "Sean Andrei Amurao", level: "Grade 11", status: "Enrolled" },
    { lrn: "136676090147", name: "Rafael Ryan Tilacas", level: "Grade 12", status: "Graduated" },
    { lrn: "136676090147", name: "Teodoro Repizo III", level: "Grade 11", status: "Enrolled" },
    { lrn: "136676090147", name: "Rheana Lyn Estero", level: "Grade 11", status: "Enrolled" },
  ];

  const gradeLevels = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={true} />
        
        <main className="p-12 max-w-[1400px] w-full mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-slate-800">Student Records</h1>
            <button className="bg-[#4A1010] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#300a0a] transition-all shadow-md cursor-pointer">
              <LuUserPlus size={20} />
              Register Student
            </button>
          </div>

          <AcadYrGreadeLvlCard>
            <div className="flex items-end justify-between">
              <div className="flex gap-8">
                {/* Academic Year Section */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
                  <div className="dropdown dropdown-bottom w-64 z-50">
                    <div tabIndex={0} role="button" className="bg-[#F1F3F6] p-4 pr-6 rounded-xl flex items-center justify-between text-sm font-bold text-slate-600 cursor-pointer border-none">
                      2023 - 2024 <LuChevronDown size={18} className="ml-2 text-slate-400" />
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu bg-white rounded-box z-[1] w-full p-2 shadow-xl border border-slate-100 mt-1">
                      <li className="hover:text-[#800000]"><a>2024 - 2025</a></li>
                      <li className="hover:text-[#800000]"><a>2023 - 2024</a></li>
                      <li className="hover:text-[#800000]"><a>2022 - 2023</a></li>
                    </ul>
                  </div>
                </div>

                {/* Grade Level Section */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level</label>
                  <div className="dropdown dropdown-bottom w-64 z-50">
                    <div tabIndex={0} role="button" className="bg-[#F1F3F6] p-4 pr-6 rounded-xl flex items-center justify-between text-sm font-bold text-slate-600 cursor-pointer border-none">
                      All Levels <LuChevronDown size={18} className="ml-2 text-slate-400" />
                    </div>
                    <ul tabIndex={0} className="dropdown-content menu bg-white rounded-box z-[1] w-full p-2 shadow-xl border border-slate-100 mt-1 max-h-60 overflow-y-auto custom-scrollbar">
                      <li className="hover:text-[#800000]"><a>All Levels</a></li>
                      {gradeLevels.map((grade) => (
                        <li key={grade} className="hover:text-[#800000]">
                          <a>{grade}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <button className="bg-[#4A1010] text-white px-12 py-3 rounded-xl font-bold hover:bg-[#300a0a] transition-all shadow-md cursor-pointer">
                Apply filter
              </button>
            </div>
          </AcadYrGreadeLvlCard>

          <RecordsTblCard>
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
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">LRN NO.</th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">FULL NAME</th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">YEAR LEVEL</th>
                      <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-5 px-6 text-sm font-bold text-slate-700">{student.lrn}</td>
                        <td className="py-5 px-6 text-sm font-bold text-slate-700">{student.name}</td>
                        <td className="py-5 px-6 text-sm font-bold text-slate-700">{student.level}</td>
                        <td className="py-5 px-6 text-sm font-bold text-slate-700 text-right">{student.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </RecordsTblCard>
        </main>
      </div>
    </div>
  );
};

export default StudentRecords;