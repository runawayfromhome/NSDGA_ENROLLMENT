// src/lib/registrar.js
// Staff-facing review of student applications. RLS lets verified staff read all
// applications and update them; the enforce trigger allows staff to enroll
// (set status + student number) — a student cannot.
import { supabase } from './supabase';

// How each DB status shows in the registrar UI.
export const APP_DISPLAY = {
  submitted:        { label: 'PENDING REVIEW',   bg: 'bg-[#F2F6D0]', text: 'text-[#9A9E4C]' },
  under_review:     { label: 'UNDER REVIEW',      bg: 'bg-blue-50',   text: 'text-blue-600' },
  needs_correction: { label: 'NEEDS CORRECTION',  bg: 'bg-[#FCE4E4]', text: 'text-[#C55A5A]' },
  enrolled:         { label: 'ENROLLED',          bg: 'bg-[#D1F7E2]', text: 'text-[#48A675]' },
  rejected:         { label: 'REJECTED',          bg: 'bg-gray-100',  text: 'text-gray-500' },
};

// Fire-and-forget email to a student via the `notify` Edge Function. Failures
// never block the registrar's action (the DB change is what matters).
export async function notifyStudent(studentId, subject, html) {
  try {
    const { data, error } = await supabase.functions.invoke('notify', { body: { studentId, subject, html } });
    if (error || data?.error) return { ok: false, error: data?.error || error?.message };
    return { ok: true };
  } catch (e) { return { ok: false, error: String(e) }; }
}

function emailShell(title, bodyHtml) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto">
    <div style="background:#800000;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
      <h2 style="margin:0;font-size:18px">Nuestra Señora de Guia Academy</h2>
      <p style="margin:4px 0 0;opacity:.85;font-size:12px">Admissions Office</p>
    </div>
    <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 12px 12px;color:#333">
      <h3 style="color:#800000;margin-top:0">${title}</h3>
      ${bodyHtml}
      <p style="color:#999;font-size:12px;margin-top:24px">This is an automated message from the NSDGA Student Portal.</p>
    </div>
  </div>`;
}

export function applicantName(app) {
  const f = app?.form || {};
  return `${f.firstName || ''} ${f.middleName || ''} ${f.lastName || ''} ${f.suffix || ''}`.replace(/\s+/g, ' ').trim() || '—';
}

export async function listApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

export async function getApplication(id) {
  const { data, error } = await supabase.from('applications').select('*').eq('id', id).maybeSingle();
  if (error) return null;
  return data;
}

export async function setUnderReview(id) {
  const { error } = await supabase.from('applications')
    .update({ status: 'under_review' }).eq('id', id);
  return { ok: !error, error: error?.message };
}

export async function returnForCorrection(id, note) {
  const msg = note || 'Please review and resubmit your application.';
  const { error } = await supabase.from('applications')
    .update({ status: 'needs_correction', review_note: msg, reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  const app = await getApplication(id);
  if (app) notifyStudent(app.student_id, 'Action needed on your NSDGA application',
    emailShell('Corrections Requested', `<p>Hi ${applicantName(app)},</p><p>The Registrar reviewed your application and needs a few corrections:</p><blockquote style="border-left:3px solid #800000;padding-left:12px;color:#555">${msg}</blockquote><p>Please log in to your portal, update your application, and resubmit.</p>`));
  return { ok: true };
}

export async function rejectApplication(id, note) {
  const msg = note || 'We regret to inform you that your application was not accepted.';
  const { error } = await supabase.from('applications')
    .update({ status: 'rejected', review_note: msg, reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  const app = await getApplication(id);
  if (app) notifyStudent(app.student_id, 'Update on your NSDGA application',
    emailShell('Application Update', `<p>Hi ${applicantName(app)},</p><p>Thank you for your interest in Nuestra Señora de Guia Academy. After careful review, we're unable to offer admission at this time.</p><p>${msg}</p>`));
  return { ok: true };
}

// Accept + enroll: assign the next student number for the school year.
export async function enrollApplication(id, note) {
  const app = await getApplication(id);
  if (!app) return { ok: false, error: 'Application not found.' };
  const student_no = await nextStudentNo(app.school_year);
  const { data: { user } } = await supabase.auth.getUser();
  const msg = note || 'Congratulations! You have been accepted and enrolled.';
  const { error } = await supabase.from('applications').update({
    status: 'enrolled',
    student_no,
    reviewed_by: user?.id || null,
    reviewed_at: new Date().toISOString(),
    review_note: msg,
  }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  notifyStudent(app.student_id, `You're enrolled at NSDGA — Student No. ${student_no}`,
    emailShell('Enrollment Confirmed 🎓', `<p>Congratulations, ${applicantName(app)}!</p><p>Your application for <b>${app.grade_level}</b> (S.Y. ${app.school_year}) has been <b>accepted</b>. Your student number is <b>${student_no}</b>.</p><p>${msg}</p><p>Log in to your Student Portal to view the details.</p>`));
  return { ok: true, student_no };
}

// Next student number, e.g. 2026-0001, based on the school year's starting year.
async function nextStudentNo(schoolYear) {
  const prefix = String(schoolYear || '2026-2027').split('-')[0];
  const { data } = await supabase.from('applications').select('student_no').ilike('student_no', prefix + '-%');
  let max = 0;
  (data || []).forEach((r) => {
    const n = parseInt(String(r.student_no || '').split('-')[1] || '0', 10);
    if (!isNaN(n)) max = Math.max(max, n);
  });
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

// Registrar marks one uploaded document verified / rejected.
export async function setDocumentStatus(app, key, status) {
  const documents = { ...(app.documents || {}), [key]: { ...(app.documents?.[key] || {}), status } };
  const { error } = await supabase.from('applications').update({ documents }).eq('id', app.id);
  return { ok: !error, error: error?.message };
}

// Free-tier usage snapshot for the HeadAdmin System page.
export async function getUsage() {
  const [{ data: profiles }, apps] = await Promise.all([
    supabase.from('profiles').select('role'),
    listApplications(),
  ]);
  const rolesArr = profiles || [];
  const students = rolesArr.filter((p) => p.role === 'student').length;
  const staff = rolesArr.filter((p) => ['registrar', 'admin', 'headadmin'].includes(p.role)).length;

  let files = 0, bytes = 0;
  (apps || []).forEach((a) => Object.values(a.documents || {}).forEach((d) => { if (d?.path) { files++; bytes += d.size || 0; } }));

  return {
    accounts: { total: rolesArr.length, students, staff },
    applications: (apps || []).length,
    storage: { files, bytes },
  };
}

// Enrolled students (for the Student Records page).
export async function listEnrolled() {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('status', 'enrolled')
    .order('student_no', { ascending: true });
  if (error) return [];
  return data;
}
