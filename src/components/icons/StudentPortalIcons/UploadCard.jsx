const UploadCard = ({ icon, title, subtitle, isBlue }) => {
  return (
    <div className={`
      card border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:shadow-md group
      ${isBlue 
        ? 'border-blue-200 bg-[#f8fbff] hover:bg-blue-50' 
        : 'border-gray-200 bg-gray-50/40 hover:bg-gray-50' 
      }
    `}>
      {/* Icon Area */}
      <div className="mb-3 transition-transform group-hover:scale-105 duration-200">
        {icon}
      </div>

      {/* Text Area */}
      <div className="flex flex-col items-center mb-5">
        <h3 className="text-[13px] font-bold text-slate-700 mb-1">
          {title}
        </h3>
        <p className="text-[10px] text-gray-400 leading-tight max-w-[170px]">
          {subtitle}
        </p>
      </div>

      {/* Button - Exactly as per Screen Shot 2026-05-01 at 2.21.30 PM.png */}
      <div className={`
        px-6 py-1.5 rounded-lg text-[11px] font-bold transition-all
        ${isBlue 
          ? 'bg-[#f0f7ff] border border-blue-100 text-blue-400' 
          : 'bg-[#f0f4f8] text-slate-600'
        }
      `}>
        {isBlue ? 'Optional' : 'Upload File'}
      </div>
    </div>
  );
};

export default UploadCard;