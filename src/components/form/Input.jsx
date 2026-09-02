const Input = ({ label, type, placeholder, name, defaultValue, icon, rightElement }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block font-semibold text-sm text-gray-700 mb-2 text-left">
                    {label}
                </label>
            )}
            
            <div className="relative w-full flex items-center">
                {/* Left Icon Container */}
                {icon && (
                    <div className="absolute left-4 z-10 flex items-center justify-center pointer-events-none">
                        {icon}
                    </div>
                )}
                
                <input
                    name={name}
                    type={type}
                    className={`
                        input input-bordered w-full h-12 bg-white border-gray-200 
                        focus:border-[#800000] focus:outline-none transition-all
                        ${icon ? 'pl-14' : 'pl-4'} 
                        ${rightElement ? 'pr-12' : 'pr-4'}
                        rounded-xl
                    `}
                    placeholder={placeholder}
                    defaultValue={defaultValue}
                />

                {/* Right Icon Container (Eye) */}
                {rightElement && (
                    <div className="absolute right-4 z-10 flex items-center justify-center">
                        {rightElement}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Input;