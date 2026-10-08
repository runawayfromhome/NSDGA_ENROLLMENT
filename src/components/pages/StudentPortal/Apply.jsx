// Online Admission wizard — account-first flow.
//   1 Account Creation → creates the account + a DRAFT application, signs in
//   2 Personal Information (+ parent/guardian)
//   3 Grade & Type
//   4 Academic Background
//   5 Document Submission (uploads run while authenticated)
//   6 Review → Submit → emails a 6-digit code → /StudentPortal/VerifyOtp
// A logged-in applicant with a 'draft' resumes where they left off.
import { useEffect, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import AcademyLogo from '../../../assets/nuestralogo.jpg';
import NuestraLogoImage from '../../../assets/nuestradg.png';
import {
  createApplicantAccount, saveApplicationDraft, requestSignupOtp,
  getMyApplication, uploadStudentDoc, CURRENT_SCHOOL_YEAR, isEnrolledStatus, studentSignOut,
} from '../../../lib/student';
import { getEnrollment, isEnrollmentOpen, getStrands } from '../../../lib/content';
import { GRADES_BY_LEVEL, prevGrade } from '../../../lib/grades';
import { validatePassword } from '../../../lib/password';
import ChatbotWidget from '../../ChatbotWidget';
import AddressPicker from '../../AddressPicker';
import Turnstile from '../../Turnstile';

const LEVELS = ['Elementary', 'Junior High School', 'Senior High School'];
const TYPES = ['New Student', 'Transferee', 'Returnee'];
const SUFFIXES = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];
const TODAY_ISO = new Date().toISOString().slice(0, 10); // for the max birth date (no future)

// Account-first no more: Step 1 collects account INFO (no email/password, no
// account yet); the real account is created at Step 5 "Account Creation" (email
// + password), which must come BEFORE Documents since uploads need a session.
const STEP_KEYS = ['account', 'personal', 'grade', 'academic', 'create', 'documents', 'review'];
const STEP_LABELS = {
  account: 'Account Information', personal: 'Personal Information', grade: 'Grade & Type',
  academic: 'Academic Background', create: 'Account Creation', documents: 'Document Submission', review: 'Review Information',
};
const DOCS = [
  { key: 'photo', label: '2x2 Picture', hint: 'High-quality, white background', required: true },
  { key: 'psa', label: 'PSA Birth Certificate', hint: 'Clear copy from PSA', required: true },
  { key: 'reportCard', label: 'Report Card', hint: 'Scanned copy of latest grades', required: true },
  { key: 'goodMoral', label: 'Good Moral Cert', hint: 'From previous school principal', required: false },
  // Form 137 is NOT uploaded here — it is confidential and transmitted school-to-school.
  { key: 'kinderCert', label: 'Kinder Cert / ECCD Checklist', hint: 'Certificate of completion (if any)', required: false, grade1Only: true },
];
// Incoming Grade 1 (from Kindergarten) has no GWA / Form 137, and may have no
// LRN yet — only these documents are required for them.
const GRADE1_REQUIRED_DOCS = ['photo', 'psa'];

const emptyForm = {
  firstName: '', middleName: '', lastName: '', suffix: '', lrn: '',
  sex: '', dob: '', age: '', birthplace: '', nationality: 'Filipino', religion: '', address: '', strand: '',
  region: '', province: '', city: '', barangay: '', houseStreet: '',
  regionCode: '', provinceCode: '', cityCode: '',
  fatherName: '', motherName: '', guardianName: '', guardianContact: '',
  lastSchool: '', lastSchoolAddress: '', lastGrade: '', gwa: '',
  grade: '', contact: '', schoolYear: CURRENT_SCHOOL_YEAR,
};

const ageFromDob = (dob) => {
  if (!dob) return '';
  const d = new Date(dob); if (isNaN(d)) return '';
  const t = new Date(); let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a >= 0 && a < 120 ? String(a) : '';
};

// Local draft autosave — keeps typed input safe across a dropped connection or a
// closed tab. NEVER stores the password; auto-expires after 12h; cleared on
// submit. On a shared computer nothing sensitive lingers (no credentials, TTL).
const DRAFT_KEY = 'nsdga_apply_draft';
const DRAFT_TTL = 12 * 60 * 60 * 1000; // 12 hours
const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const b = JSON.parse(raw);
    if (!b || (b.ts && Date.now() - b.ts > DRAFT_TTL)) { localStorage.removeItem(DRAFT_KEY); return null; }
    return b;
  } catch { return null; }
};
const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } };

