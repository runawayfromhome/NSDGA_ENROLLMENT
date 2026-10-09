// src/components/pages/StaffProfile/ProfileSetup.jsx
// Shared onboarding page for Registrar & Admin employees. One component serves
// both roles (role is read from the session). It shows one of three states:
//   1. pending_profile        -> the profile form (+ forced new password)
//   2. pending_verification   -> "awaiting HeadAdmin verification" screen
//   3. verified               -> "you're verified" screen with a link inside
import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import AcademyLogo from '../../../assets/nuestralogo.jpg';
import { useSession } from '../../../contexts/useSession';
import { submitProfile, ROLE_HOME, STATUS } from '../../../auth/authStore';
import { validatePassword, passwordChecks } from '../../../lib/password';
import AddressPicker from '../../AddressPicker';

// --- Input limiters (same policy as the student Apply / Enrollment form) ------
const TODAY_ISO = new Date().toISOString().slice(0, 10);               // no future dates
const onlyDigits = (v, max) => String(v).replace(/\D/g, '').slice(0, max);
const nameClean = (v, max = 50) => String(v).replace(/[^A-Za-zñÑ .'-]/g, '').replace(/\s{2,}/g, ' ').slice(0, max);
const idClean = (v, max = 20) => String(v).replace(/[^A-Za-z0-9-]/g, '').slice(0, max);
const NAME_PARTICLES = new Set(['dela', 'delas', 'delos', 'de', 'del', 'da', 'di', 'van', 'von', 'la', 'le', 'los', 'las', 'y', 'ng', 'bin', 'al']);
const titleCaseName = (v) => String(v).trim().replace(/\s+/g, ' ').split(' ').map((w, i) => {
  const lower = w.toLowerCase();
  if (i > 0 && NAME_PARTICLES.has(lower)) return lower;
  return lower.replace(/(^|[-'])([a-zñ])/g, (_m, sep, ch) => sep + ch.toUpperCase());
}).join(' ');
const PHONE_RE = /^09\d{9}$/;                                          // PH mobile: 09 + 9 digits
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESUBMIT_LIMIT = 3;                                              // after a return, staff may resubmit at most 3x

const ROLE_DEFAULTS = {
  registrar: { position: 'School Registrar', department: "Registrar's Office" },
  admin: { position: 'Website Administrator', department: 'Administration Office' },
};

const REQUIRED = [
  'firstName', 'lastName', 'sex', 'dob', 'mobile', 'address',
  'emergencyName', 'emergencyNumber', 'employeeId', 'position',
  'department', 'dateHired', 'employmentType', 'education',
];

const emptyForm = (role, profile) => ({
  firstName: '', middleName: '', lastName: '', sex: '', dob: '', civilStatus: '', nationality: 'Filipino',
  mobile: '', secondaryEmail: '', address: '', emergencyName: '', emergencyNumber: '',
  employeeId: '', dateHired: '', employmentType: '', supervisor: '',
  education: '', course: '', prcLicense: '', certifications: '',
  tin: '', sss: '', philhealth: '', pagibig: '', photo: '',
  ...(ROLE_DEFAULTS[role] || {}),
  ...(profile || {}),
});

const ProfileSetup = () => {
  const { session, logout, refresh } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => emptyForm(session.role, session.profile));
  const [password, setPassword] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setClean = (k, fn) => (e) => setForm((f) => ({ ...f, [k]: fn(e.target.value) }));
  const blurTitle = (k) => (e) => setForm((f) => ({ ...f, [k]: titleCaseName(e.target.value) }));

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // The photo is stored inline (base64) in the profile row, so keep it small.
    if (!file.type.startsWith('image/')) { setError('Profile photo must be an image file (JPG or PNG).'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Profile photo must be 2MB or smaller.'); return; }
    setError('');
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const logoutAndLeave = async () => {
    await logout();
    navigate(`/${session.role === 'admin' ? 'AdminPortal' : 'RegistrarPortal'}/Login`, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (resubmitLocked) return setError(`You have used all ${RESUBMIT_LIMIT} resubmission attempts. Please contact the Head Administrator's office.`);
    { const v = validatePassword(password.newPassword, session.role); if (!v.ok) return setError(v.error); }
    if (password.newPassword !== password.confirmPassword) {
      return setError('Passwords do not match.');
    }
    const hasCascade = form.region && form.city && form.barangay && form.houseStreet?.trim();
    const missing = REQUIRED.filter((k) => k !== 'address').find((k) => !String(form[k] ?? '').trim());
    if (missing) {
      return setError('Please complete all required (*) fields before submitting.');
    }
    if (!hasCascade && !String(form.address || '').trim()) {
      return setError('Please complete your home address (region, city, barangay, and house no. & street).');
    }
    if (form.mobile && !PHONE_RE.test(form.mobile)) return setError('Enter a valid mobile number (09XXXXXXXXX).');
    if (form.emergencyNumber && !PHONE_RE.test(form.emergencyNumber)) return setError('Enter a valid emergency contact number (09XXXXXXXXX).');
    if (form.secondaryEmail && !EMAIL_RE.test(form.secondaryEmail)) return setError('Enter a valid secondary email address.');
    setSubmitting(true);
    // Count this as a resubmission only if it follows a return.
    const toSubmit = wasReturned ? { ...form, resubmitCount: resubmitsUsed + 1 } : form;
    const res = await submitProfile(session.id, toSubmit, password.newPassword);
    setSubmitting(false);
    if (!res.ok) return setError(res.error || 'Could not submit. Please try again.');
    await refresh();
    window.scrollTo(0, 0);
  };

  const status = session.status;
  // Resubmit tracking — a resubmission is a submit AFTER the HeadAdmin returned
  // the profile (there's a return note). The first onboarding submit doesn't count.
  const wasReturned = !!session.returnNote;
  const resubmitsUsed = Number(session.profile?.resubmitCount) || 0;
  const resubmitsLeft = Math.max(0, RESUBMIT_LIMIT - resubmitsUsed);
  const resubmitLocked = wasReturned && resubmitsLeft <= 0;

  // While awaiting verification, quietly poll so the screen updates itself the
  // moment the Head Administrator verifies (or returns) the profile.
  useEffect(() => {
    if (status !== STATUS.PENDING_VERIFICATION) return;
    const t = setInterval(() => { refresh(); }, 20000);
    return () => clearInterval(t);
  }, [status, refresh]);

  // ---- STATE 3: verified ----
  if (status === STATUS.VERIFIED) {
    return (
      <Shell session={session} onLogout={logoutAndLeave}>
        <Panel
          tone="green"
          title="Your account is verified ✅"
          text="The Head Administrator has approved your profile. You now have full access to your portal."
        >
          <button onClick={() => navigate(ROLE_HOME[session.role])}
            className="px-8 py-3 bg-[#800000] hover:bg-[#600000] text-white rounded-xl font-bold text-sm cursor-pointer">
            Go to my dashboard →
          </button>
        </Panel>
      </Shell>
    );
  }

  // ---- STATE 2: awaiting verification ----
  if (status === STATUS.PENDING_VERIFICATION) {
    const p = session.profile || {};
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.trim() || session.name;
    const steps = ['Submitted', 'Under Review', 'Verified'];
    const activeIdx = 1; // submitted done, now under HeadAdmin review
    return (
      <Shell session={session} onLogout={logoutAndLeave}>
        <div className="max-w-xl mx-auto mt-6 space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h1 className="text-2xl font-black text-slate-800 mb-2">Profile submitted — awaiting verification ⏳</h1>
            <p className="text-sm text-slate-600 leading-relaxed">Your profile has been sent to the Head Administrator for review. You'll get access to your portal once it is verified.</p>
          </div>

          {/* Status tracker */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => (
                <Fragment key={s}>
                  <div className="flex flex-col items-center text-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i <= activeIdx ? 'bg-[#800000] text-white' : 'bg-slate-100 text-slate-400'}`}>{i < activeIdx ? '✓' : i + 1}</div>
                    <p className={`mt-2 text-xs font-semibold ${i <= activeIdx ? 'text-slate-800' : 'text-slate-400'}`}>{s}</p>
                  </div>
                  {i < steps.length - 1 && <div className={`h-1 flex-1 rounded ${i < activeIdx ? 'bg-[#800000]' : 'bg-slate-100'}`} />}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Recap of what was submitted */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Submitted details</p>
            <div className="space-y-2 text-sm">
              <Row label="Name" value={fullName} />
              <Row label="Position" value={p.position} />
              <Row label="Department" value={p.department} />
              {session.submittedAt && <Row label="Submitted on" value={new Date(session.submittedAt).toLocaleString()} />}
            </div>
          </div>

          {/* Contact + auto-refresh note */}
          <div className="text-center space-y-2">
            <p className="text-[12px] text-slate-500">Questions? Contact the <b>Office of the Head Administrator</b>.</p>
            <p className="text-[11px] text-slate-400">This page updates automatically once your profile is verified.</p>
          </div>
        </div>
      </Shell>
    );
  }

  // ---- STATE 1b: returned, but out of resubmission attempts ----
  if (resubmitLocked) {
    return (
      <Shell session={session} onLogout={logoutAndLeave}>
        <Panel
          tone="red"
          title="Resubmission limit reached"
          text={`You have used all ${RESUBMIT_LIMIT} resubmission attempts for your profile. Please contact the Head Administrator's office to proceed.`}
        >
          {session.returnNote && <p className="text-sm text-slate-700 bg-white/70 rounded-lg px-4 py-3 text-left"><b>Last note from the Head Administrator:</b> {session.returnNote}</p>}
        </Panel>
      </Shell>
    );
  }

  // ---- STATE 1: the form (pending_profile, possibly returned for correction) ----
  return (
    <Shell session={session} onLogout={logoutAndLeave}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-[#2D3748]">Complete Your Staff Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill out the required fields (<span className="text-[#800000]">*</span>) and set a new password.
            Your account will be reviewed by the Head Administrator before you can access the portal.
          </p>
        </header>

        {session.returnNote && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <p className="font-bold mb-1">Returned for correction</p>
            <p>{session.returnNote}</p>
            <p className="mt-2 text-[13px]">Resubmissions left: <b>{resubmitsLeft} of {RESUBMIT_LIMIT}</b>. Fix the items above, then submit again.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Account & Security */}
          <Section title="Account & Security">
            <div>
              <Field label="New Password *"><input type="password" value={password.newPassword}
                onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} className="ip" placeholder="Set a strong password" /></Field>
              <ul className="mt-2 space-y-1">
                {Object.entries(passwordChecks(password.newPassword, session.role)).map(([label, ok]) => (
                  <li key={label} className={`flex items-center gap-2 text-[12px] font-medium ${ok ? 'text-[#48A675]' : 'text-slate-400'}`}><span>{ok ? '✓' : '•'}</span> {label}</li>
                ))}
              </ul>
            </div>
            <Field label="Confirm Password *"><input type="password" value={password.confirmPassword}
              onChange={(e) => setPassword({ ...password, confirmPassword: e.target.value })} className="ip" placeholder="Re-type password" /></Field>
          </Section>

          {/* Personal */}
          <Section title="Personal Information">
            <Field label="Profile Photo (ID picture)">
              <div className="flex items-center gap-4">
                {form.photo
                  ? <img src={form.photo} alt="preview" className="w-14 h-14 rounded-lg object-cover border" />
                  : <div className="w-14 h-14 rounded-lg bg-gray-100 border flex items-center justify-center text-[10px] text-gray-400">None</div>}
                <input type="file" accept="image/*" onChange={handlePhoto} className="text-xs" />
              </div>
            </Field>
            <div className="hidden md:block" />
            <Field label="First Name *"><input value={form.firstName} onChange={setClean('firstName', nameClean)} onBlur={blurTitle('firstName')} maxLength={50} className="ip" /></Field>
            <Field label="Middle Name"><input value={form.middleName} onChange={setClean('middleName', nameClean)} onBlur={blurTitle('middleName')} maxLength={50} className="ip" /></Field>
            <Field label="Last Name *"><input value={form.lastName} onChange={setClean('lastName', nameClean)} onBlur={blurTitle('lastName')} maxLength={50} className="ip" /></Field>
            <Field label="Sex *">
              <select value={form.sex} onChange={set('sex')} className="ip"><option value="">Select</option><option>Male</option><option>Female</option></select>
            </Field>
            <Field label="Date of Birth *"><input type="date" max={TODAY_ISO} value={form.dob} onChange={set('dob')} className="ip" /></Field>
            <Field label="Civil Status">
              <select value={form.civilStatus} onChange={set('civilStatus')} className="ip"><option value="">Select</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option></select>
            </Field>
            <Field label="Nationality"><input value={form.nationality} onChange={setClean('nationality', nameClean)} onBlur={blurTitle('nationality')} maxLength={40} className="ip" /></Field>
          </Section>

          {/* Contact */}
          <Section title="Contact Information">
            <Field label="Mobile Number *"><input value={form.mobile} onChange={setClean('mobile', (v) => onlyDigits(v, 11))} inputMode="numeric" maxLength={11} className="ip" placeholder="09171234567" /></Field>
            <Field label="Secondary Email"><input type="email" value={form.secondaryEmail} onChange={set('secondaryEmail')} maxLength={254} className="ip" /></Field>
            <div className="md:col-span-2"><Field label="Home Address *">
              <AddressPicker value={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} />
              {form.address && !form.region && <p className="text-[11px] text-slate-400 mt-1">Currently on file: {form.address} — re-select above to update.</p>}
            </Field></div>
            <Field label="Emergency Contact Name *"><input value={form.emergencyName} onChange={setClean('emergencyName', nameClean)} onBlur={blurTitle('emergencyName')} maxLength={50} className="ip" /></Field>
            <Field label="Emergency Contact Number *"><input value={form.emergencyNumber} onChange={setClean('emergencyNumber', (v) => onlyDigits(v, 11))} inputMode="numeric" maxLength={11} className="ip" placeholder="09171234567" /></Field>
          </Section>

          {/* Employment */}
          <Section title="Employment Details">
            <Field label="Employee ID *"><input value={form.employeeId} onChange={setClean('employeeId', idClean)} autoComplete="off" maxLength={20} className="ip" placeholder="e.g. 2024-00892" /></Field>
            <Field label="Position / Job Title *"><input value={form.position} onChange={set('position')} maxLength={60} className="ip" /></Field>
            <Field label="Department / Office *"><input value={form.department} onChange={set('department')} maxLength={60} className="ip" /></Field>
            <Field label="Date Hired *"><input type="date" max={TODAY_ISO} value={form.dateHired} onChange={set('dateHired')} className="ip" /></Field>
            <Field label="Employment Type *">
              <select value={form.employmentType} onChange={set('employmentType')} className="ip"><option value="">Select</option><option>Full-time</option><option>Part-time</option><option>Contractual</option></select>
            </Field>
            <Field label="Immediate Supervisor"><input value={form.supervisor} onChange={setClean('supervisor', nameClean)} onBlur={blurTitle('supervisor')} maxLength={50} className="ip" /></Field>
          </Section>

          {/* Credentials */}
          <Section title="Credentials & Qualifications">
            <Field label="Highest Educational Attainment *"><input value={form.education} onChange={set('education')} maxLength={80} className="ip" placeholder="e.g. Bachelor's Degree" /></Field>
            <Field label="Course / Degree"><input value={form.course} onChange={set('course')} maxLength={80} className="ip" /></Field>
            <Field label="PRC License No. (if applicable)"><input value={form.prcLicense} onChange={setClean('prcLicense', idClean)} maxLength={20} className="ip" /></Field>
            <Field label="Certifications"><input value={form.certifications} onChange={set('certifications')} maxLength={120} className="ip" /></Field>
          </Section>

          <div className="flex justify-end gap-3 pt-2">
            <button type="submit" disabled={submitting} className="px-10 py-3 bg-[#800000] hover:bg-[#600000] disabled:opacity-60 text-white rounded-xl font-bold text-sm shadow-md cursor-pointer">
              {submitting ? 'Submitting…' : wasReturned ? `Resubmit for Verification (${resubmitsLeft} of ${RESUBMIT_LIMIT} left)` : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .ip { width:100%; height:2.75rem; border:1px solid #E5E7EB; border-radius:0.75rem; padding:0 0.9rem; font-size:0.875rem; background:#fff; outline:none; }
        .ip:focus { border-color:#800000; }
      `}</style>
    </Shell>
  );
};

// --- small presentational helpers -------------------------------------------
const Shell = ({ session, onLogout, children }) => (
  <div className="min-h-screen bg-[#F3F4F6]">
    <div className="bg-white border-b border-gray-200 px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <img src={AcademyLogo} alt="Academy" className="w-10 h-10 rounded-full object-cover" />
        <div>
          <p className="text-[11px] font-black uppercase tracking-tight text-[#800000] leading-none">NSDGA · {session.role} Onboarding</p>
          <p className="text-[11px] text-slate-400 mt-1">{session.email}</p>
        </div>
      </div>
      <button onClick={onLogout} className="text-sm font-bold text-slate-500 hover:text-[#800000] cursor-pointer">Logout</button>
    </div>
    <div className="px-4 md:px-12 py-8 md:py-12">{children}</div>
  </div>
);

const Section = ({ title, children }) => (
  <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8">
    <h2 className="text-sm font-black uppercase tracking-wide text-slate-700 border-b border-gray-100 pb-3 mb-6">{title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">{children}</div>
  </section>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">
      {label.includes('*') ? <>{label.replace('*', '')}<span className="text-[#800000]">*</span></> : label}
    </span>
    {children}
  </label>
);

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="text-slate-400">{label}</span>
    <span className="font-semibold text-slate-700 text-right">{value || '—'}</span>
  </div>
);

const Panel = ({ tone, title, text, children }) => {
  const tones = { green: 'bg-green-50 border-green-200', amber: 'bg-amber-50 border-amber-200', red: 'bg-red-50 border-red-200' };
  return (
    <div className="max-w-xl mx-auto mt-6">
      <div className={`rounded-2xl border ${tones[tone]} p-8 md:p-10 text-center`}>
        <h1 className="text-2xl font-black text-slate-800 mb-3">{title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-8">{text}</p>
        {children}
      </div>
    </div>
  );
};

export default ProfileSetup;
