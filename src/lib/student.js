// src/lib/student.js
// Student self-apply data layer: create an applicant account + admission
// application, and read/track it. Backed by Supabase Auth + `applications`.
import { supabase } from './supabase';
import { nextGrade, nextSchoolYear, levelOfGrade, isSHSGrade } from './grades';

// The application lifecycle, in order, with friendly labels.
export const APP_STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'enrolled', label: 'Enrolled' },
];
export const STATUS_LABEL = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  needs_correction: 'Needs Correction',
  enrolled: 'Enrolled',
  rejected: 'Not Accepted',
  completed: 'Completed',
  withdrawn: 'Withdrawn',
  graduated: 'Graduated',
  archived: 'Archived',
};

export const CURRENT_SCHOOL_YEAR = '2026-2027';

// A student unlocks the FULL portal only once the Registrar enrolls them.
// Before that they are an "applicant" (draft/submitted/under_review/etc.).
export const ENROLLED_STATUSES = ['enrolled', 'completed'];
export const isEnrolledStatus = (s) => ENROLLED_STATUSES.includes(s);

// Admission documents the student must submit.
// Form 137 is intentionally excluded — it is a confidential record transmitted
// school-to-school, never uploaded or handled by the student.
export const REQUIRED_DOCS = [
  { key: 'photo', label: '2x2 Picture' },
  { key: 'reportCard', label: 'Report Card (Form 138)' },
  { key: 'psa', label: 'PSA Birth Certificate' },
  { key: 'goodMoral', label: 'Good Moral Certificate' },
];
export const DOC_STATUS_STYLE = {
  uploaded: { label: 'Uploaded', cls: 'bg-blue-50 text-blue-600' },
  verified: { label: 'Verified', cls: 'bg-emerald-50 text-emerald-600' },
  rejected: { label: 'Needs Re-upload', cls: 'bg-red-50 text-red-600' },
  none: { label: 'Not Uploaded', cls: 'bg-slate-100 text-slate-400' },
};

