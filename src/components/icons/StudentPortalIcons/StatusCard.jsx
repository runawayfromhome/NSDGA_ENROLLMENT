const StatusCard = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-12 mb-6 shadow-sm flex flex-col justify-center min-h-[220px]">
      <div className="relative w-full px-4">
        {/* Continuous Background Line (Full width) */}
        <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-100"></div>
        
        {/* Progress Line (Matching your 3rd step status) */}
        <div className="absolute top-5 left-0 w-[66%] h-[2px] bg-slate-800"></div>

        <div className="relative flex justify-between w-full">
          {/* Step 1: Form Submitted */}
          <div className="flex flex-col items-center">
            <CheckIcon active />
            <div className="mt-5 text-center">
              <p className="text-sm font-bold text-slate-800">Form Submitted</p>
              <p className="text-[11px] text-slate-400 mt-1">Oct 12, 2023</p>
            </div>
          </div>

          {/* Step 2: Documents */}
          <div className="flex flex-col items-center">
            <CheckIcon active />
            <div className="mt-5 text-center">
              <p className="text-sm font-bold text-slate-800">Documents</p>
              <p className="text-[11px] text-slate-400 mt-1">Oct 15, 2023</p>
            </div>
          </div>

          {/* Step 3: Registrar Review */}
          <div className="flex flex-col items-center">
            <ProgressIcon />
            <div className="mt-5 text-center">
              <p className="text-sm font-bold text-slate-800">Registrar Review</p>
              <p className="text-[11px] text-blue-500 font-bold mt-1 uppercase tracking-tighter">In Progress</p>
            </div>
          </div>

          {/* Step 4: Admission */}
          <div className="flex flex-col items-center opacity-40">
            <ProgressIcon />
            <div className="mt-5 text-center">
              <p className="text-sm font-bold text-slate-800">Admission</p>
              <p className="text-[11px] text-slate-400 mt-1">Pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckIcon = ({ active }) => (
  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shadow-lg shadow-green-900/10 ${active ? 'bg-[#5FC36B]' : 'bg-slate-200'}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="h-5 w-5">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  </div>
);

const ProgressIcon = () => (
  <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center z-10 shadow-sm">
    <span className="text-slate-400 text-sm">⌛</span>
  </div>
);

export default StatusCard;