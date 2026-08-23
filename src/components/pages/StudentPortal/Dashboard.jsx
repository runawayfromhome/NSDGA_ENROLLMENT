// Student dashboard — registrar-style layout (sidebar + header + stat cards),
// driven by the student's real application.
import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import StudentSidebar from '../../StudentSidebar';
import Header from '../../Header';
import { getMyApplication, STATUS_LABEL, APP_STEPS } from '../../../lib/student';
import { getAnnouncements, formatEventDate } from '../../../lib/content';
import { HiOutlineClipboardCheck, HiOutlineAcademicCap, HiOutlineIdentification, HiOutlineSpeakerphone } from "react-icons/hi";

const STATUS_TONE = {
  submitted: 'text-[#9A9E4C]', under_review: 'text-blue-600',
  needs_correction: 'text-amber-600', enrolled: 'text-emerald-600', rejected: 'text-red-600',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [app, setApp] = useState(undefined); // undefined = loading, null = none
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => { getMyApplication().then((a) => setApp(a)); getAnnouncements().then(setAnnouncements); }, []);

  const enrolled = app?.status === 'enrolled';
  const activeIdx = app ? APP_STEPS.findIndex((s) => s.key === (app.status === 'needs_correction' ? 'submitted' : app.status)) : -1;
  const name = app ? `${app.form?.firstName || ''} ${app.form?.lastName || ''}`.trim() : 'Student';

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <StudentSidebar activePage="Dashboard" />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="p-8 md:p-12 max-w-[1400px]">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Welcome{app ? `, ${name}` : ''}!</h1>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
              {app ? `${app.grade_level} · S.Y. ${app.school_year}` : 'Student Overview'}
            </p>
          </div>

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

          {app === undefined && <p className="text-slate-400 text-sm">Loading…</p>}

          {app === null && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-2">No application yet</h3>
              <p className="text-slate-500 mb-6">You don't have an admission application on file.</p>
              <NavLink to="/StudentPortal/Apply" className="inline-block px-6 py-3 bg-[#800000] text-white rounded-lg font-bold">Apply Now</NavLink>
            </div>
          )}

          {app && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card icon={HiOutlineClipboardCheck} label="Application Status"
                  value={STATUS_LABEL[app.status]} tone={STATUS_TONE[app.status]}
                  onClick={() => navigate('/StudentPortal/ApplicationStatus')} />
                <Card icon={HiOutlineIdentification} label="Student Number"
                  value={enrolled && app.student_no ? app.student_no : '—'}
                  tone={enrolled ? 'text-emerald-600' : 'text-slate-300'} />
                <Card icon={HiOutlineAcademicCap} label="Grade / Program"
                  value={app.form?.strand ? `${app.grade_level} · ${app.form.strand}` : app.grade_level}
                  tone="text-slate-800" small />
              </div>

              <div className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Admission Progress</h2>
                <NavLink to="/StudentPortal/ApplicationStatus" className="text-[#800000] font-bold text-sm flex items-center gap-2 hover:opacity-70">
                  View Details <span className="text-lg">→</span>
                </NavLink>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                {app.status === 'rejected' ? (
                  <p className="text-red-600 font-semibold">This application was not accepted. {app.review_note}</p>
                ) : (
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
                )}
                {app.review_note && app.status !== 'rejected' && (
                  <p className="mt-6 text-sm text-slate-500 border-t border-gray-100 pt-4"><b>Note from the Registrar:</b> {app.review_note}</p>
                )}
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
    <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
      <Icon className="text-[#800000]" size={28} />
    </div>
    <div className="min-w-0">
      <h3 className={`font-black text-slate-800 truncate ${small ? 'text-xl' : 'text-2xl'} ${tone || ''}`}>{value}</h3>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  </div>
);

export default Dashboard;
