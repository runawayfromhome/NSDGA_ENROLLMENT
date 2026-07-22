import React, { useState } from 'react';
import Header from '../../Header';
import RegistrarSidebar from '../../RegistrarSidebar';
import Input from '../../form/Input';
import RegistrarChangePassCard from '../../icons/RegistrarIcons/RegistrarChangePassCard';
import RegistrarPassInfoCard from '../../icons/RegistrarIcons/RegistrarInfoPassCard';
import ModalCardPass from '../../icons/StudentPortalIcons/ModalCardPass';
import { HiOutlineEye, HiOutlineEyeOff, HiSave, HiOutlineInformationCircle } from "react-icons/hi";

const RegistrarSettings = () => {
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const handleSave = () => {
        // Trigger the DaisyUI modal by ID
        document.getElementById('password_success_modal').showModal();
    };

    return (
        <div className="flex min-h-screen bg-[#F8F9FA]">
            <RegistrarSidebar />
            
            <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
                <Header showSearch={true} />

                <main className="p-12 max-w-[1200px] w-full">
                    <h1 className="text-3xl font-bold text-slate-800 mb-10">Account Settings & Security</h1>

                    <div className="flex flex-col lg:flex-row items-start gap-8">
                        {/* Main Change Password Section */}
                        <div className="flex-1 w-full max-w-2xl">
                            <RegistrarChangePassCard>
                                <div className="p-10">
                                    <h2 className="text-2xl font-extrabold text-[#800000] mb-8 text-left">
                                        Change Password
                                    </h2>

                                    <div className="space-y-6">
                                        <Input 
                                            label="CURRENT PASSWORD" 
                                            type={showCurrent ? "text" : "password"}
                                            placeholder="••••••••••••"
                                            rightElement={
                                                <button onClick={() => setShowCurrent(!showCurrent)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                                    {showCurrent ? <HiOutlineEye size={20} /> : <HiOutlineEyeOff size={20} />}
                                                </button>
                                            }
                                        />

                                        <div className="space-y-3">
                                            <Input 
                                                label="NEW PASSWORD" 
                                                type={showNew ? "text" : "password"}
                                                placeholder="Enter your new password"
                                                rightElement={
                                                    <button onClick={() => setShowNew(!showNew)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                                        {showNew ? <HiOutlineEye size={20} /> : <HiOutlineEyeOff size={20} />}
                                                    </button>
                                                }
                                            />
                                            
                                            <div className="pt-1 px-1 text-left">
                                                <p className="text-[12px] font-bold text-slate-600 mb-2">
                                                    Please add all the necessary characters to create a safe password
                                                </p>
                                                <ul className="space-y-1 text-[11px] text-slate-500 font-medium">
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-[#800000]">•</span>
                                                        <span className="text-[#800000] font-bold">Minimum characters 12</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-[#800000]">•</span>
                                                        <span>Mixed uppercase and lowercase character</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-[#800000]">•</span>
                                                        <span>One special character</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="text-[#800000]">•</span>
                                                        <span>One number</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                        <Input 
                                            label="CONFIRM NEW PASSWORD" 
                                            type="password"
                                            placeholder="Repeat your new password"
                                        />

                                        <div className="pt-4 flex justify-end">
                                            <button 
                                                onClick={handleSave}
                                                className="bg-[#800000] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#600000] transition-all shadow-lg shadow-red-900/20 text-sm cursor-pointer"
                                            >
                                                <HiSave size={18} />
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </RegistrarChangePassCard>
                        </div>

                        {/* Info Card Section */}
                        <div className="w-full lg:w-80 mt-10 lg:mt-32">
                            <RegistrarPassInfoCard>
                                <div className="p-6 flex gap-4 bg-[#F1F5F9]/50 rounded-xl border border-slate-100">
                                    <HiOutlineInformationCircle className="text-blue-800 shrink-0" size={24} />
                                    <p className="text-[12px] text-slate-600 leading-relaxed">
                                        Last password change was <span className="font-bold text-slate-800">42 days ago</span>. We recommend updating your credentials every 90 days for optimal security in accordance with the <span className="underline cursor-pointer">Academic Integrity Protocol</span>.
                                    </p>
                                </div>
                            </RegistrarPassInfoCard>
                        </div>
                    </div>

                    <footer className="mt-20 text-center w-full max-w-2xl">
                        <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                            © 2026 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
                        </p>
                    </footer>
                </main>
            </div>

            {/* Success Modal */}
            <ModalCardPass />
        </div>
    );
};

export default RegistrarSettings;