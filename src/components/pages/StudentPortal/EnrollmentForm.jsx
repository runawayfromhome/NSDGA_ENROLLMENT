// Applicant → Enrollment Form. The editable version of the applicant's own
// application: Personal Info, Academic Background, and Documents. Save Draft
// keeps the current status; Save Changes also resubmits when the Registrar has
// asked for corrections.
import { useEffect, useState } from 'react';
import StudentSidebar from '../../StudentSidebar';
import Header from '../../Header';
import { HiOutlineUser, HiOutlineAcademicCap, HiOutlineDocumentText } from 'react-icons/hi';
import {
  getMyApplication, saveApplicationDraft, resubmitApplication, uploadStudentDoc,
} from '../../../lib/student';
import { GRADES_BY_LEVEL } from '../../../lib/grades';
import { CardSkeleton } from '../../Skeleton';

const LEVELS = ['Elementary', 'Junior High School', 'Senior High School'];
const TYPES = ['New Student', 'Transferee', 'Returnee'];
const SHS_STRANDS = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL'];
const DOCS = [
  { key: 'photo', label: '2x2 Picture', hint: 'High-quality, white background' },
  { key: 'reportCard', label: 'Report Card', hint: 'Scanned copy of latest grades' },
  { key: 'form137', label: 'Form 137', hint: 'Official Student Permanent Record' },
  { key: 'psa', label: 'PSA Birth Certificate', hint: 'Clear copy from PSA' },
  { key: 'goodMoral', label: 'Good Moral Cert', hint: 'From previous school principal' },
];

