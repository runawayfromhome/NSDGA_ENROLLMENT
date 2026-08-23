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
  const { error } = await supabase.from('applications')
    .update({ status: 'needs_correction', review_note: note || 'Please review and resubmit your application.', reviewed_at: new Date().toISOString() })
    .eq('id', id);
  return { ok: !error, error: error?.message };
}

export async function rejectApplication(id, note) {
  const { error } = await supabase.from('applications')
    .update({ status: 'rejected', review_note: note || 'We regret to inform you that your application was not accepted.', reviewed_at: new Date().toISOString() })
    .eq('id', id);
  return { ok: !error, error: error?.message };
}

// Accept + enroll: assign the next student number for the school year.
export async function enrollApplication(id, note) {
  const app = await getApplication(id);
  if (!app) return { ok: false, error: 'Application not found.' };
  const student_no = await nextStudentNo(app.school_year);
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('applications').update({
    status: 'enrolled',
    student_no,
    reviewed_by: user?.id || null,
    reviewed_at: new Date().toISOString(),
    review_note: note || 'Congratulations! You have been accepted and enrolled.',
  }).eq('id', id);
  return { ok: !error, error: error?.message, student_no };
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
