import React from 'react'
import EditAcademicSchedCard from '../../icons/AdminIcons/EditAcademicSchedCard'
const EditAcademicSched = () => {
  return (
    <div className="min-h-screen bg-[#F3F4F6] py-12 px-6 md:px-20">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-2 h-10 bg-[#800000]" />
              <h1 className="text-4xl font-bold text-gray-900 leading-none">Academic Schedule</h1>
            </div>
            <p className="text-gray-500 text-sm max-w-md ml-6">
              Configure the critical milestones for the upcoming academic year. These dates will be reflected across the student portal and institutional calendar.
            </p>
          </div>

          <div className="flex gap-4">
            <button className="px-8 py-2.5 bg-slate-500 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all cursor-pointer shadow-md">
              Cancel
            </button>
            <button className="px-8 py-2.5 bg-[#802018] text-white rounded-lg font-semibold hover:bg-[#601812] transition-all cursor-pointer shadow-md">
              Save Changes
            </button>
          </div>
        </div>

        {/* 1st Semester Section */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#800000] uppercase tracking-wider">1st Semester</h2>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Range</span>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 font-medium shadow-sm">
                August - December 2025
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <EditAcademicSchedCard eventName="Start of Classes" dateRange="Aug 14, 2024" />
            <EditAcademicSchedCard eventName="Mid-term Exams" dateRange="Oct 16-18, 2024" />
            <EditAcademicSchedCard eventName="Final Exams" dateRange="Dec 11-13, 2024" />
            <EditAcademicSchedCard eventName="Semestral Break" dateRange="Dec 16 - Jan 5, 2024" />
          </div>
        </section>

        {/* 2nd Semester Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[#800000] uppercase tracking-wider">2nd Semester</h2>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Range</span>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 font-medium shadow-sm">
                January - June 2026
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <EditAcademicSchedCard eventName="Resumption of Classes" dateRange="Jan 6, 2024" />
            <EditAcademicSchedCard eventName="Mid-term Exams" dateRange="Mar 12-14, 2024" />
            <EditAcademicSchedCard eventName="Final Exams" dateRange="May 21-23, 2024" />
            <EditAcademicSchedCard eventName="Commencement Exercises" dateRange="June 4-6, 2024" />
          </div>
        </section>

      </div>
    </div>
  )
}

export default EditAcademicSched