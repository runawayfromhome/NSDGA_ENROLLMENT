// Online Admission wizard. Two modes:
//  • CREATE (public): grade → account → form → review → creates account + application
//  • EDIT/RESUBMIT: a logged-in student whose application was "needs_correction"
//    edits it (no account step) and resubmits.
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, NavLink } from 'react-router-dom';
import AcademyLogo from '../../../assets/nuestralogo.jpg';
import NuestraLogoImage from '../../../assets/nuestradg.png';
import { applyAsStudent, getMyApplication, resubmitApplication, CURRENT_SCHOOL_YEAR } from '../../../lib/student';

const LEVELS = ['Kindergarten', 'Elementary', 'Junior High School', 'Senior High School'];
const TYPES = ['New Student', 'Transferee', 'Returnee'];
const SHS_STRANDS = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL'];

const STEP_LABELS = { grade: 'Grade & Type', account: 'Account', student: 'Student Info', guardian: 'Parent / Guardian', academic: 'Academic', review: 'Review' };

const empty = {
  lastName: '', firstName: '', middleName: '', suffix: '',
  lrn: '', sex: '', dob: '', birthplace: '', religion: '', nationality: 'Filipino',
  address: '', strand: '',
  fatherName: '', motherName: '', guardianName: '', guardianContact: '',
  lastSchool: '', lastSchoolAddress: '', lastGrade: '', gwa: '',
  schoolYear: CURRENT_SCHOOL_YEAR,
};

