import { IoClose } from "react-icons/io5";
import { HiOutlineSpeakerphone } from "react-icons/hi";
import { formatEventDate } from '../../../lib/content';

const AnnouncementsModal = ({ isOpen, onClose, announcements }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <div className="flex items-center gap-2 p-6 border-b border-gray-100 shrink-0">
          <HiOutlineSpeakerphone className="text-[#800000]" size={22} />
          <h2 className="text-lg font-bold text-slate-800">All Announcements</h2>
          <button
            onClick={onClose}
            className="ml-auto bg-gray-100 p-2 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <IoClose size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {(announcements || []).map((a) => (
            <div key={a.id} className="border-l-4 border-[#800000] pl-4 py-1">
              <div className="flex justify-between items-baseline gap-3">
                <h3 className="font-bold text-slate-800 text-sm">{a.title || 'Announcement'}</h3>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{a.date ? formatEventDate(a.date) : ''}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsModal;
