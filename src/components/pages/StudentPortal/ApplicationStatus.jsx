// Applicant status page — inside the student portal frame (sidebar + header).
// Reads the signed-in student's real application and shows the tracker.
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import StudentSidebar from '../../StudentSidebar';
import Header from '../../Header';
import { getMyApplication, APP_STEPS, STATUS_LABEL } from '../../../lib/student';
import { CardSkeleton } from '../../Skeleton';
import ChatbotWidget from '../../ChatbotWidget';

const ApplicationStatus = () => {
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);

  useEffect(() => { getMyApplication().then((a) => { setApp(a); setLoading(false); }); }, []);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <StudentSidebar activePage="Application Status" />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="p-8 md:p-12 max-w-[1100px] w-full">
          {loading && <div className="space-y-6"><CardSkeleton lines={1} /><CardSkeleton lines={3} /></div>}

          {!loading && !app && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-2">No application yet</h3>
              <p className="text-slate-500 mb-6">You don't have an admission application on file.</p>
              <NavLink to="/StudentPortal/Apply" className="inline-block px-6 py-3 bg-[#800000] text-white rounded-lg font-bold">Apply Now</NavLink>
            </div>
          )}

          {!loading && app && <StatusBody app={app} />}
        </main>
      </div>
      <ChatbotWidget
        context={
          app
            ? `The user is an enrolled/applicant student viewing their Application Status page. Their current application status is "${STATUS_LABEL[app.status] || app.status}" for ${app.grade_level || ''} (S.Y. ${app.school_year || ''}).`
            : 'The user is on their Application Status page but has no application on file yet.'
        }
      />
    </div>
  );
};

const StatusBody = ({ app }) => {
  const rejected = app.status === 'rejected';
  const needsFix = app.status === 'needs_correction';
  const enrolled = app.status === 'enrolled';
  // A corrected + resubmitted application re-enters review — show it as "Under
  // Review" to the applicant (not back at "Submitted").
  const resubmitted = app.status === 'submitted' && app.form?.resubmitted;
  const displayStatus = resubmitted ? 'under_review' : app.status;
  const activeIdx = APP_STEPS.findIndex((s) => s.key === (needsFix ? 'submitted' : displayStatus));
  const name = `${app.form?.firstName || ''} ${app.form?.lastName || ''}`.trim() || 'Applicant';

  return (
    <>
      <div className="flex flex-wrap justify-between items-start gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Application Status</h1>
          <p className="text-slate-500 mt-1">{name} · {app.grade_level} · {app.student_type} · S.Y. {app.school_year}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Application ID</p>
          <p className="text-xs font-mono text-slate-600">{app.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div className={`rounded-2xl p-5 mb-8 border ${enrolled ? 'bg-emerald-50 border-emerald-200' : rejected ? 'bg-red-50 border-red-200' : needsFix ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Current Status</p>
        <p className={`text-2xl font-bold ${enrolled ? 'text-emerald-700' : rejected ? 'text-red-700' : needsFix ? 'text-amber-700' : 'text-[#800000]'}`}>{STATUS_LABEL[displayStatus]}</p>
        {enrolled && app.student_no && <p className="text-sm text-emerald-700 mt-1">🎓 Student Number: <b>{app.student_no}</b></p>}
      </div>

      {!rejected && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-8">
          <div className="flex items-center justify-between">
            {APP_STEPS.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center text-center flex-1">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${i <= activeIdx ? 'bg-[#800000] text-white' : 'bg-slate-100 text-slate-400'}`}>{i < activeIdx || enrolled ? '✓' : i + 1}</div>
                  <p className={`mt-2 text-xs font-semibold ${i <= activeIdx ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</p>
                </div>
                {i < APP_STEPS.length - 1 && <div className={`h-1 flex-1 rounded ${i < activeIdx ? 'bg-[#800000]' : 'bg-slate-100'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {(needsFix || rejected || app.review_note) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h3 className="font-bold text-slate-800 mb-2">Note from the Registrar</h3>
          <p className="text-sm text-slate-600">{app.review_note || (needsFix ? 'Please review and resubmit your application.' : 'Thank you for applying.')}</p>
          {needsFix && <NavLink to="/StudentPortal/EnrollmentForm" className="inline-block mt-4 px-5 py-2 bg-[#800000] text-white rounded-lg text-sm font-bold">Update &amp; Resubmit</NavLink>}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4">What happens next?</h3>
        <ol className="space-y-2 text-sm text-slate-600 list-decimal ml-5">
          <li>The Registrar reviews your admission form and documents.</li>
          <li>You'll be notified here of your interview / requirements schedule.</li>
          <li>Once accepted, your <b>student number</b> is issued and your full portal unlocks.</li>
        </ol>
      </div>
    </>
  );
};

export default ApplicationStatus;
