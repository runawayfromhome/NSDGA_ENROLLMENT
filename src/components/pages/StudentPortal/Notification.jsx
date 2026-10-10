// Student Notifications — consistent portal frame; notifications are derived
// from the student's real application status.
import { useEffect, useState } from 'react';
import StudentSidebar from '../../StudentSidebar';
import Header from '../../Header';
import { HiOutlineExclamationCircle, HiOutlineInformationCircle, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClipboardList } from "react-icons/hi";
import { getMyApplication, REQUIRED_DOCS } from '../../../lib/student';
import { CardSkeleton } from '../../Skeleton';

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3.6e6), d = Math.floor(diff / 8.64e7);
  if (d > 0) return d + (d === 1 ? ' day ago' : ' days ago');
  if (h > 0) return h + (h === 1 ? ' hour ago' : ' hours ago');
  return 'just now';
};

function buildNotifications(app) {
  if (!app) return [];
  const list = [{
    icon: HiOutlineClipboardList, tone: 'text-slate-400',
    title: 'Application received',
    desc: `Your application for ${app.grade_level} (S.Y. ${app.school_year}) was submitted successfully.`,
    time: timeAgo(app.created_at),
  }];
  if (app.status !== 'submitted') {
    const map = {
      under_review: { icon: HiOutlineInformationCircle, tone: 'text-blue-500', title: 'Application under review', desc: 'The Registrar is now reviewing your application.' },
      needs_correction: { icon: HiOutlineExclamationCircle, tone: 'text-amber-500', title: 'Action needed: corrections requested', desc: app.review_note || 'Please review and resubmit your application.' },
      enrolled: { icon: HiOutlineCheckCircle, tone: 'text-emerald-500', title: `Enrolled — Student No. ${app.student_no || ''}`, desc: app.review_note || 'Congratulations! Your enrollment is confirmed.' },
      rejected: { icon: HiOutlineXCircle, tone: 'text-red-500', title: 'Application not accepted', desc: app.review_note || 'Your application was not accepted for this school year.' },
    };
    const n = map[app.status];
    if (n) list.unshift({ ...n, time: timeAgo(app.reviewed_at || app.created_at) });
  }
  // Documents the Registrar returned for re-upload — surface prominently even for
  // an already-enrolled student (their status won't be 'needs_correction').
  const rejectedDocs = app.documents
    ? REQUIRED_DOCS.filter((d) => app.documents[d.key]?.status === 'rejected').map((d) => d.label)
    : [];
  if (rejectedDocs.length) {
    list.unshift({
      icon: HiOutlineExclamationCircle, tone: 'text-red-500',
      title: 'Action needed: re-upload documents',
      desc: `The Registrar returned these for correction: ${rejectedDocs.join(', ')}. Please upload a corrected copy in My Documents.`,
      time: 'recently',
    });
  }
  return list;
}

const PAGE_SIZE = 5; // show this many at a time, then "Load more"

const Notification = () => {
  const [app, setApp] = useState(undefined);
  const [visible, setVisible] = useState(PAGE_SIZE);
  useEffect(() => { getMyApplication().then(setApp); }, []);
  const items = buildNotifications(app);
  const shown = items.slice(0, visible);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <StudentSidebar activePage="Notifications" />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="flex-1 p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
              <p className="text-sm text-gray-500 mt-1">Updates about your admission.</p>
            </div>

            {app === undefined && <CardSkeleton lines={4} />}
            {app === null && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-slate-500">No notifications yet.</div>
            )}

            {app && (
              <>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-2">
                  {shown.map((n, i) => (
                    <div key={i} className={`flex gap-5 p-4 rounded-xl hover:bg-slate-50 transition-all ${i > 0 ? 'border-t border-gray-100 pt-6' : ''}`}>
                      <div className="flex-shrink-0 w-11 h-11 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                        <n.icon size={22} className={n.tone} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-sm font-bold text-slate-800 leading-snug">{n.title}</h4>
                          <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-[13px] text-slate-500 leading-relaxed mt-1">{n.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {items.length > visible && (
                  <div className="mt-5 flex flex-col items-center gap-2">
                    <button onClick={() => setVisible((v) => v + PAGE_SIZE)} className="px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-slate-600 hover:bg-gray-50">
                      Load more
                    </button>
                    <span className="text-[11px] text-slate-400">Showing {shown.length} of {items.length}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Notification;
