// src/components/pages/StaffProfile/ProfileSetup.jsx
// Shared onboarding page for Registrar & Admin employees. One component serves
// both roles (role is read from the session). It shows one of three states:
//   1. pending_profile        -> the profile form (+ forced new password)
//   2. pending_verification   -> "awaiting HeadAdmin verification" screen
//   3. verified               -> "you're verified" screen with a link inside
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AcademyLogo from '../../../assets/nuestralogo.jpg';
import { useSession } from '../../../contexts/useSession';
import { submitProfile, ROLE_HOME, STATUS } from '../../../auth/authStore';

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

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    if (!password.newPassword || password.newPassword.length < 6) {
      return setError('Please set a new password of at least 6 characters.');
    }
    if (password.newPassword !== password.confirmPassword) {
      return setError('Passwords do not match.');
    }
    const missing = REQUIRED.find((k) => !String(form[k]).trim());
    if (missing) {
      return setError('Please complete all required (*) fields before submitting.');
    }
    setSubmitting(true);
    const res = await submitProfile(session.id, form, password.newPassword);
    setSubmitting(false);
    if (!res.ok) return setError(res.error || 'Could not submit. Please try again.');
    await refresh();
    window.scrollTo(0, 0);
  };

  const status = session.status;

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
    return (
      <Shell session={session} onLogout={logoutAndLeave}>
        <Panel
          tone="amber"
          title="Profile submitted — awaiting verification ⏳"
          text="Thank you! Your profile has been sent to the Head Administrator for review. You'll get access to your portal once it is verified. This may take a short while."
        >
          <button onClick={() => refresh()}
            className="px-8 py-3 border border-gray-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-gray-50 cursor-pointer">
            Check status again
          </button>
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
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Account & Security */}
          <Section title="Account & Security">
            <Field label="New Password *"><input type="password" value={password.newPassword}
              onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} className="ip" placeholder="At least 6 characters" /></Field>
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
            <Field label="First Name *"><input value={form.firstName} onChange={set('firstName')} className="ip" /></Field>
            <Field label="Middle Name"><input value={form.middleName} onChange={set('middleName')} className="ip" /></Field>
            <Field label="Last Name *"><input value={form.lastName} onChange={set('lastName')} className="ip" /></Field>
            <Field label="Sex *">
              <select value={form.sex} onChange={set('sex')} className="ip"><option value="">Select</option><option>Male</option><option>Female</option></select>
            </Field>
            <Field label="Date of Birth *"><input type="date" value={form.dob} onChange={set('dob')} className="ip" /></Field>
            <Field label="Civil Status">
              <select value={form.civilStatus} onChange={set('civilStatus')} className="ip"><option value="">Select</option><option>Single</option><option>Married</option><option>Widowed</option><option>Separated</option></select>
            </Field>
            <Field label="Nationality"><input value={form.nationality} onChange={set('nationality')} className="ip" /></Field>
          </Section>

          {/* Contact */}
          <Section title="Contact Information">
            <Field label="Mobile Number *"><input value={form.mobile} onChange={set('mobile')} className="ip" placeholder="09XX-XXX-XXXX" /></Field>
            <Field label="Secondary Email"><input type="email" value={form.secondaryEmail} onChange={set('secondaryEmail')} className="ip" /></Field>
            <div className="md:col-span-2"><Field label="Home Address *"><input value={form.address} onChange={set('address')} className="ip" placeholder="House No., Street, Brgy, City, Province" /></Field></div>
            <Field label="Emergency Contact Name *"><input value={form.emergencyName} onChange={set('emergencyName')} className="ip" /></Field>
            <Field label="Emergency Contact Number *"><input value={form.emergencyNumber} onChange={set('emergencyNumber')} className="ip" /></Field>
          </Section>

          {/* Employment */}
          <Section title="Employment Details">
            <Field label="Employee ID *"><input value={form.employeeId} onChange={set('employeeId')} className="ip" /></Field>
            <Field label="Position / Job Title *"><input value={form.position} onChange={set('position')} className="ip" /></Field>
            <Field label="Department / Office *"><input value={form.department} onChange={set('department')} className="ip" /></Field>
            <Field label="Date Hired *"><input type="date" value={form.dateHired} onChange={set('dateHired')} className="ip" /></Field>
            <Field label="Employment Type *">
              <select value={form.employmentType} onChange={set('employmentType')} className="ip"><option value="">Select</option><option>Full-time</option><option>Part-time</option><option>Contractual</option></select>
            </Field>
            <Field label="Immediate Supervisor"><input value={form.supervisor} onChange={set('supervisor')} className="ip" /></Field>
          </Section>

          {/* Credentials */}
          <Section title="Credentials & Qualifications">
            <Field label="Highest Educational Attainment *"><input value={form.education} onChange={set('education')} className="ip" placeholder="e.g. Bachelor's Degree" /></Field>
            <Field label="Course / Degree"><input value={form.course} onChange={set('course')} className="ip" /></Field>
            <Field label="PRC License No. (if applicable)"><input value={form.prcLicense} onChange={set('prcLicense')} className="ip" /></Field>
            <Field label="Certifications"><input value={form.certifications} onChange={set('certifications')} className="ip" /></Field>
          </Section>

          {/* Government IDs (optional) */}
          <Section title="Government IDs (optional)">
            <Field label="TIN"><input value={form.tin} onChange={set('tin')} className="ip" /></Field>
            <Field label="SSS"><input value={form.sss} onChange={set('sss')} className="ip" /></Field>
            <Field label="PhilHealth"><input value={form.philhealth} onChange={set('philhealth')} className="ip" /></Field>
            <Field label="Pag-IBIG"><input value={form.pagibig} onChange={set('pagibig')} className="ip" /></Field>
          </Section>

          <div className="flex justify-end gap-3 pt-2">
            <button type="submit" disabled={submitting} className="px-10 py-3 bg-[#800000] hover:bg-[#600000] disabled:opacity-60 text-white rounded-xl font-bold text-sm shadow-md cursor-pointer">
              {submitting ? 'Submitting…' : 'Submit for Verification'}
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

const Panel = ({ tone, title, text, children }) => {
  const tones = { green: 'bg-green-50 border-green-200', amber: 'bg-amber-50 border-amber-200' };
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
