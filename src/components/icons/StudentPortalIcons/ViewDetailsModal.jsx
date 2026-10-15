import { HiOutlineInformationCircle } from "react-icons/hi";

const ViewDetailsModal = () => {
  return (
    <dialog id="task_details_modal" className="modal backdrop:backdrop-blur-sm">
      <div className="modal-box max-w-2xl p-0 overflow-hidden bg-white rounded-3xl shadow-2xl">
        <div className="p-12 relative">
          <form method="dialog">
            <button className="absolute right-8 top-8 w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors cursor-pointer text-lg">
              ✕
            </button>
          </form>
          
          <div className="flex items-start gap-8">
            <div className="w-14 h-14 rounded-full border border-slate-200 flex items-center justify-center flex-shrink-0">
               <HiOutlineInformationCircle size={28} className="text-slate-700" />
            </div>
            <div className="space-y-6 pt-1">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Task Details</h3>
              <p className="text-[16px] text-slate-600 leading-relaxed text-left">
                Your application is currently being processed by the Office of the Registrar. 
                We are verifying the scanned copies of your submitted documents.
                Expect a response regarding your interview schedule within 3-5 business days. 
                Please ensure your contact details are up to date.
              </p>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button className="cursor-default">close</button>
      </form>
    </dialog>
  );
};

export default ViewDetailsModal;