// --- Input limiters (client-side hardening for robust/stress testing) --------
const onlyDigits = (v, max) => String(v).replace(/\D/g, '').slice(0, max);   // numbers only, capped
const gwaClean = (v) => {                                                     // digits + one decimal, max 5
  let s = String(v).replace(/[^\d.]/g, '');
  const i = s.indexOf('.');
  if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');
  return s.slice(0, 5);
};
const PHONE_RE = /^09\d{9}$/; // PH mobile: 11 digits starting with 09
const GMAIL_RE = /^[a-z0-9][a-z0-9._%+-]*@gmail\.com$/i; // must be a @gmail.com address
// Names: letters + space, hyphen, apostrophe, period, ñ — no digits/symbols.
const nameClean = (v, max = 50) => String(v).replace(/[^A-Za-zñÑ .'-]/g, '').replace(/\s{2,}/g, ' ').slice(0, max);
// Places (City, Province): letters + space, comma, period, hyphen — no digits.
const placeClean = (v, max = 100) => String(v).replace(/[^A-Za-zñÑ .,'-]/g, '').replace(/\s{2,}/g, ' ').slice(0, max);

// Title-case a name on blur, keeping Filipino/Spanish particles lowercase mid-name
// ("juan dela cruz" → "Juan dela Cruz") and capitalising after hyphens/apostrophes
// ("maria-clara d'cruz" → "Maria-Clara D'Cruz").
const NAME_PARTICLES = new Set(['dela', 'delas', 'delos', 'de', 'del', 'da', 'di', 'van', 'von', 'la', 'le', 'los', 'las', 'y', 'ng', 'bin', 'al']);
const titleCaseName = (v) => String(v).trim().replace(/\s+/g, ' ').split(' ').map((w, i) => {
  const lower = w.toLowerCase();
  if (i > 0 && NAME_PARTICLES.has(lower)) return lower;
  return lower.replace(/(^|[-'])([a-zñ])/g, (_m, sep, ch) => sep + ch.toUpperCase());
}).join(' ');

// Password strength (0–4) for the live meter.
const pwScore = (pw) => {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  return s;
};
const PwMeter = ({ pw }) => {
  if (!pw) return null;
  const score = pwScore(pw);
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-1.5 flex-1 rounded" style={{ background: i < score ? colors[score] : '#e5e7eb' }} />)}
      </div>
      <p className="text-[11px] mt-1 font-semibold" style={{ color: colors[score] }}>{labels[score]}</p>
    </div>
  );
};

const Apply = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [appId, setAppId] = useState(null);      // set once the account exists
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState('');
  const [studentType, setStudentType] = useState('New Student');
  const [acct, setAcct] = useState({ email: '', password: '', confirm: '', phone: '' });
  const [f, setF] = useState(emptyForm);
  const [docs, setDocs] = useState({});           // { key: {name,status} }
  const [noLrn, setNoLrn] = useState(false);       // incoming Grade 1 with no LRN yet
  const [agreedAccount, setAgreedAccount] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(''); // Cloudflare Turnstile
  const [captchaKey, setCaptchaKey] = useState(0);       // bump to remount → fresh token
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const [enrollment, setEnrollment] = useState(null);
  const [shsStrands, setShsStrands] = useState([]); // SHS courses, managed by Admin

  // Resume a draft if the applicant is already signed in.
  useEffect(() => {
    (async () => {
      const enr = await getEnrollment();
      setEnrollment(enr);
      getStrands().then(setShsStrands);
      const activeSY = enr?.activeSchoolYear || CURRENT_SCHOOL_YEAR;
      const saved = readDraft(); // unsaved local edits, if any
      const app = await getMyApplication();
      if (app) {
        if (app.status === 'draft') {
          setAppId(app.id);
          setLevel(app.grade_level || '');
          setStudentType(app.student_type || 'New Student');
          // Server draft is the base; overlay any newer unsaved local edits for
          // THIS application only (ignore a draft left by a different account).
          const base = { ...emptyForm, schoolYear: activeSY, ...(app.form || {}) };
          if (saved && (!saved.appId || saved.appId === app.id)) {
            setF({ ...base, ...(saved.f || {}) });
            if (saved.level) setLevel(saved.level);
            if (saved.studentType) setStudentType(saved.studentType);
            if (typeof saved.noLrn === 'boolean') setNoLrn(saved.noLrn);
            setAcct((p) => ({ ...p, email: saved.email || '', phone: saved.phone || p.phone }));
          } else {
            setF(base);
          }
          setDocs(app.documents || {});
          setStep(STEP_KEYS.indexOf('documents')); // account already created → resume at Documents
        } else {
          clearDraft();
          navigate(isEnrolledStatus(app.status) ? '/StudentPortal/Dashboard' : '/StudentPortal/ApplicationStatus', { replace: true });
          return;
        }
      } else if (saved && !saved.appId) {
        // Fresh applicant, no account yet — restore pre-account typing (no password).
        setF({ ...emptyForm, schoolYear: activeSY, ...(saved.f || {}) });
        setLevel(saved.level || '');
        setStudentType(saved.studentType || 'New Student');
        setNoLrn(!!saved.noLrn);
        setAcct((p) => ({ ...p, email: saved.email || '', phone: saved.phone || '' }));
      } else {
        // Fresh applicant: file under the school year the Admin has set active.
        setF((p) => ({ ...p, schoolYear: activeSY }));
      }
      setReady(true);
    })();
  }, [navigate]);

  // Autosave the wizard (never the password) so a dropped connection or closed
  // tab doesn't lose typed input. Cleared on submit + when a draft is finalized.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        appId, level, studentType, noLrn, f, email: acct.email, phone: acct.phone, ts: Date.now(),
      }));
    } catch { /* storage disabled/full — ignore */ }
  }, [ready, appId, level, studentType, noLrn, f, acct.email, acct.phone]);

  const current = STEP_KEYS[step];
  const isSHS = level === 'Senior High School';
  const isGrade1 = f.grade === 'Grade 1';
  const docRequired = (d) => (isGrade1 ? GRADE1_REQUIRED_DOCS.includes(d.key) : d.required);
  const visibleDocs = DOCS.filter((d) => (d.grade1Only ? isGrade1 : true));
  const accountDone = !!appId;
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const validate = () => {
    setError('');
    if (current === 'account') {
      if (!f.firstName.trim() || !f.lastName.trim()) return 'First and last name are required.';
      if (!noLrn && !f.lrn) return 'LRN is required (or tick "No LRN yet").';
      if (f.lrn && !/^\d{12}$/.test(f.lrn.trim())) return 'LRN must be 12 digits.';
      if (!acct.phone) return 'Phone number is required.';
      if (!PHONE_RE.test(acct.phone)) return 'Enter a valid mobile number (09XXXXXXXXX).';
    }
    if (current === 'create') {
      if (!acct.email) return 'Email is required.';
      if (!GMAIL_RE.test(acct.email.trim())) return 'Please use a valid Gmail address (must end with @gmail.com).';
      { const v = validatePassword(acct.password, 'student'); if (!v.ok) return v.error; }
      if (acct.password !== acct.confirm) return 'Passwords do not match.';
      if (!agreedAccount) return 'Please agree to the Terms of Service and Privacy Policy.';
      if (!captchaToken) return 'Please complete the "I\'m not a robot" check.';
    }
    if (current === 'personal') {
      if (!f.sex || !f.dob) return 'Sex and date of birth are required.';
      if (!f.birthplace.trim()) return 'Birthplace is required.';
      if (!f.region || !f.city || !f.barangay || !f.houseStreet?.trim()) return 'Please complete your home address (region, city, barangay, and house no. & street).';
      if (f.guardianContact && !PHONE_RE.test(f.guardianContact)) return "Guardian's contact must be a valid mobile number (09XXXXXXXXX).";
    }
    if (current === 'grade') {
      if (!level) return 'Please choose an education level.';
      if (!f.grade) return 'Please choose the grade level.';
      if (isSHS && !f.strand) return 'Please choose a Senior High strand.';
    }
    if (current === 'academic' && !isGrade1) {
      if (!f.lastSchool.trim() || !f.lastSchoolAddress.trim()) return 'Previous school and its address are required.';
      if (!f.lastGrade) return 'Last grade completed is required.';
      if (f.gwa && (isNaN(+f.gwa) || +f.gwa < 0 || +f.gwa > 100)) return 'GWA must be a number from 0 to 100.';
    }
    if (current === 'documents') {
      const missing = DOCS.filter((d) => docRequired(d) && !docs[d.key]?.path).map((d) => d.label);
      if (missing.length) return 'Please upload: ' + missing.join(', ') + '.';
    }
    return '';
  };

  // Persist the current step's data onto the draft.
  const persist = async () => {
    if (!appId) return { ok: true };
    const form = { ...f, contact: acct.phone || f.contact, age: f.age || ageFromDob(f.dob) };
    return saveApplicationDraft(appId, { form, grade_level: level || null, student_type: studentType });
  };

  const next = async () => {
    const m = validate(); if (m) return setError(m);
    setBusy(true); setError('');
    if (current === 'create' && !accountDone) {
      const res = await createApplicantAccount({
        firstName: f.firstName, middleName: f.middleName, lastName: f.lastName, suffix: f.suffix,
        lrn: f.lrn.trim(), email: acct.email, phone: acct.phone, password: acct.password,
        schoolYear: f.schoolYear || enrollment?.activeSchoolYear || CURRENT_SCHOOL_YEAR,
        captchaToken,
      });
      if (!res.ok) { setBusy(false); setCaptchaToken(''); setCaptchaKey((k) => k + 1); return setError(res.error || 'Could not create your account.'); }
      setAppId(res.appId);
      // Push everything already collected in Steps 1–4 onto the fresh draft.
      const form = { ...f, contact: acct.phone || f.contact, age: f.age || ageFromDob(f.dob) };
      await saveApplicationDraft(res.appId, { form, grade_level: level || null, student_type: studentType });
      setBusy(false);
      setStep((s) => s + 1); // → Document Submission
      return;
    }
    await persist();
    setBusy(false);
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1));
  };
  // Once the account exists, earlier steps are locked — you can't un-create it;
  // navigation stays within Documents ↔ Review.
  const back = () => { setError(''); setStep((s) => Math.max(s - 1, accountDone ? STEP_KEYS.indexOf('documents') : 0)); };

  // Log out + discard this draft so a different person can create a new account.
  const startOver = async () => {
    if (!window.confirm('Start over?\n\nThis logs you out and leaves this draft, so you can create a new account with a different email. Your typed progress here will be cleared.')) return;
    clearDraft();
    await studentSignOut();
    window.location.assign('/StudentPortal/Apply');
  };

  const onUpload = async (key, file) => {
    if (!file || !appId) return;
    if (file.size > 5 * 1024 * 1024) return setError(`${file.name} is over 5MB.`);
    if (!/\.(jpe?g|png|pdf)$/i.test(file.name)) return setError('Only JPG, PNG or PDF files are allowed.');
    setUploading(key); setError('');
    const res = await uploadStudentDoc(appId, key, file);
    setUploading('');
    if (!res.ok) return setError(res.error || 'Upload failed.');
    setDocs(res.documents);
  };

  const submit = async () => {
    if (!agreedPrivacy) return setError('Please certify and agree to the Data Privacy Act terms.');
    setBusy(true); setError('');
    const p = await persist();
    if (!p.ok) { setBusy(false); return setError(p.error || 'Could not save your application.'); }
    const otp = await requestSignupOtp();
    setBusy(false);
    if (!otp.ok) return setError(otp.error || 'Could not send your verification code.');
    clearDraft();
    navigate('/StudentPortal/VerifyOtp');
  };

  if (!ready) return <Shell><p className="text-slate-400 text-sm">Loading…</p></Shell>;

  if (!accountDone && enrollment && !isEnrollmentOpen(enrollment)) {
    return (
      <Shell steps={STEP_KEYS.map((k) => STEP_LABELS[k])} step={0}>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-100 flex items-center justify-center text-3xl">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admission is currently closed</h2>
          <p className="text-gray-500 max-w-md mx-auto">{enrollment.closedMessage}</p>
          <NavLink to="/StudentPortal/Login" className="inline-block mt-6 text-[#800000] font-bold">Already applied? Log in →</NavLink>
        </div>
      </Shell>
    );
  }

  return (
    <Shell steps={STEP_KEYS.map((k) => STEP_LABELS[k])} step={step}
      chatContext={`The user is on the NSDGA online admission application page. The Senior High strands currently offered by the school are: ${shsStrands.join(', ') || '(see the strand dropdown on the form)'}. Use exactly this list if asked about available strands.`}>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Online Admission</h2>
          <p className="text-gray-500 text-sm mt-1">{STEP_LABELS[current]}</p>
        </div>
        {accountDone && <button type="button" onClick={startOver} className="shrink-0 mt-1 text-xs font-bold text-slate-400 hover:text-[#800000] cursor-pointer">Not you? Start over</button>}
      </div>

      {current !== 'review' && <p className="text-xs text-gray-400 mb-4">Please fill out all required fields marked with an asterisk (*).</p>}
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

      {/* STEP 1 — Account */}
      {current === 'account' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" req><input className="ip" value={f.firstName} onChange={(e) => set('firstName', nameClean(e.target.value))} onBlur={(e) => set('firstName', titleCaseName(e.target.value))} placeholder="Juan Miguel" maxLength={50} /></Field>
            <Field label="Last Name" req><input className="ip" value={f.lastName} onChange={(e) => set('lastName', nameClean(e.target.value))} onBlur={(e) => set('lastName', titleCaseName(e.target.value))} placeholder="Dela Cruz" maxLength={50} /></Field>
            <Field label="Middle Name (if any)"><input className="ip" value={f.middleName} onChange={(e) => set('middleName', nameClean(e.target.value))} onBlur={(e) => set('middleName', titleCaseName(e.target.value))} placeholder="Ponce" maxLength={50} /></Field>
            <Field label="Suffix (if any)"><select className="ip" value={f.suffix} onChange={(e) => set('suffix', e.target.value)}><option value="">— None —</option>{SUFFIXES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
          </div>
          <Field label="LRN Number" req={!noLrn}>
            <input className="ip" value={f.lrn} onChange={(e) => set('lrn', onlyDigits(e.target.value, 12))} placeholder="136676090147" inputMode="numeric" maxLength={12} disabled={noLrn} />
            <label className="flex items-center gap-2 text-[12px] text-gray-500 cursor-pointer mt-2">
              <input type="checkbox" checked={noLrn} onChange={(e) => { setNoLrn(e.target.checked); if (e.target.checked) set('lrn', ''); }} className="accent-[#800000] w-3.5 h-3.5" />
              Wala pa akong LRN (incoming Grade 1 / hindi nag-Kinder)
            </label>
          </Field>
          <Field label="Phone Number" req><input className="ip" value={acct.phone} onChange={(e) => setAcct({ ...acct, phone: onlyDigits(e.target.value, 11) })} placeholder="09171234567" inputMode="numeric" maxLength={11} /></Field>
          <p className="text-center text-gray-500 text-sm pt-1">Already have an account? <NavLink to="/StudentPortal/Login" className="text-[#800000] font-bold">Login</NavLink></p>
        </div>
      )}

      {/* STEP 2 — Personal + guardian */}
      {current === 'personal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Sex" req>
              <select className="ip" value={f.sex} onChange={(e) => set('sex', e.target.value)}><option value="">Select Sex</option><option>Male</option><option>Female</option></select>
            </Field>
            <Field label="Age"><input className="ip" value={f.age} onChange={(e) => set('age', onlyDigits(e.target.value, 3))} inputMode="numeric" placeholder="Auto-fills from birth date" /></Field>
            <Field label="Date of Birth" req><input className="ip" type="date" max={TODAY_ISO} value={f.dob} onChange={(e) => { const v = e.target.value; setF((p) => ({ ...p, dob: v, age: ageFromDob(v) })); }} /></Field>
            <Field label="Birthplace" req><input className="ip" value={f.birthplace} onChange={(e) => set('birthplace', placeClean(e.target.value))} placeholder="City, Province" maxLength={100} /></Field>
            <Field label="Nationality"><input className="ip" value={f.nationality} onChange={(e) => set('nationality', nameClean(e.target.value))} onBlur={(e) => set('nationality', titleCaseName(e.target.value))} placeholder="Filipino" maxLength={40} /></Field>
            <Field label="Religion"><input className="ip" value={f.religion} onChange={(e) => set('religion', nameClean(e.target.value))} onBlur={(e) => set('religion', titleCaseName(e.target.value))} placeholder="e.g. Roman Catholic" maxLength={50} /></Field>
          </div>
          <div>
            <p className="font-semibold text-xs text-gray-600 mb-2">Home Address <span className="text-red-500">*</span></p>
            <AddressPicker value={f} onChange={(patch) => setF((p) => ({ ...p, ...patch }))} />
          </div>
          <div className="pt-2">
            <p className="font-bold text-sm text-gray-700 mb-3">Parent / Guardian</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Father's Name"><input className="ip" value={f.fatherName} onChange={(e) => set('fatherName', nameClean(e.target.value))} onBlur={(e) => set('fatherName', titleCaseName(e.target.value))} maxLength={50} /></Field>
              <Field label="Mother's Name"><input className="ip" value={f.motherName} onChange={(e) => set('motherName', nameClean(e.target.value))} onBlur={(e) => set('motherName', titleCaseName(e.target.value))} maxLength={50} /></Field>
              <Field label="Guardian's Name"><input className="ip" value={f.guardianName} onChange={(e) => set('guardianName', nameClean(e.target.value))} onBlur={(e) => set('guardianName', titleCaseName(e.target.value))} maxLength={50} /></Field>
              <Field label="Guardian's Contact"><input className="ip" value={f.guardianContact} onChange={(e) => set('guardianContact', onlyDigits(e.target.value, 11))} placeholder="09171234567" inputMode="numeric" maxLength={11} /></Field>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — Grade & Type */}
      {current === 'grade' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Education Level" req>
            <select className="ip" value={level} onChange={(e) => { setLevel(e.target.value); set('grade', ''); }}>
              <option value="">Select…</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Grade Level Applying For" req>
            <select className="ip" value={f.grade}
              onChange={(e) => {
                const g = e.target.value;
                setF((p) => ({ ...p, grade: g, lastGrade: prevGrade(g), ...(g === 'Grade 1' ? { gwa: '' } : {}) }));
              }} disabled={!level}>
              <option value="">Select…</option>{(GRADES_BY_LEVEL[level] || []).map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Student Type" req>
            <select className="ip" value={studentType} onChange={(e) => setStudentType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          {isSHS && (
            <Field label="Preferred Strand" req>
              <select className="ip" value={f.strand} onChange={(e) => set('strand', e.target.value)}><option value="">Select…</option>{shsStrands.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
          )}
        </div>
      )}

      {/* STEP 4 — Academic */}
      {current === 'academic' && (
        <div className="space-y-4">
          {isGrade1 && (
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-[12px] text-blue-700">
              Incoming Grade 1 — academic records &amp; GWA are not required. Just your Kindergarten details (if any).
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={isGrade1 ? 'Kindergarten School (if any)' : 'Previous School Attended'} req={!isGrade1}>
              <input className="ip" value={f.lastSchool} onChange={(e) => set('lastSchool', e.target.value)} placeholder={isGrade1 ? 'Name of Kinder school' : 'FEU ROOSEVELT'} maxLength={120} />
            </Field>
            {!isGrade1 && (
              <Field label="GWA (General Weighted Average)" req><input className="ip" value={f.gwa} onChange={(e) => set('gwa', gwaClean(e.target.value))} placeholder="95" inputMode="decimal" maxLength={5} /></Field>
            )}
          </div>
          <Field label="School Address" req={!isGrade1}><input className="ip" value={f.lastSchoolAddress} onChange={(e) => set('lastSchoolAddress', e.target.value)} placeholder="504 J. P. Rizal St, Marikina" maxLength={200} /></Field>
          <Field label="Last Grade Completed">
            <input className="ip bg-gray-50" value={f.lastGrade} readOnly placeholder="Auto from the grade you're applying for" />
          </Field>
        </div>
      )}

      {/* STEP 5 — Account Creation (email + password → creates the account here) */}
      {current === 'create' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3 text-[12px] text-amber-700">
            Set your login credentials. Your account is created now so you can upload your documents in the next step — you'll confirm it with an email code before the application is finally submitted.
          </div>
          <Field label="Email (Gmail)" req>
            <input className="ip" type="email" value={acct.email} onChange={(e) => setAcct({ ...acct, email: e.target.value.replace(/\s/g, '') })} placeholder="juandelacruz@gmail.com" maxLength={254} />
            <span className="block text-[11px] text-gray-400 mt-1.5">Must be a valid Gmail address ending in <b>@gmail.com</b>.</span>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Password" req>
              <div className="relative">
                <input className="ip pr-16" type={showPw ? 'text' : 'password'} value={acct.password} onChange={(e) => setAcct({ ...acct, password: e.target.value })} placeholder="At least 8 characters" maxLength={64} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#800000]">{showPw ? 'Hide' : 'Show'}</button>
              </div>
              <PwMeter pw={acct.password} />
            </Field>
            <Field label="Confirm Password" req><input className="ip" type={showPw ? 'text' : 'password'} value={acct.confirm} onChange={(e) => setAcct({ ...acct, confirm: e.target.value })} placeholder="Re-type password" maxLength={64} /></Field>
          </div>
          <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer pt-1">
            <input type="checkbox" checked={agreedAccount} onChange={(e) => setAgreedAccount(e.target.checked)} className="mt-1 accent-[#800000] w-4 h-4" />
            <span>I have read and agree to the <b className="text-[#800000]">Terms of Service</b> and <b className="text-[#800000]">Privacy Policy</b> of NSDGA. <span className="text-red-500">*</span></span>
          </label>
          <div className="pt-1">
            <Turnstile key={captchaKey} onToken={setCaptchaToken} />
          </div>
        </div>
      )}

      {/* STEP 6 — Documents */}
      {current === 'documents' && (
        <div>
          <p className="text-sm text-gray-500 mb-5">Upload clear scans or photos of your original academic documents. Supported formats: JPG, PNG, PDF (Max 5MB each).</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleDocs.map((d) => {
              const up = docs[d.key];
              return (
                <div key={d.key} className={`rounded-xl border-2 border-dashed p-4 text-center ${up?.path ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200'}`}>
                  <p className="text-sm font-bold text-slate-700">{d.label} {docRequired(d) && <span className="text-red-500">*</span>}</p>
                  <p className="text-[11px] text-slate-400 mb-3">{d.hint}</p>
                  {up?.path
                    ? <p className="text-[11px] font-semibold text-emerald-600 mb-2 truncate">✓ {up.name || 'Uploaded'}</p>
                    : null}
                  <label className="inline-block px-4 py-2 rounded-lg text-[12px] font-bold bg-[#800000] text-white hover:bg-[#600000] cursor-pointer">
                    {uploading === d.key ? 'Uploading…' : up?.path ? 'Replace File' : 'Upload File'}
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => onUpload(d.key, e.target.files?.[0])} />
                  </label>
                </div>
              );
            })}
          </div>
          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-[12px] text-blue-700">
            📄 <b>Form 137</b> is <b>not uploaded here.</b> It is a confidential school record transmitted directly <b>school-to-school</b> — your previous school forwards it to NSDGA. You do not need to submit it yourself.
          </div>
        </div>
      )}

      {/* STEP 7 — Review */}
      {current === 'review' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">Please carefully review all your information below for accuracy before submitting.</p>
          <Summary title="Personal Information" rows={[
            ['Name', `${f.firstName} ${f.middleName} ${f.lastName} ${f.suffix}`.replace(/\s+/g, ' ').trim()],
            ['LRN', f.lrn], ['Email', acct.email || f.email], ['Contact', acct.phone || f.contact],
            ['Sex', f.sex], ['Age', f.age || ageFromDob(f.dob)], ['Date of Birth', f.dob], ['Birthplace', f.birthplace],
            ['Nationality', f.nationality], ['Religion', f.religion],
            ['Home Address', f.address],
          ]} />
          <Summary title="Guardian" rows={[['Father', f.fatherName], ['Mother', f.motherName], ['Guardian', f.guardianName], ['Guardian Contact', f.guardianContact]]} />
          <Summary title="Application" rows={[
            ['Education Level', level], ['Grade', f.grade], ['Student Type', studentType],
            ...(isSHS ? [['Strand', f.strand]] : []), ['School Year', f.schoolYear],
          ]} />
          <Summary title="Academic Background" rows={[
            [isGrade1 ? 'Kindergarten School' : 'Previous School', f.lastSchool],
            ['School Address', f.lastSchoolAddress], ['Last Grade Completed', f.lastGrade],
            ...(isGrade1 ? [] : [['GWA', f.gwa]]),
          ]} />
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h4 className="font-bold text-xs uppercase tracking-wide text-[#800000] mb-3">Document Requirements</h4>
            <div className="flex flex-wrap gap-2">
              {visibleDocs.map((d) => (
                <span key={d.key} className={`text-[11px] font-semibold rounded-full px-3 py-1.5 ${docs[d.key]?.path ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                  {docs[d.key]?.path ? '✓' : '—'} {d.label}
                </span>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-3 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={agreedPrivacy} onChange={(e) => setAgreedPrivacy(e.target.checked)} className="mt-1 accent-[#800000] w-4 h-4" />
            <span>I certify the information above is true and correct, and I agree to the processing of this data under the <b>Data Privacy Act of 2012</b> for admission purposes. <span className="text-red-500">*</span></span>
          </label>
        </div>
      )}

      <div className="flex items-center justify-between mt-8">
        <button type="button" onClick={back} disabled={step <= (accountDone ? STEP_KEYS.indexOf('documents') : 0)} className="px-5 py-2.5 rounded-lg font-semibold text-gray-500 disabled:opacity-0">← Back</button>
        {current === 'create'
          ? <button type="button" onClick={next} disabled={busy} className="px-8 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-lg font-bold shadow disabled:opacity-60">{busy ? 'Creating…' : 'Create Account →'}</button>
          : current === 'review'
            ? <button type="button" onClick={submit} disabled={busy} className="px-8 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-lg font-bold shadow disabled:opacity-60">{busy ? 'Submitting…' : 'Submit Application →'}</button>
            : <button type="button" onClick={next} disabled={busy} className="px-8 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-lg font-bold shadow disabled:opacity-60">{busy ? 'Saving…' : 'Next →'}</button>}
      </div>

      <style>{`.ip{width:100%;border:1px solid #E5E7EB;border-radius:.6rem;padding:.6rem .8rem;font-size:.9rem;outline:none;background:#fff}.ip:focus{border-color:#800000}`}</style>
    </Shell>
  );
};

const Shell = ({ children, steps, step, done = -1, chatContext }) => (
  <div className="flex min-h-screen w-full font-sans">
    <div className="relative hidden lg:flex lg:w-[38%] flex-col items-center justify-center p-12 text-center text-white"
      style={{ backgroundImage: `url(${NuestraLogoImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(128,0,0,0.88)' }} />
      <div className="relative z-10 flex flex-col items-center">
        <img src={AcademyLogo} alt="Logo" className="w-28 h-28 mb-6 rounded-full object-cover border-4 border-white/20" />
        <h1 className="text-3xl font-bold leading-tight mb-1">Nuestra Señora de Guia<br />Academy</h1>
        <p className="italic opacity-90 mb-10">Online Admission</p>
        {steps && (
          <ol className="w-full max-w-xs space-y-3 text-left">
            {steps.map((s, i) => {
              const complete = i < step || i === done;
              return (
                <li key={s} className={`flex items-center gap-3 text-sm ${i === step ? 'font-bold' : 'opacity-70'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${complete ? 'bg-white text-[#800000] border-white' : i === step ? 'border-white' : 'border-white/40'}`}>{complete ? '✓' : i + 1}</span>
                  {s}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
    <div className="w-full lg:w-[62%] bg-[#F9FAFB] flex flex-col justify-center px-6 md:px-16 pt-10 pb-28 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto">
        <NavLink to="/Home" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-[#800000] transition-colors mb-6">← Back to Home</NavLink>
        {children}
      </div>
    </div>
    <ChatbotWidget context={chatContext || 'The user is on the NSDGA online admission application page (applying / enrolling).'} />
  </div>
);

const Field = ({ label, req, children }) => (
  <label className="block"><span className="block font-semibold text-xs text-gray-600 mb-1.5">{label} {req && <span className="text-red-500">*</span>}</span>{children}</label>
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
