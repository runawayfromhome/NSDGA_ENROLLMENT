// Student dashboard — registrar-style layout (sidebar + header + stat cards),
// driven by the student's real records. Shows announcements, a re-enroll prompt
// when a year is completed + the season is open, and enrollment history.
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import StudentSidebar from '../../StudentSidebar';
import Header from '../../Header';
import { getMyApplication, getMyApplications, reEnroll, STATUS_LABEL, APP_STEPS, isEnrolledStatus } from '../../../lib/student';
import { getAnnouncements, getEnrollment, isEnrollmentOpen, formatEventDate } from '../../../lib/content';
import { nextGrade, nextSchoolYear, isSHSGrade, SHS_STRANDS } from '../../../lib/grades';
import { HiOutlineClipboardCheck, HiOutlineAcademicCap, HiOutlineIdentification, HiOutlineSpeakerphone, HiOutlineArrowCircleUp, HiOutlineClock, HiOutlineUserGroup } from "react-icons/hi";
import { StatCardsSkeleton, CardSkeleton } from '../../Skeleton';

const STATUS_TONE = {
  submitted: 'text-[#9A9E4C]', under_review: 'text-blue-600', needs_correction: 'text-amber-600',
  enrolled: 'text-emerald-600', rejected: 'text-red-600', completed: 'text-teal-600',
  withdrawn: 'text-orange-600', graduated: 'text-indigo-600', archived: 'text-slate-500',
};
const HIST_BADGE = {
  enrolled: 'bg-emerald-50 text-emerald-600', completed: 'bg-teal-50 text-teal-600',
  submitted: 'bg-[#F2F6D0] text-[#9A9E4C]', under_review: 'bg-blue-50 text-blue-600',
  needs_correction: 'bg-amber-50 text-amber-700', rejected: 'bg-gray-100 text-gray-500',
  withdrawn: 'bg-orange-50 text-orange-600', graduated: 'bg-indigo-50 text-indigo-600', archived: 'bg-slate-100 text-slate-500',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [app, setApp] = useState(undefined);
  const [history, setHistory] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [enr, setEnr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [strand, setStrand] = useState('');

  useEffect(() => {
    // Defense-in-depth: the full dashboard is for enrolled students. A first-time
    // applicant is bounced to their applicant status page — but a CONTINUING
    // student whose re-enrollment is under review stays here (they were enrolled
    // before), so they don't lose the portal while the Registrar reviews it.
    (async () => {
      const [a, hist] = await Promise.all([getMyApplication(), getMyApplications()]);
      const hasHistory = (hist || []).some((x) => ['enrolled', 'completed'].includes(x.status));
      const inReview = a && ['submitted', 'under_review', 'needs_correction'].includes(a.status);
      if (a && !isEnrolledStatus(a.status) && !(inReview && hasHistory)) {
        navigate('/StudentPortal/ApplicationStatus', { replace: true }); return;
      }
      setApp(a); setHistory(hist);
    })();
    getAnnouncements().then(setAnnouncements);
    getEnrollment().then(setEnr);
  }, []);

  const enrolled = app?.status === 'enrolled';
  // A returning student's re-enrollment that's still being reviewed.
  const reenrolling = !!app && ['submitted', 'under_review', 'needs_correction'].includes(app.status)
    && history.some((a) => ['enrolled', 'completed'].includes(a.status));
  const activeIdx = app ? APP_STEPS.findIndex((s) => s.key === (app.status === 'needs_correction' ? 'submitted' : app.status)) : -1;
  const name = app ? `${app.form?.firstName || ''} ${app.form?.lastName || ''}`.trim() : 'Student';
  const gradeText = app ? (app.form?.grade || app.grade_level) : '';

  const ng = app?.status === 'completed' ? nextGrade(app.form?.grade) : null;
  const seasonOpen = enr ? isEnrollmentOpen(enr) : false;
  const canReEnroll = app?.status === 'completed' && ng && seasonOpen;
  // Moving into Senior High requires picking a strand (unless one already exists).
  const needsStrand = !!ng && isSHSGrade(ng) && !app?.form?.strand;

  const doReEnroll = async () => {
    if (needsStrand && !strand) return;
    setBusy(true);
    const res = await reEnroll(app, strand);
    setBusy(false);
    if (res.ok) navigate('/StudentPortal/ApplicationStatus');
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <StudentSidebar activePage="Dashboard" />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="p-8 md:p-12 max-w-[1400px]">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Welcome{app ? `, ${name}` : ''}!</h1>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
              {app ? `${gradeText}${app.form?.sectionApproved && app.form?.section ? ` · Section ${app.form.section}` : ''} · S.Y. ${app.school_year}` : 'Student Overview'}
            </p>
          </div>

          {/* Re-enrollment under review (continuing student) */}
          {reenrolling && (
            <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-6 mb-8 flex items-center gap-4">
              <HiOutlineClock className="text-blue-600 shrink-0" size={30} />
              <div>
                <p className="font-bold text-blue-800">Re-enrollment under review</p>
                <p className="text-sm text-blue-700 mt-0.5">Your application for <b>{gradeText}</b> (S.Y. {app.school_year}) is being reviewed by the Registrar. You'll be assigned to your new class once it's approved.</p>
              </div>
            </div>
          )}

          {/* Re-enroll prompt */}
          {canReEnroll && (
            <div className="rounded-2xl border-2 border-[#800000] bg-[#800000]/5 p-6 mb-8 flex flex-wrap items-center gap-4">
              <HiOutlineArrowCircleUp className="text-[#800000]" size={34} />
              <div className="flex-1 min-w-[220px]">
                <p className="font-bold text-[#800000]">Re-enrollment is open for S.Y. {nextSchoolYear(app.school_year)}</p>
                <p className="text-sm text-slate-600 mt-0.5">You've completed {app.form?.grade || app.grade_level}. Re-enroll for <b>{ng}</b>.</p>
                {needsStrand && <p className="text-[12px] text-slate-500 mt-2">Senior High requires a strand — choose one to continue.</p>}
              </div>
              {needsStrand && (
                <select value={strand} onChange={(e) => setStrand(e.target.value)} className="px-4 py-3 bg-white border border-[#800000]/30 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-[#800000]">
                  <option value="">Select strand…</option>
                  {SHS_STRANDS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <button onClick={doReEnroll} disabled={busy || (needsStrand && !strand)} className="px-6 py-3 bg-[#800000] hover:bg-[#600000] text-white rounded-xl font-bold shadow disabled:opacity-60">{busy ? 'Submitting…' : `Re-enroll for ${ng}`}</button>
            </div>
          )}
          {app?.status === 'completed' && ng && !seasonOpen && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mb-8 flex items-center gap-3">
              <HiOutlineClock className="text-amber-600" size={26} />
              <p className="text-sm text-amber-800">You've completed {app.form?.grade || app.grade_level}. Re-enrollment for <b>{ng}</b> opens when the school announces the next enrollment season.</p>
            </div>
          )}

          {/* Announcements */}
          {announcements.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineSpeakerphone className="text-[#800000]" size={22} />
                <h2 className="text-lg font-bold text-slate-800">Announcements</h2>
              </div>
              <div className="space-y-4">
                {announcements.map((a) => (
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
          )}

          {app === undefined && <><StatCardsSkeleton count={3} /><CardSkeleton className="mt-8" lines={2} /></>}

          {app === null && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-2">No application yet</h3>
              <p className="text-slate-500 mb-6">You don't have an admission application on file.</p>
              <NavLink to="/StudentPortal/Apply" className="inline-block px-6 py-3 bg-[#800000] text-white rounded-lg font-bold">Apply Now</NavLink>
            </div>
          )}

          {app && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card icon={HiOutlineClipboardCheck} label="Current Status" value={STATUS_LABEL[app.status]} tone={STATUS_TONE[app.status]} onClick={() => navigate('/StudentPortal/ApplicationStatus')} />
                <Card icon={HiOutlineIdentification} label="Student Number" value={app.student_no || '—'} tone={app.student_no ? 'text-emerald-600' : 'text-slate-300'} />
                <Card icon={HiOutlineAcademicCap} label="Grade / Program" value={app.form?.strand ? `${gradeText} · ${app.form.strand}` : gradeText} tone="text-slate-800" small />
              </div>

              {!['completed', 'rejected', 'withdrawn', 'graduated', 'archived'].includes(app.status) && (
                <>
                  <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Admission Progress</h2>
                    <NavLink to="/StudentPortal/ApplicationStatus" className="text-[#800000] font-bold text-sm flex items-center gap-2 hover:opacity-70">View Details <span className="text-lg">→</span></NavLink>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-10">
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
                    {app.review_note && <p className="mt-6 text-sm text-slate-500 border-t border-gray-100 pt-4"><b>Note from the Registrar:</b> {app.review_note}</p>}
                  </div>
                </>
              )}

              {/* My class (once the section is approved) */}
              {app.form?.sectionApproved && app.form?.section && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-10">
                  <div className="flex items-center gap-2 mb-3">
                    <HiOutlineUserGroup className="text-[#800000]" size={22} />
                    <h2 className="text-lg font-bold text-slate-800">My Class — {app.form.section}</h2>
                  </div>
                  {app.form.classmates?.length > 0 && (
                    <>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Classmates ({app.form.classmates.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {app.form.classmates.map((n, i) => <span key={i} className="text-xs font-semibold bg-slate-100 text-slate-600 rounded-full px-3 py-1.5">{n}</span>)}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Enrollment history */}
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Enrollment history</h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{h.form?.grade || h.grade_level}{h.student_no ? ` · No. ${h.student_no}` : ''}</p>
                      <p className="text-[12px] text-slate-400">S.Y. {h.school_year} · {h.student_type}</p>
                    </div>
                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black ${HIST_BADGE[h.status] || 'bg-slate-100 text-slate-500'}`}>{(STATUS_LABEL[h.status] || h.status).toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

const Card = ({ icon: Icon, label, value, tone, onClick, small }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
    <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center shrink-0"><Icon className="text-[#800000]" size={28} /></div>
    <div className="min-w-0">
      <h3 className={`font-black text-slate-800 truncate ${small ? 'text-xl' : 'text-2xl'} ${tone || ''}`}>{value}</h3>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  </div>
);

export default Dashboard;
