import React from 'react';
import { LuFileText, LuRotateCcw, LuCheck } from "react-icons/lu";

const TwoxTwoModalCard = () => {
  return (
    <dialog id="two_by_two_modal" className="modal backdrop:backdrop-blur-sm">
      <div className="modal-box max-w-2xl p-0 overflow-hidden bg-[#F8F9FA] rounded-xl shadow-2xl border border-gray-200">
        <div className="p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#800000]">2x2 ID Picture</h3>
          <form method="dialog"><button className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 cursor-pointer">✕</button></form>
        </div>
        <div className="px-8 pb-4">
          <div className="bg-white p-4 border border-gray-100 rounded-sm overflow-y-auto max-h-[60vh] flex justify-center">
            <div className="w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
               <LuFileText size={60} className="text-gray-200" />
            </div>
          </div>
        </div>
        <div className="p-6 flex justify-end gap-3 bg-white/50 border-t border-gray-100">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-full hover:bg-gray-50 cursor-pointer">
            <LuRotateCcw size={16} /> Ask for Correction
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#401010] text-white text-xs font-bold rounded-full hover:bg-[#2d0b0b] cursor-pointer shadow-md">
            <LuCheck size={18} /> Approve Document
          </button>
        </div>
      </div>
    </dialog>
  );
};
export default TwoxTwoModalCard;