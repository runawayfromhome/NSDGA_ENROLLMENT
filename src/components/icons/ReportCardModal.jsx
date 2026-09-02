import { LuFileText, LuRotateCcw, LuCheck } from "react-icons/lu";

const ReportCardModal = () => {
  return (
    <dialog id="report_card_modal" className="modal backdrop:backdrop-blur-sm">
      <div className="modal-box max-w-2xl p-0 overflow-hidden bg-[#F8F9FA] rounded-xl shadow-2xl border border-gray-200">
        <div className="p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#800000]">Report Card (Form 138)</h3>
          <form method="dialog">
            <button className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600 transition-colors cursor-pointer">
              ✕
            </button>
          </form>
        </div>

        <div className="px-8 pb-4">
          <div className="bg-white p-4 shadow-sm border border-gray-100 rounded-sm overflow-y-auto max-h-[65vh]">
            <div className="w-full flex justify-center bg-gray-50 min-h-[400px]">
                <LuFileText size={100} className="text-gray-200 self-center" />
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4 bg-white">
          <div className="flex justify-end gap-3">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-full hover:bg-gray-50 transition-all cursor-pointer">
              <LuRotateCcw size={16} /> Ask for Correction
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#401010] text-white text-xs font-bold rounded-full hover:bg-[#2d0b0b] transition-all cursor-pointer shadow-md">
              <LuCheck size={18} /> Approve Document
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
};

export default ReportCardModal;