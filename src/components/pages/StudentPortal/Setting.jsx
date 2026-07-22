import React, { useState } from 'react';
import Sidebar from '../../Sidebar';
import Header from '../../Header';
import ChangePassCard from '../../icons/StudentPortalIcons/ChangePassCard';
import ModalCardPass from '../../icons/StudentPortalIcons/ModalCardPass';
import Input from '../../form/Input';
import { HiOutlineEye, HiOutlineEyeOff, HiSave } from "react-icons/hi";

const Setting = () => {
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        const modal = document.getElementById('password_success_modal');
        if (modal) {
            modal.showModal();
        }
    };  

    return (
        <div className="flex min-h-screen bg-slate-50/30">
            <Sidebar />
            
            <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
                <Header title="Settings" showSearch={false} showProfile={false} />

                <main className="flex-1 p-12 flex flex-col items-center">
                    <div className="w-full max-w-xl">
                        <ChangePassCard>
                            <div className="p-10">
                                <h2 className="text-2xl font-extrabold text-[#800000] mb-8 text-center">
                                    Change Password
                                </h2>

                                <div className="space-y-6">
                                    {/* Current Password - Placeholder added */}
                                    <Input 
                                        label="CURRENT PASSWORD" 
                                        type={showCurrent ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        defaultValue="secretpassword123"
                                        rightElement={
                                            <button onClick={() => setShowCurrent(!showCurrent)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                                {showCurrent ? <HiOutlineEye size={20} /> : <HiOutlineEyeOff size={20} />}
                                            </button>
                                        }
                                    />

                                    <div className="space-y-3">
                                        {/* New Password - Placeholder added */}
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
                                        
                                        <div className="pt-1 px-1">
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

                                    {/* Confirm Password - Placeholder added */}
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
                        </ChangePassCard>

                        <footer className="mt-12 text-center">
                            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                                © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
                            </p>
                        </footer>
                    </div>
                </main>
            </div>

            <ModalCardPass />
        </div>
    );
};

export default Setting;