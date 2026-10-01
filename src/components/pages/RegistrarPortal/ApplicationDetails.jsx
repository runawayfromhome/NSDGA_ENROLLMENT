import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import { IoChevronBack } from "react-icons/io5";
import PersonalInfoCard from '../../icons/PersonalInfoCard';
import AcadsBackgroundCard from '../../icons/AcadsBackgroundCard';
import AdditionalNotesCard from '../../icons/AdditionalNotesCard';
import {
  getApplication, applicantName, APP_DISPLAY,
  enrollApplication, returnForCorrection, rejectApplication, setUnderReview,
  setDocumentStatus,
} from '../../../lib/registrar';
import { REQUIRED_DOCS, DOC_STATUS_STYLE, signedDocUrl } from '../../../lib/student';
import { CardSkeleton } from '../../Skeleton';
import { useMfaLock } from '../../MfaLock';

const ageFrom = (dob) => {
  if (!dob) return '—';
  const d = new Date(dob); if (isNaN(d)) return '—';
  const t = new Date(); let a = t.getFullYear() - d.getFullYear();
  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
  return String(a);
};

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const { locked, banner } = useMfaLock('/RegistrarPortal/Settings');

  const load = async () => { const a = await getApplication(id); setApp(a); setNote(a?.review_note || ''); setLoading(false); };
  useEffect(() => { load(); }, [id]);

  const run = async (fn, okMsg) => {
    setBusy(true); setMsg('');
    const res = await fn();
    setBusy(false);
    if (!res.ok) { setMsg('⚠️ ' + (res.error || 'Action failed.')); return; }
    setMsg(res.student_no ? `✓ Enrolled — Student No. ${res.student_no}` : '✓ ' + okMsg);
    await load();
  };

  const viewDoc = async (path) => { const url = await signedDocUrl(path); if (url) window.open(url, '_blank'); };
  const setDoc = async (key, status) => { const r = await setDocumentStatus(app, key, status); if (r.ok) await load(); else setMsg('⚠️ ' + (r.error || 'Failed.')); };

  if (loading) return <Frame><div className="p-8 md:p-12 max-w-[1200px] mx-auto w-full space-y-6"><CardSkeleton lines={4} /><CardSkeleton lines={3} /></div></Frame>;
  if (!app) return <Frame><div className="p-12"><p className="text-slate-500">Application not found.</p><button onClick={() => navigate('/RegistrarPortal/Applications')} className="mt-4 text-[#800000] font-bold">← Back to Applications</button></div></Frame>;

  const f = app.form || {};
  const style = APP_DISPLAY[app.status] || APP_DISPLAY.submitted;
  const isEnrolled = app.status === 'enrolled';
  const isDeprov = ['withdrawn', 'graduated', 'archived'].includes(app.status);
  const isCompleted = app.status === 'completed';
  const closed = isEnrolled || isDeprov || isCompleted || app.status === 'rejected';
  const fullName = applicantName(app);

  return (
    <Frame>
      <main className="p-12 max-w-[1200px] mx-auto w-full space-y-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/RegistrarPortal/Applications')} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"><IoChevronBack size={24} /></button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{fullName}</h1>
              <p className="text-slate-500 font-medium">{app.id.slice(0, 8).toUpperCase()} • {app.grade_level} • {app.student_type}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-5 py-2 rounded-full text-[10px] font-black tracking-tight ${style.bg} ${style.text}`}>{style.label}</span>
            {app.status === 'enrolled' && app.student_no && <span className="text-sm font-bold text-emerald-700">🎓 Student No. {app.student_no}</span>}
          </div>
        </div>

        {msg && <div className={`rounded-xl px-5 py-3 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}
        {banner}

        <PersonalInfoCard>
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-6">Personal Information</h2>
          <div className="grid grid-cols-3 gap-6">
            <DetailField label="First Name" value={f.firstName} />
            <DetailField label="Middle Name" value={f.middleName} />
            <DetailField label="Last Name" value={f.lastName} />
            <DetailField label="LRN (12-digit)" value={f.lrn} />
            <DetailField label="Sex" value={f.sex} />
            <DetailField label="Age" value={ageFrom(f.dob)} />
            <DetailField label="Date of Birth" value={f.dob} />
            <DetailField label="Birthplace" value={f.birthplace} />
            <DetailField label="Religion" value={f.religion} />
          </div>
          <div className="mt-6"><DetailField label="Home Address" value={f.address} /></div>
          <div className="grid grid-cols-3 gap-6 mt-6">
            <DetailField label="Contact Number" value={f.contact} />
            <DetailField label="Grade Level Applying For" value={app.grade_level} />
            <DetailField label="School Year" value={app.school_year} />
            <DetailField label="Student Type" value={app.student_type} />
            {f.strand && <DetailField label="SHS Strand" value={f.strand} />}
          </div>
        </PersonalInfoCard>

        <PersonalInfoCard>
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-6">Parent / Guardian</h2>
          <div className="grid grid-cols-2 gap-6">
            <DetailField label="Father's Name" value={f.fatherName} />
            <DetailField label="Mother's Name" value={f.motherName} />
            <DetailField label="Guardian's Name" value={f.guardianName} />
            <DetailField label="Guardian's Contact" value={f.guardianContact} />
          </div>
        </PersonalInfoCard>

        <AcadsBackgroundCard>
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-6">Academic Background</h2>
          <div className="grid grid-cols-2 gap-6">
            <DetailField label="Previous School Attended" value={f.lastSchool} />
            <DetailField label="School Address" value={f.lastSchoolAddress} />
            <DetailField label="Last Grade/Year Completed" value={f.lastGrade} />
            <DetailField label="GWA (General Weighted Average)" value={f.gwa} />
          </div>
        </AcadsBackgroundCard>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-6">Uploaded Documents</h2>
          <ul className="space-y-3">
            {REQUIRED_DOCS.map(({ key, label }) => {
              const doc = app.documents?.[key];
              const st = DOC_STATUS_STYLE[doc?.status || 'none'];
              return (
                <li key={key} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">📄</div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-slate-700">{label}</span>
                      {doc?.name && <p className="text-[11px] text-slate-400 truncate">{doc.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${st.cls}`}>{st.label}</span>
                    {doc?.path ? (
                      <>
                        <button onClick={() => viewDoc(doc.path)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black cursor-pointer">VIEW</button>
                        <button disabled={locked} onClick={() => setDoc(key, 'verified')} className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-[10px] font-black cursor-pointer disabled:opacity-40">VERIFY</button>
                        <button disabled={locked} onClick={() => setDoc(key, 'rejected')} className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-black cursor-pointer disabled:opacity-40">REJECT</button>
                      </>
                    ) : <span className="text-[11px] text-slate-400 italic pr-2">not uploaded</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {!closed && (
          <AdditionalNotesCard>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-4">Decision & Notes for Student</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter feedback, requested corrections, or an acceptance note…"
              className="w-full h-28 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/10 text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-2">ⓘ The student sees the status and this note on their portal immediately.</p>
            <div className="flex flex-wrap justify-end gap-3 mt-6">
              {app.status === 'submitted' && (
                <button disabled={busy || locked} onClick={() => run(() => setUnderReview(app.id), 'Marked under review.')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer disabled:opacity-60">Mark Under Review</button>
              )}
              <button disabled={busy || locked} onClick={() => run(() => returnForCorrection(app.id, note), 'Returned for correction.')} className="px-6 py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-bold cursor-pointer disabled:opacity-60">Return for Correction</button>
              <button disabled={busy || locked} onClick={() => run(() => rejectApplication(app.id, note), 'Application rejected.')} className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold cursor-pointer disabled:opacity-60">Reject</button>
              <button disabled={busy || locked} onClick={() => run(() => enrollApplication(app.id, note), 'Enrolled.')} className="px-8 py-3 bg-[#800000] hover:bg-[#600000] text-white rounded-xl font-bold shadow-md cursor-pointer disabled:opacity-60">✓ Approve &amp; Enroll</button>
            </div>
          </AdditionalNotesCard>
        )}

        {closed && (
          <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-2">Decision</h2>
            <p className="text-sm text-slate-600">{app.review_note || '—'}</p>
          </div>
        )}

      </main>
    </Frame>
  );
};

const Frame = ({ children }) => (
  <div className="flex min-h-screen bg-[#F8F9FA]">
    <RegistrarSidebar />
    <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
      <Header showSearch={true} />
      {children}
    </div>
  </div>
);

const DetailField = ({ label, value }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{label}</label>
    <div className="w-full p-3 bg-[#F1F5F9] border border-slate-200 rounded-lg text-slate-700 text-sm font-medium min-h-[42px]">{value || '—'}</div>
  </div>
);

export default ApplicationDetails;
