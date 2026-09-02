const AcadSchedEventCard = ({ children }) => {
  return (
    <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl p-8 shadow-sm">
      <div className="relative mb-10">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Academic Schedule</h2>
        <div className="absolute -bottom-2 left-0 w-12 h-1 bg-[#800000]"></div>
      </div>
      {children}
    </div>
  )
}

export default AcadSchedEventCard