// Upload one document into the student's private folder + record it on the
// application's `documents` map. Returns { ok, error, documents }.
export async function uploadStudentDoc(appId, docKey, file) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'You are not signed in.' };
  const ext = (file.name.split('.').pop() || 'dat').toLowerCase();
  const path = `${user.id}/${docKey}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('student-docs')
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (upErr) return { ok: false, error: upErr.message };

  const app = await getMyApplication();
  const documents = { ...(app?.documents || {}), [docKey]: { path, name: file.name, size: file.size, uploadedAt: new Date().toISOString(), status: 'uploaded' } };
  const { error } = await supabase.from('applications').update({ documents }).eq('id', appId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, documents };
}

// A short-lived signed URL to view a private document (5 min).
export async function signedDocUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from('student-docs').createSignedUrl(path, 300);
  return error ? null : data.signedUrl;
}

// Create the applicant account + file their admission application via the
// `create-applicant` Edge Function (server-side, account already confirmed),
// then sign them in so they land on their status page. Returns { ok, error }.
export async function applyAsStudent({ email, password, contact, level, studentType, form }) {
  const clean = (email || '').trim().toLowerCase();

  const { data, error } = await supabase.functions.invoke('create-applicant', {
    body: { email: clean, password, contact, level, studentType, form },
  });
  if (error && !(data && data.error)) {
    return { ok: false, error: error.message || 'Could not submit — is the create-applicant function deployed?' };
  }
  if (data && data.error) return { ok: false, error: data.error };

  const { error: sErr } = await supabase.auth.signInWithPassword({ email: clean, password });
  if (sErr) return { ok: false, error: sErr.message };
  return { ok: true, userId: data.userId };
}

// --- New account-first signup flow ------------------------------------------
// Step 1: create the account + a DRAFT application, then sign in so the rest of
// the wizard (and document uploads) run authenticated. Returns { ok, appId }.
export async function createApplicantAccount({ firstName, middleName, lastName, suffix, lrn, email, phone, password, schoolYear }) {
  const clean = (email || '').trim().toLowerCase();
  const form = { firstName, middleName, lastName, suffix, lrn, contact: phone, schoolYear: schoolYear || CURRENT_SCHOOL_YEAR };
  const { data, error } = await supabase.functions.invoke('create-applicant', {
    body: { email: clean, password, contact: phone, level: null, studentType: null, form },
  });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'Could not create your account — is create-applicant deployed?' };
  if (data && data.error) return { ok: false, error: data.error };
  const { error: sErr } = await supabase.auth.signInWithPassword({ email: clean, password });
  if (sErr) return { ok: false, error: sErr.message };
  return { ok: true, appId: data.appId, userId: data.userId };
}

// Steps 2–5: save wizard progress onto the draft (form + grade/type columns).
export async function saveApplicationDraft(id, { form, grade_level, student_type }) {
  const patch = {};
  if (form !== undefined) patch.form = form;
  if (grade_level !== undefined) patch.grade_level = grade_level;
  if (student_type !== undefined) patch.student_type = student_type;
  const { error } = await supabase.from('applications').update(patch).eq('id', id);
  return { ok: !error, error: error?.message };
}

// Email a 6-digit code to the signed-in applicant.
export async function requestSignupOtp() {
  const { data, error } = await supabase.functions.invoke('send-otp', { body: {} });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'Could not send the code.' };
  if (data && data.error) return { ok: false, error: data.error };
  return { ok: true, sentTo: data.sentTo };
}

// Verify the code → completes registration (draft becomes submitted).
export async function verifySignupOtp(code) {
  const { data, error } = await supabase.functions.invoke('verify-otp', { body: { code } });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'Verification failed.' };
  if (data && data.error) return { ok: false, error: data.error };
  return { ok: true };
}

// Sign in an existing student (rejects non-student accounts).
export async function signInStudent(email, password) {
  const clean = (email || '').trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({ email: clean, password });
  if (error) return { ok: false, error: 'Invalid email or password.' };
  const { data: profile } = await supabase.from('profiles').select('role, disabled').eq('id', data.user.id).single();
  if (!profile || profile.role !== 'student') {
    await supabase.auth.signOut();
    return { ok: false, error: 'This is the Student portal. Please use your staff portal instead.' };
  }
  if (profile.disabled) {
    await supabase.auth.signOut();
    return { ok: false, error: 'This account has been disabled. Please contact the Registrar.' };
  }
  // Deprovisioned students (withdrawn / graduated / archived) can't log in — reversible by the Registrar.
  const { data: app } = await supabase.from('applications')
    .select('status').eq('student_id', data.user.id)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (app && ['withdrawn', 'graduated', 'archived'].includes(app.status)) {
    await supabase.auth.signOut();
    return { ok: false, error: 'This student account is inactive. Please contact the Registrar.' };
  }
  return { ok: true, userId: data.user.id };
}

// The signed-in student's latest application (or null).
export async function getMyApplication() {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return null;
  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('student_id', u.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// All of the student's yearly records, newest first (for enrollment history).
export async function getMyApplications() {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return [];
  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('student_id', u.user.id)
    .order('created_at', { ascending: false });
  return data || [];
}

// Re-enroll a returning student: file a NEW yearly record for the next grade +
// next school year (status submitted → the registrar reviews it like any apply).
// Moving into Senior High (Grade 11) requires choosing a strand; it then carries
// over to Grade 12 automatically.
export async function reEnroll(prevApp, strand) {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return { ok: false, error: 'You are not signed in.' };
  const grade = nextGrade(prevApp.form?.grade);
  if (!grade) return { ok: false, error: 'No next grade — this student has completed the final level.' };
  const sy = nextSchoolYear(prevApp.school_year);
  const nextStrand = isSHSGrade(grade) ? (strand || prevApp.form?.strand || '') : '';
  if (isSHSGrade(grade) && !nextStrand) return { ok: false, error: 'Please choose a Senior High strand.' };
  const { data, error } = await supabase.from('applications').insert({
    student_id: u.user.id,
    school_year: sy,
    grade_level: levelOfGrade(grade),
    student_type: 'Returnee',
    status: 'submitted',
    form: { ...prevApp.form, grade, schoolYear: sy, strand: nextStrand },
  }).select('id').single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id, grade, schoolYear: sy };
}

// Resubmit after the registrar asked for corrections. Flags the record so the
// Registrar can tell a corrected-and-resubmitted application apart from a
// brand-new one (they both go back to status 'submitted').
export async function resubmitApplication(id, form) {
  const merged = { ...form, resubmitted: true, resubmittedAt: new Date().toISOString() };
  const { error } = await supabase.from('applications')
    .update({ form: merged, status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', id);
  return { ok: !error, error: error?.message };
}

// Update the student's own application form (e.g. contact details from My
// Profile). Does NOT change status — the enforce trigger allows form edits.
export async function updateMyForm(id, form) {
  const { error } = await supabase.from('applications').update({ form }).eq('id', id);
  return { ok: !error, error: error?.message };
}

// Send a password-reset email (link back to the CreateNewPass page).
export async function sendPasswordReset(email) {
  const clean = (email || '').trim().toLowerCase();
  const { error } = await supabase.auth.resetPasswordForEmail(clean, {
    redirectTo: window.location.origin + '/StudentPortal/CreateNewPass',
  });
  return { ok: !error, error: error?.message };
}

// Set a new password (used on the recovery page — the reset link establishes a
// temporary session that authorizes this).
export async function setNewPassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  return { ok: !error, error: error?.message };
}

// --- Forgot-password via email OTP (student, no session) --------------------
// Step 1: email a 6-digit reset code. Always resolves ok (server never reveals
// whether the account exists).
export async function sendResetOtp(email) {
  const { data, error } = await supabase.functions.invoke('send-reset-otp', { body: { email: (email || '').trim().toLowerCase() } });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'Could not send the code.' };
  if (data && data.error) return { ok: false, error: data.error };
  return { ok: true };
}

// Step 2: verify the code (does NOT consume it — the final step re-checks).
export async function verifyResetOtp(email, code) {
  const { data, error } = await supabase.functions.invoke('reset-password', { body: { email: (email || '').trim().toLowerCase(), code } });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'Verification failed.' };
  if (data && data.error) return { ok: false, error: data.error };
  return { ok: true };
}

// Step 3: set the new password using the verified code.
export async function resetPasswordWithOtp(email, code, newPassword) {
  const { data, error } = await supabase.functions.invoke('reset-password', { body: { email: (email || '').trim().toLowerCase(), code, newPassword } });
  if (error && !(data && data.error)) return { ok: false, error: error.message || 'Reset failed.' };
  if (data && data.error) return { ok: false, error: data.error };
  return { ok: true };
}

export async function studentSignOut() {
  await supabase.auth.signOut();
}