const EnrollmentForm = () => {
  const [app, setApp] = useState(undefined);
  const [f, setF] = useState({});
  const [level, setLevel] = useState('');
  const [studentType, setStudentType] = useState('New Student');
  const [docs, setDocs] = useState({});
  const [agree, setAgree] = useState(false);
  const [uploading, setUploading] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    const a = await getMyApplication();
    setApp(a);
    if (a) {
      setF({ ...(a.form || {}) });
      setLevel(a.grade_level || '');
      setStudentType(a.student_type || 'New Student');
      setDocs(a.documents || {});
    }
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const isSHS = level === 'Senior High School';
  const locked = app && !['draft', 'submitted', 'under_review', 'needs_correction'].includes(app.status);

  const onUpload = async (key, file) => {
    if (!file || !app) return;
    if (file.size > 5 * 1024 * 1024) return setMsg('⚠️ ' + file.name + ' is over 5MB.');
    if (!/\.(jpe?g|png|pdf)$/i.test(file.name)) return setMsg('⚠️ Only JPG, PNG or PDF are allowed.');
    setUploading(key); setMsg('');
    const res = await uploadStudentDoc(app.id, key, file);
    setUploading('');
    if (!res.ok) return setMsg('⚠️ ' + (res.error || 'Upload failed.'));
    setDocs(res.documents);
  };

  const save = async (resubmit) => {
    if (!app) return;
    if (resubmit && !agree) return setMsg('⚠️ Please certify the information before saving changes.');
    setBusy(resubmit ? 'changes' : 'draft'); setMsg('');
    const form = { ...f };
    const r = await saveApplicationDraft(app.id, { form, grade_level: level || null, student_type: studentType });
    if (r.ok && resubmit && app.status === 'needs_correction') await resubmitApplication(app.id, form);
    setBusy('');
    setMsg(r.ok ? '✓ Saved.' : '⚠️ ' + (r.error || 'Could not save.'));
    if (r.ok) load();
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <StudentSidebar activePage="Enrollment Form" />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="p-6 md:p-10 max-w-[1100px] w-full">
          <div className="flex items-center gap-3 mb-6">
            <HiOutlineDocumentText className="text-[#800000]" size={26} />
            <h1 className="text-2xl font-bold text-slate-900">Student Enrollment Form</h1>
          </div>

          {msg && <div className={`mb-5 rounded-lg px-4 py-3 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}
          {app === undefined && <CardSkeleton lines={8} />}
          {app === null && <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-slate-500">No application on file yet.</div>}

          {app && (
            <div className="space-y-6">
              {locked && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">This record is now <b>{app.status}</b> and can no longer be edited here.</div>}

              {/* Personal */}
              <Card icon={HiOutlineUser} title="Personal Information">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <F l="First Name"><input className="ip" value={f.firstName || ''} onChange={(e) => set('firstName', e.target.value)} disabled={locked} /></F>
                  <F l="Middle Name"><input className="ip" value={f.middleName || ''} onChange={(e) => set('middleName', e.target.value)} disabled={locked} /></F>
                  <F l="Last Name"><input className="ip" value={f.lastName || ''} onChange={(e) => set('lastName', e.target.value)} disabled={locked} /></F>
                  <F l="LRN (12-digit)"><input className="ip" value={f.lrn || ''} onChange={(e) => set('lrn', e.target.value)} disabled={locked} /></F>
                  <F l="Sex"><select className="ip" value={f.sex || ''} onChange={(e) => set('sex', e.target.value)} disabled={locked}><option value="">Select</option><option>Male</option><option>Female</option></select></F>
                  <F l="Date of Birth"><input className="ip" type="date" value={f.dob || ''} onChange={(e) => set('dob', e.target.value)} disabled={locked} /></F>
                  <F l="Birthplace"><input className="ip" value={f.birthplace || ''} onChange={(e) => set('birthplace', e.target.value)} disabled={locked} /></F>
                  <F l="Contact Number"><input className="ip" value={f.contact || ''} onChange={(e) => set('contact', e.target.value)} disabled={locked} /></F>
                  <F l="School Year"><input className="ip bg-gray-50" value={app.school_year || ''} readOnly /></F>
                </div>
                <div className="mt-4"><F l="Home Address"><textarea className="ip" style={{ minHeight: 60 }} value={f.address || ''} onChange={(e) => set('address', e.target.value)} disabled={locked} /></F></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <F l="Education Level"><select className="ip" value={level} onChange={(e) => { setLevel(e.target.value); set('grade', ''); }} disabled={locked}><option value="">Select</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></F>
                  <F l="Grade Level Applying For"><select className="ip" value={f.grade || ''} onChange={(e) => set('grade', e.target.value)} disabled={locked || !level}><option value="">Select</option>{(GRADES_BY_LEVEL[level] || []).map((g) => <option key={g}>{g}</option>)}</select></F>
                  <F l="Student Type"><select className="ip" value={studentType} onChange={(e) => setStudentType(e.target.value)} disabled={locked}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></F>
                  {isSHS && <F l="Preferred Strand"><select className="ip" value={f.strand || ''} onChange={(e) => set('strand', e.target.value)} disabled={locked}><option value="">Select</option>{SHS_STRANDS.map((s) => <option key={s}>{s}</option>)}</select></F>}
                </div>
              </Card>

              {/* Academic */}
              <Card icon={HiOutlineAcademicCap} title="Academic Background">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F l="Previous School Attended"><input className="ip" value={f.lastSchool || ''} onChange={(e) => set('lastSchool', e.target.value)} disabled={locked} /></F>
                  <F l="School Address"><input className="ip" value={f.lastSchoolAddress || ''} onChange={(e) => set('lastSchoolAddress', e.target.value)} disabled={locked} /></F>
                  <F l="Last Grade / Year Level Completed"><input className="ip" value={f.lastGrade || ''} onChange={(e) => set('lastGrade', e.target.value)} disabled={locked} /></F>
                  <F l="GWA (General Weighted Average)"><input className="ip" value={f.gwa || ''} onChange={(e) => set('gwa', e.target.value)} disabled={locked} /></F>
                </div>
              </Card>

              {/* Documents */}
              <Card icon={HiOutlineDocumentText} title="Document Requirements">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DOCS.map((d) => {
                    const up = docs[d.key];
                    return (
                      <div key={d.key} className={`rounded-xl border-2 border-dashed p-4 text-center ${up?.path ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200'}`}>
                        <p className="text-sm font-bold text-slate-700">{d.label}</p>
                        <p className="text-[11px] text-slate-400 mb-2">{d.hint}</p>
                        {up?.path && <p className="text-[11px] font-semibold text-emerald-600 mb-2 truncate">✓ {up.name || 'Uploaded'}</p>}
                        {!locked && (
                          <label className="inline-block px-4 py-2 rounded-lg text-[12px] font-bold bg-[#800000] text-white hover:bg-[#600000] cursor-pointer">
                            {uploading === d.key ? 'Uploading…' : up?.path ? 'Replace File' : 'Upload File'}
                            <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => onUpload(d.key, e.target.files?.[0])} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>

              {!locked && (
                <>
                  <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 accent-[#800000] w-4 h-4" />
                    <span>I certify the information above is true and correct, and I agree to the processing of this data under the <b>Data Privacy Act of 2012</b> for admission purposes.</span>
                  </label>
                  <div className="flex flex-wrap justify-end gap-3">
                    <button onClick={() => save(false)} disabled={!!busy} className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-50 disabled:opacity-60 cursor-pointer">{busy === 'draft' ? 'Saving…' : 'Save Draft'}</button>
                    <button onClick={() => save(true)} disabled={!!busy} className="px-6 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold disabled:opacity-60 cursor-pointer">{busy === 'changes' ? 'Saving…' : app.status === 'needs_correction' ? 'Save & Resubmit' : 'Save Changes'}</button>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
      <style>{`.ip{width:100%;border:1px solid #E5E7EB;border-radius:.6rem;padding:.55rem .8rem;font-size:.875rem;outline:none;background:#fff}.ip:focus{border-color:#800000}.ip:disabled{background:#f8fafc;color:#64748b}`}</style>
    </div>
  );
};

const Card = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="flex items-center gap-2 mb-5"><Icon className="text-[#800000]" size={20} /><h2 className="text-lg font-bold text-slate-800">{title} <span className="text-red-500">*</span></h2></div>
    {children}
  </div>
);
const F = ({ l, children }) => (<label className="block"><span className="block font-semibold text-[11px] text-gray-500 mb-1.5">{l}</span>{children}</label>);

export default EnrollmentForm;
