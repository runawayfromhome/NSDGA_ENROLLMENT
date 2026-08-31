// Registrar → Student Profile — the PERSON's complete record in one place:
// identity, the selected year's full details + documents, the year-by-year
// history (switch years inline — never bounces to Applications), and the
// student-level lifecycle actions (complete / graduate / withdraw / re-admit).
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import { IoChevronBack } from "react-icons/io5";
import {
  getStudentRecord, applicantName, APP_DISPLAY, setDocumentStatus,
  markCompleted, setLifecycle, reactivateStudent, readmitStudent,
} from '../../../lib/registrar';
import { REQUIRED_DOCS, DOC_STATUS_STYLE, signedDocUrl } from '../../../lib/student';
import { levelOfGrade, ALL_GRADES } from '../../../lib/grades';
import { CardSkeleton } from '../../Skeleton';

const ageFrom = (dob) => {
  if (!dob) return '—';
  const d = new Date(dob); if (isNaN(d)) return '—';
  const t = new Date(); let a = t.getFullYear() - d.getFullYear();
  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
  return String(a);
};

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [viewed, setViewed] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [readmitGrade, setReadmitGrade] = useState('');
  const [readmitYear, setReadmitYear] = useState('');

  const load = async () => {
    const data = await getStudentRecord(studentId);
    setRows(data);
    setViewed((prev) => data.find((r) => r.id === prev?.id) || data[0] || null);
  };
  useEffect(() => { load(); }, [studentId]);

  const run = async (fn, okMsg) => {
    setBusy(true); setMsg('');
    const res = await fn();
    setBusy(false);
    if (!res.ok) { setMsg('⚠️ ' + (res.error || 'Action failed.')); return; }
    setMsg('✓ ' + okMsg); await load();
  };
  const doReadmit = async () => {
    setBusy(true); setMsg('');
    const r = await readmitStudent(current, readmitGrade, readmitYear);
    setBusy(false);
    if (!r.ok) { setMsg('⚠️ ' + (r.error || 'Re-admit failed.')); return; }
    setMsg('✓ Re-admitted at ' + readmitGrade + '. Review it under Applications to enroll.');
    setReadmitGrade(''); setReadmitYear(''); await load();
  };
  const viewDoc = async (path) => { const url = await signedDocUrl(path); if (url) window.open(url, '_blank'); };
  const setDoc = async (key, status) => { const r = await setDocumentStatus(viewed, key, status); if (r.ok) await load(); else setMsg('⚠️ ' + (r.error || 'Failed.')); };

  if (rows === null) return <Frame><div className="p-8 md:p-12 max-w-[1000px] space-y-6"><CardSkeleton lines={2} /><CardSkeleton lines={4} /></div></Frame>;
  if (rows.length === 0) return <Frame><div className="p-12"><p className="text-slate-500">Student record not found.</p><button onClick={() => navigate('/RegistrarPortal/StudentRecords')} className="mt-4 text-[#800000] font-bold">← Back to Student Records</button></div></Frame>;

  const current = rows[0];
  const va = viewed || current;
  const f = va.form || {};
  const style = APP_DISPLAY[current.status] || APP_DISPLAY.submitted;
  const studentNo = rows.find((r) => r.student_no)?.student_no;
  const grade = current.form?.grade || current.grade_level;
  const gradLevel = levelOfGrade(current.form?.grade);
  const isEnrolled = current.status === 'enrolled';
  const isCompleted = current.status === 'completed';
  const isDeprov = ['withdrawn', 'graduated', 'archived'].includes(current.status);
  const isPending = ['submitted', 'under_review', 'needs_correction'].includes(current.status);

  return (
    <Frame>
      <main className="p-8 md:p-12 max-w-[1000px] mx-auto w-full space-y-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/RegistrarPortal/StudentRecords')} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"><IoChevronBack size={24} /></button>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{applicantName(current)}</h1>
              <p className="text-slate-500 font-medium">{studentNo ? `Student No. ${studentNo} · ` : ''}{grade}{current.form?.strand ? ` (${current.form.strand})` : ''} · S.Y. {current.school_year}</p>
            </div>
          </div>
          <span className={`px-5 py-2 rounded-full text-[10px] font-black tracking-tight ${style.bg} ${style.text}`}>{style.label}</span>
        </div>

        {msg && <div className={`rounded-xl px-5 py-3 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}

        {isPending && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-sm text-amber-800">
            This student has a pending application — <button onClick={() => navigate('/RegistrarPortal/Applications/' + current.id)} className="font-bold underline">review &amp; enroll it in Applications</button>.
          </div>
        )}

        {/* Enrollment history (click a year to view its details below) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-5">Enrollment history</h2>
          <div className="divide-y divide-slate-50">
            {rows.map((r) => {
              const st = APP_DISPLAY[r.status] || APP_DISPLAY.submitted;
              const active = r.id === va.id;
              return (
                <div key={r.id} onClick={() => setViewed(r)} className={`flex items-center justify-between py-4 cursor-pointer -mx-3 px-3 rounded-lg transition-colors ${active ? 'bg-[#800000]/5' : 'hover:bg-slate-50'}`}>
                  <div>
                    <p className={`font-bold text-sm ${active ? 'text-[#800000]' : 'text-slate-800'}`}>{r.form?.grade || r.grade_level}{r.form?.strand ? ` · ${r.form.strand}` : ''}{r.student_no ? ` · No. ${r.student_no}` : ''}</p>
                    <p className="text-[12px] text-slate-400">S.Y. {r.school_year} · {r.student_type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black ${st.bg} ${st.text}`}>{st.label}</span>
                    <span className={`text-xs ${active ? 'text-[#800000] font-bold' : 'text-slate-300'}`}>{active ? 'viewing' : 'view'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details of the selected year */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-6">Personal Information — S.Y. {va.school_year}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <D label="First Name" v={f.firstName} /><D label="Middle Name" v={f.middleName} /><D label="Last Name" v={f.lastName} />
            <D label="LRN" v={f.lrn} /><D label="Sex" v={f.sex} /><D label="Age" v={ageFrom(f.dob)} />
            <D label="Date of Birth" v={f.dob} /><D label="Birthplace" v={f.birthplace} /><D label="Religion" v={f.religion} />
            <D label="Grade" v={f.grade || va.grade_level} /><D label="Student Type" v={va.student_type} /><D label="Contact" v={f.contact} />
            <D label="Section" v={f.section} /><D label="Adviser" v={f.adviser} />
          </div>
          <div className="mt-5"><D label="Home Address" v={f.address} /></div>
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mt-8 mb-6">Parent / Guardian &amp; Academic</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <D label="Father" v={f.fatherName} /><D label="Mother" v={f.motherName} /><D label="Guardian" v={f.guardianName} />
            <D label="Guardian Contact" v={f.guardianContact} /><D label="Last School" v={f.lastSchool} /><D label="GWA" v={f.gwa} />
          </div>
        </div>

        {/* Documents of the selected year */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-5">Documents — S.Y. {va.school_year}</h2>
          <ul className="space-y-3">
            {REQUIRED_DOCS.map(({ key, label }) => {
              const doc = va.documents?.[key];
              const st = DOC_STATUS_STYLE[doc?.status || 'none'];
              return (
                <li key={key} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl gap-4">
                  <span className="text-sm font-bold text-slate-700">{label}{doc?.name ? <span className="block text-[11px] font-medium text-slate-400 truncate">{doc.name}</span> : null}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black ${st.cls}`}>{st.label}</span>
                    {doc?.path ? (
                      <>
                        <button onClick={() => viewDoc(doc.path)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black cursor-pointer">VIEW</button>
                        <button onClick={() => setDoc(key, 'verified')} className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg text-[10px] font-black cursor-pointer">VERIFY</button>
                        <button onClick={() => setDoc(key, 'rejected')} className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-black cursor-pointer">REJECT</button>
                      </>
                    ) : <span className="text-[11px] text-slate-400 italic pr-2">not uploaded</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Lifecycle (acts on the current record) */}
        {(isEnrolled || isCompleted || isDeprov) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-2">Lifecycle</h2>
            <p className="text-sm text-slate-500 mb-5">
              {isEnrolled && 'Mark the year completed at year-end, or deprovision (revokes login, keeps the record — reversible).'}
              {isCompleted && 'This year is finished. The student re-enrolls into the next grade during the enrollment season.'}
              {isDeprov && 'Login is revoked but the record is kept. Reactivate to the same grade, or re-admit at a new grade for a returnee.'}
            </p>
            <div className="flex flex-wrap gap-3">
              {isEnrolled && (
                <>
                  <button disabled={busy} onClick={() => run(() => markCompleted(current.id), 'Year marked completed.')} className="px-6 py-3 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-xl font-bold cursor-pointer disabled:opacity-60">✓ Mark Year Completed</button>
                  <button disabled={busy} onClick={() => run(() => setLifecycle(current.id, 'graduated', `Graduated${gradLevel ? ' from ' + gradLevel : ''}. Congratulations!`), 'Marked as graduated.')} className="px-6 py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl font-bold cursor-pointer disabled:opacity-60">Graduate{gradLevel ? ` (${gradLevel})` : ''}</button>
                  <button disabled={busy} onClick={() => run(() => setLifecycle(current.id, 'withdrawn', 'Student marked as withdrawn.'), 'Student withdrawn.')} className="px-6 py-3 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl font-bold cursor-pointer disabled:opacity-60">Withdraw</button>
                  <button disabled={busy} onClick={() => run(() => setLifecycle(current.id, 'archived', 'Record archived.'), 'Student archived.')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer disabled:opacity-60">Archive</button>
                </>
              )}
              {isCompleted && (
                <>
                  <button disabled={busy} onClick={() => run(() => setLifecycle(current.id, 'withdrawn', 'Did not re-enroll — transferred / withdrawn.'), 'Marked as withdrawn.')} className="px-6 py-3 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl font-bold cursor-pointer disabled:opacity-60">Mark Transferred / Withdrawn</button>
                  <button disabled={busy} onClick={() => run(() => setLifecycle(current.id, 'archived', 'Record archived.'), 'Student archived.')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer disabled:opacity-60">Archive</button>
                </>
              )}
              {isDeprov && (
                <button disabled={busy} onClick={() => run(() => reactivateStudent(current.id), 'Student reactivated.')} className="px-6 py-3 bg-[#800000] hover:bg-[#600000] text-white rounded-xl font-bold shadow-md cursor-pointer disabled:opacity-60">↩ Reactivate (same grade)</button>
              )}
            </div>

            {isDeprov && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 mb-1">Re-admit (returning student)</h3>
                <p className="text-xs text-slate-500 mb-4 max-w-xl">For a former student returning at a <b>new grade</b> — e.g. graduated Elementary here, did a year elsewhere, and returns for JHS. Creates a new enrollment for their same record and restores access.</p>
                <div className="flex flex-wrap gap-3 items-end">
                  <label className="block">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Returning grade</span>
                    <select value={readmitGrade} onChange={(e) => setReadmitGrade(e.target.value)} className="bg-[#F1F3F6] rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 border-none outline-none">
                      <option value="">Select…</option>
                      {ALL_GRADES.map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">School year</span>
                    <input value={readmitYear} onChange={(e) => setReadmitYear(e.target.value)} placeholder="2027-2028" className="bg-[#F1F3F6] rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 border-none outline-none w-40" />
                  </label>
                  <button disabled={busy || !readmitGrade || !readmitYear} onClick={doReadmit} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50">Re-admit →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </Frame>
  );
};

const D = ({ label, v }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
    <div className="w-full p-2.5 bg-[#F1F5F9] border border-slate-200 rounded-lg text-slate-700 text-sm font-medium min-h-[40px]">{v || '—'}</div>
  </div>
);

const Frame = ({ children }) => (
  <div className="flex min-h-screen bg-[#F8F9FA]">
    <RegistrarSidebar />
    <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
      <Header showSearch={false} />
      {children}
    </div>
  </div>
);

export default StudentProfile;
