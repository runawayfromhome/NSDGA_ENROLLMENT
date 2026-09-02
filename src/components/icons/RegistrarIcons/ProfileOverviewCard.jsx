const ProfileOverviewCard = () => {
  const infoData = [
    { label: "Birthplace", value: "Marikina City, Philippines" },
    { label: "Date of Birth", value: "04/16/2002" },
    { label: "Home Address", value: "123 Juan Dela Cruz St., Sta Elena Marikina City" },
    { label: "Gender", value: "Male" },
    { label: "Contact Number", value: "0912 345 6789" },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-[20px] p-10 shadow-sm">
      <div className="space-y-8">
        {/* Section Title */}
        <h2 className="text-[11px] font-black text-[#800000] uppercase tracking-[0.2em]">
          Personal Information
        </h2>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-10 gap-x-12">
          {infoData.map((item, index) => (
            <div 
              key={index} 
              className={`${item.label === "Home Address" ? "col-span-1" : ""} space-y-1`}
            >
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {item.label}
              </label>
              <p className="text-sm font-bold text-slate-700 leading-relaxed">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileOverviewCard;