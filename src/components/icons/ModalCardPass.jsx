import { HiCheck } from "react-icons/hi";

const ModalCardPass = () => {
  return (
    <dialog id="password_success_modal" className="modal backdrop:backdrop-blur-sm">
      <div className="modal-box max-w-md p-0 overflow-hidden bg-[#f8fafc] rounded-[2rem] shadow-2xl border border-white">
        
        {/* Close Button Container */}
        <div className="flex justify-end p-6">
          <form method="dialog">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-200 transition-all cursor-pointer">
              ✕
            </button>
          </form>
        </div>

        <div className="px-10 pb-12 text-center flex flex-col items-center">
          {/* Green Check Icon Circle */}
          <div className="w-20 h-20 rounded-full border-2 border-green-500 flex items-center justify-center mb-6">
            <HiCheck className="text-green-500" size={40} />
          </div>

          {/* Text Content */}
          <h3 className="text-2xl font-bold text-green-700 mb-4 tracking-tight">
            Password Changed
          </h3>
          
          <p className="text-[15px] text-slate-600 leading-relaxed font-medium">
            You have successfully changed your account password. You can now use your new password to sign in to your account.
          </p>
        </div>
      </div>
    </dialog>
  );
};

export default ModalCardPass;