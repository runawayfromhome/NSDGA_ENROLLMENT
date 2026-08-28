// src/lib/student.js
// Student self-apply data layer: create an applicant account + admission
// application, and read/track it. Backed by Supabase Auth + `applications`.
import { supabase } from './supabase';
import { nextGrade, nextSchoolYear, levelOfGrade } from './grades';

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

// Admission documents the student must submit.
export const REQUIRED_DOCS = [
  { key: 'photo', label: '2x2 Picture' },
  { key: 'reportCard', label: 'Report Card (Form 138)' },
  { key: 'form137', label: 'Form 137' },
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
export async function reEnroll(prevApp) {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return { ok: false, error: 'You are not signed in.' };
  const grade = nextGrade(prevApp.form?.grade);
  if (!grade) return { ok: false, error: 'No next grade — this student has completed the final level.' };
  const sy = nextSchoolYear(prevApp.school_year);
  const { data, error } = await supabase.from('applications').insert({
    student_id: u.user.id,
    school_year: sy,
    grade_level: levelOfGrade(grade),
    student_type: 'Returnee',
    status: 'submitted',
    form: { ...prevApp.form, grade, schoolYear: sy },
  }).select('id').single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id, grade, schoolYear: sy };
}

// Resubmit after the registrar asked for corrections.
export async function resubmitApplication(id, form) {
  const { error } = await supabase.from('applications')
    .update({ form, status: 'submitted', submitted_at: new Date().toISOString() })
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

export async function studentSignOut() {
  await supabase.auth.signOut();
}