const Apply = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [ready, setReady] = useState(false);
  const [editId, setEditId] = useState(null); // set = resubmit mode
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState(params.get('level') || '');
  const [studentType, setStudentType] = useState('New Student');
  const [acct, setAcct] = useState({ email: '', password: '', confirm: '', contact: '' });
  const [f, setF] = useState(empty);
  const [agreed, setAgreed] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Detect resubmit mode: a logged-in student with a "needs_correction" app.
  useEffect(() => {
    (async () => {
      const app = await getMyApplication();
      if (app) {
        if (app.status === 'needs_correction') {
          setEditId(app.id);
          setLevel(app.grade_level || '');
          setStudentType(app.student_type || 'New Student');
          setF({ ...empty, ...(app.form || {}) });
          setAgreed(true);
        } else {
          // already applied and not asked to correct — send them to their portal
          navigate('/StudentPortal/Dashboard', { replace: true });
          return;
        }
      }
      setReady(true);
    })();
  }, [navigate]);

  const editMode = !!editId;
  const stepKeys = editMode
    ? ['grade', 'student', 'guardian', 'academic', 'review']
    : ['grade', 'account', 'student', 'guardian', 'academic', 'review'];
  const labels = stepKeys.map((k) => STEP_LABELS[k]);
  const current = stepKeys[step];
  const isSHS = level === 'Senior High School';
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const validateStep = () => {
    setError('');
    if (current === 'grade' && !level) return 'Please choose a grade level.';
    if (current === 'account') {
      if (!acct.email || !acct.password) return 'Email and password are required.';
      if (acct.password.length < 8) return 'Password must be at least 8 characters.';
      if (acct.password !== acct.confirm) return 'Passwords do not match.';
      if (!acct.contact) return 'Contact number is required.';
    }
    if (current === 'student') {
      if (!f.lastName || !f.firstName) return 'First and last name are required.';
      if (!f.sex || !f.dob) return 'Sex and date of birth are required.';
      if (isSHS && !f.strand) return 'Please choose a Senior High strand.';
    }
    return '';
  };

  const next = () => { const m = validateStep(); if (m) return setError(m); setStep((s) => Math.min(s + 1, stepKeys.length - 1)); };
  const back = () => { setError(''); setStep((s) => Math.max(s - 1, 0)); };

  const submit = async () => {
    if (!agreed) return setError('Please agree to the Data Privacy terms to submit.');
    setBusy(true); setError('');
    let res;
    if (editMode) {
      res = await resubmitApplication(editId, { ...f, contact: f.contact || acct.contact });
    } else {
      res = await applyAsStudent({ email: acct.email, password: acct.password, contact: acct.contact, level, studentType, form: f });
    }
    setBusy(false);
    if (!res.ok) return setError(res.error || 'Could not submit your application.');
    navigate('/StudentPortal/Dashboard');
  };

  if (!ready) return <Shell><p className="text-slate-400 text-sm">Loading…</p></Shell>;

  return (
    <Shell steps={labels} step={step}>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{editMode ? 'Update Your Application' : 'Online Admission'}</h2>
        <p className="text-gray-500 text-sm mt-1">Step {step + 1} of {stepKeys.length} — {labels[step]}</p>
      </div>

      {editMode && step === 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The Registrar asked for corrections. Update your details and resubmit.
        </div>
      )}
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      {current === 'grade' && (
        <div className="space-y-6">
          <div>
            <Label>Grade Level</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LEVELS.map((l) => (
                <button key={l} type="button" onClick={() => setLevel(l)}
                  className={`text-left px-4 py-3 rounded-xl border-2 font-semibold text-sm transition ${level === l ? 'border-[#800000] bg-[#800000]/5 text-[#800000]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Applying as</Label>
            <div className="flex flex-wrap gap-3">
              {TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setStudentType(t)}
                  className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition ${studentType === t ? 'border-[#800000] bg-[#800000] text-white' : 'border-gray-200 text-gray-600'}`}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {current === 'account' && (
        <div className="space-y-4">
          <Field label="Email (Gmail)"><input className="ip" type="email" value={acct.email} onChange={(e) => setAcct({ ...acct, email: e.target.value })} placeholder="juandelacruz@gmail.com" /></Field>
          <Field label="Contact Number"><input className="ip" value={acct.contact} onChange={(e) => setAcct({ ...acct, contact: e.target.value })} placeholder="0917 123 4567" /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Password">
              <div className="relative">
                <input className="ip pr-16" type={showPw ? 'text' : 'password'} value={acct.password} onChange={(e) => setAcct({ ...acct, password: e.target.value })} placeholder="At least 8 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#800000]">{showPw ? 'Hide' : 'Show'}</button>
              </div>
            </Field>
            <Field label="Confirm Password"><input className="ip" type={showPw ? 'text' : 'password'} value={acct.confirm} onChange={(e) => setAcct({ ...acct, confirm: e.target.value })} placeholder="Re-type password" /></Field>
          </div>
          <p className="text-xs text-gray-400">This becomes your student portal login.</p>
        </div>
      )}

      {current === 'student' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Last Name"><input className="ip" value={f.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
            <Field label="First Name"><input className="ip" value={f.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
            <Field label="Middle Name"><input className="ip" value={f.middleName} onChange={(e) => set('middleName', e.target.value)} /></Field>
            <Field label="Suffix (optional)"><input className="ip" value={f.suffix} onChange={(e) => set('suffix', e.target.value)} placeholder="Jr., III" /></Field>
            <Field label="LRN (if any)"><input className="ip" value={f.lrn} onChange={(e) => set('lrn', e.target.value)} placeholder="12-digit LRN" /></Field>
            <Field label="Sex">
              <select className="ip" value={f.sex} onChange={(e) => set('sex', e.target.value)}><option value="">Select…</option><option>Male</option><option>Female</option></select>
            </Field>
            <Field label="Date of Birth"><input className="ip" type="date" value={f.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
            <Field label="Place of Birth"><input className="ip" value={f.birthplace} onChange={(e) => set('birthplace', e.target.value)} /></Field>
            <Field label="Religion"><input className="ip" value={f.religion} onChange={(e) => set('religion', e.target.value)} /></Field>
            <Field label="Nationality"><input className="ip" value={f.nationality} onChange={(e) => set('nationality', e.target.value)} /></Field>
          </div>
          {isSHS && (
            <Field label="Senior High Strand">
              <select className="ip" value={f.strand} onChange={(e) => set('strand', e.target.value)}><option value="">Select…</option>{SHS_STRANDS.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
          )}
          <Field label="Home Address"><textarea className="ip" style={{ minHeight: 70 }} value={f.address} onChange={(e) => set('address', e.target.value)} /></Field>
        </div>
      )}

      {current === 'guardian' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Father's Name"><input className="ip" value={f.fatherName} onChange={(e) => set('fatherName', e.target.value)} /></Field>
          <Field label="Mother's Name"><input className="ip" value={f.motherName} onChange={(e) => set('motherName', e.target.value)} /></Field>
          <Field label="Guardian's Name"><input className="ip" value={f.guardianName} onChange={(e) => set('guardianName', e.target.value)} /></Field>
          <Field label="Guardian's Contact"><input className="ip" value={f.guardianContact} onChange={(e) => set('guardianContact', e.target.value)} placeholder="0917 123 4567" /></Field>
        </div>
      )}

      {current === 'academic' && (
        <div className="space-y-4">
          <Field label="Last School Attended"><input className="ip" value={f.lastSchool} onChange={(e) => set('lastSchool', e.target.value)} /></Field>
          <Field label="School Address"><input className="ip" value={f.lastSchoolAddress} onChange={(e) => set('lastSchoolAddress', e.target.value)} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Last Grade Completed"><input className="ip" value={f.lastGrade} onChange={(e) => set('lastGrade', e.target.value)} placeholder="e.g. Grade 6" /></Field>
            <Field label="General Average (GWA)"><input className="ip" value={f.gwa} onChange={(e) => set('gwa', e.target.value)} placeholder="e.g. 90" /></Field>
          </div>
          <p className="text-xs text-gray-400">📎 Documents (Report Card, PSA, Good Moral) are submitted at the Registrar's office.</p>
        </div>
      )}

      {current === 'review' && (
        <div className="space-y-5">
          <Summary title="Application" rows={[['Grade Level', level], ['Applying as', studentType], ['School Year', f.schoolYear]]} />
          <Summary title="Student" rows={[['Name', `${f.firstName} ${f.middleName} ${f.lastName} ${f.suffix}`.replace(/\s+/g, ' ').trim()], ['Sex', f.sex], ['Date of Birth', f.dob], ...(isSHS ? [['Strand', f.strand]] : [])]} />
          {!editMode && <Summary title="Account" rows={[['Email', acct.email], ['Contact', acct.contact]]} />}
          <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-[#800000] w-4 h-4" />
            <span>I certify the information above is true and correct, and I agree to the processing of this data under the <b>Data Privacy Act of 2012</b> for admission purposes.</span>
          </label>
        </div>
      )}

      <div className="flex items-center justify-between mt-8">
        <button type="button" onClick={back} disabled={step === 0} className="px-5 py-2.5 rounded-lg font-semibold text-gray-500 disabled:opacity-0">← Back</button>
        {step < stepKeys.length - 1
          ? <button type="button" onClick={next} className="px-8 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-lg font-bold shadow">Continue →</button>
          : <button type="button" onClick={submit} disabled={busy} className="px-8 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-lg font-bold shadow disabled:opacity-60">{busy ? 'Submitting…' : editMode ? 'Resubmit Application' : 'Submit Application'}</button>}
      </div>

      {!editMode && (
        <p className="text-center mt-6 text-gray-500 text-sm">Already applied? <NavLink to="/StudentPortal/Login" className="text-[#800000] font-bold">Log in</NavLink></p>
      )}

      <style>{`.ip{width:100%;border:1px solid #E5E7EB;border-radius:.6rem;padding:.6rem .8rem;font-size:.9rem;outline:none;background:#fff}.ip:focus{border-color:#800000}`}</style>
    </Shell>
  );
};

const Shell = ({ children, steps, step }) => (
  <div className="flex min-h-screen w-full font-sans">
    <div className="relative hidden lg:flex lg:w-[38%] flex-col items-center justify-center p-12 text-center text-white"
      style={{ backgroundImage: `url(${NuestraLogoImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(128,0,0,0.88)' }} />
      <div className="relative z-10 flex flex-col items-center">
        <img src={AcademyLogo} alt="Logo" className="w-32 h-32 mb-6 rounded-full object-cover border-4 border-white/20" />
        <h1 className="text-3xl font-bold leading-tight mb-2">Nuestra Señora de Guia<br />Academy</h1>
        <p className="italic opacity-90 mb-10">Online Admission</p>
        {steps && (
          <ol className="w-full max-w-xs space-y-3 text-left">
            {steps.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 text-sm ${i === step ? 'font-bold' : 'opacity-70'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${i < step ? 'bg-white text-[#800000] border-white' : i === step ? 'border-white' : 'border-white/40'}`}>{i < step ? '✓' : i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
    <div className="w-full lg:w-[62%] bg-[#F9FAFB] flex flex-col justify-center px-6 md:px-16 py-10 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto">{children}</div>
    </div>
  </div>
);

const Label = ({ children }) => <p className="font-bold text-sm text-gray-700 mb-3">{children}</p>;
const Field = ({ label, children }) => (
  <label className="block"><span className="block font-semibold text-xs text-gray-600 mb-1.5">{label}</span>{children}</label>
);
const Summary = ({ title, rows }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4">
    <h4 className="font-bold text-xs uppercase tracking-wide text-[#800000] mb-3">{title}</h4>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-sm">
      {rows.map(([k, v]) => (<div key={k} className="flex gap-2"><dt className="text-gray-400">{k}:</dt><dd className="font-semibold text-gray-800">{v || '—'}</dd></div>))}
    </dl>
  </div>
);

export default Apply;
