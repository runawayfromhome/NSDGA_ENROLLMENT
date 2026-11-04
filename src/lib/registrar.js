// src/lib/registrar.js
// Staff-facing review of student applications. RLS lets verified staff read all
// applications and update them; the enforce trigger allows staff to enroll
// (set status + student number) — a student cannot.
import { supabase } from './supabase';
import { levelOfGrade, isSHSGrade } from './grades';
import { logAction } from '../auth/authStore';

// How each DB status shows in the registrar UI.
export const APP_DISPLAY = {
  submitted:        { label: 'PENDING REVIEW',   bg: 'bg-[#F2F6D0]', text: 'text-[#9A9E4C]' },
  under_review:     { label: 'UNDER REVIEW',      bg: 'bg-blue-50',   text: 'text-blue-600' },
  needs_correction: { label: 'NEEDS CORRECTION',  bg: 'bg-[#FCE4E4]', text: 'text-[#C55A5A]' },
  enrolled:         { label: 'ENROLLED',          bg: 'bg-[#D1F7E2]', text: 'text-[#48A675]' },
  rejected:         { label: 'REJECTED',          bg: 'bg-gray-100',  text: 'text-gray-500' },
  withdrawn:        { label: 'WITHDRAWN',         bg: 'bg-orange-50', text: 'text-orange-600' },
  graduated:        { label: 'GRADUATED',         bg: 'bg-indigo-50', text: 'text-indigo-600' },
  archived:         { label: 'ARCHIVED',          bg: 'bg-slate-100', text: 'text-slate-500' },
  completed:        { label: 'COMPLETED',         bg: 'bg-teal-50',   text: 'text-teal-600' },
};

// Statuses where a student's portal access is revoked (still fully reversible).
export const DEPROVISIONED = ['withdrawn', 'graduated', 'archived'];
export const GRADUATION_GRADES = ['Grade 6', 'Grade 10', 'Grade 12'];

// A registrar may only ACT on an application that is still in review. Guarding the
// decisive updates on this set prevents two registrars from handling the same
// application at once — the second one's update hits 0 rows and is reported as
// "already handled" instead of silently overwriting the first decision.
const ACTIONABLE = ['submitted', 'under_review', 'needs_correction'];
const ALREADY_HANDLED = 'This application was already handled by another registrar. Please refresh to see its current status.';

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
    .order('created_at', { ascending: false })
    .limit(5000); // sanity cap vs unbounded fetch (see pagination TODO)
  if (error) return [];
  return data;
}

// Applications awaiting registrar action. Historical and already-decided
// records remain available through Student Records, not the Applications queue.
export async function listPendingApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .in('status', ACTIONABLE)
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) return [];
  return data;
}

export async function getApplication(id) {
  const { data, error } = await supabase.from('applications').select('*').eq('id', id).maybeSingle();
  if (error) return null;
  return data;
}

export async function setUnderReview(id) {
  const { data, error } = await supabase.from('applications')
    .update({ status: 'under_review' }).eq('id', id).in('status', ACTIONABLE).select('id');
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: ALREADY_HANDLED };
  const app = await getApplication(id); logAction('REVIEW', `Marked under review: ${app ? applicantName(app) : id}`);
  return { ok: true };
}

// The signed-in staff member's own activity feed (from audit_log). Login/logout
// rows are filtered out — this is their action history, not a session log.
export async function listMyActivity(limit = 300) {
  const { data: u } = await supabase.auth.getUser();
  const email = u?.user?.email;
  if (!email) return [];
  const { data, error } = await supabase.from('audit_log')
    .select('*').eq('email', email).order('created_at', { ascending: false }).limit(limit);
  if (error) return [];
  return (data || []).filter((r) => !['LOGIN', 'LOGOUT'].includes(r.action));
}

export async function returnForCorrection(id, note) {
  const msg = note || 'Please review and resubmit your application.';
  const { data, error } = await supabase.from('applications')
    .update({ status: 'needs_correction', review_note: msg, reviewed_at: new Date().toISOString() })
    .eq('id', id).in('status', ACTIONABLE).select('id');
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: ALREADY_HANDLED };
  const app = await getApplication(id);
  logAction('RETURN', `Returned for correction: ${app ? applicantName(app) : id}`);
  if (app) notifyStudent(app.student_id, 'Action needed on your NSDGA application',
    emailShell('Corrections Requested', `<p>Hi ${applicantName(app)},</p><p>The Registrar reviewed your application and needs a few corrections:</p><blockquote style="border-left:3px solid #800000;padding-left:12px;color:#555">${msg}</blockquote><p>Please log in to your portal, update your application, and resubmit.</p>`));
  return { ok: true };
}

export async function rejectApplication(id, note) {
  const msg = note || 'We regret to inform you that your application was not accepted.';
  const { data, error } = await supabase.from('applications')
    .update({ status: 'rejected', review_note: msg, reviewed_at: new Date().toISOString() })
    .eq('id', id).in('status', ACTIONABLE).select('id');
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: ALREADY_HANDLED };
  const app = await getApplication(id);
  logAction('REJECT', `Rejected application: ${app ? applicantName(app) : id}`);
  if (app) notifyStudent(app.student_id, 'Update on your NSDGA application',
    emailShell('Application Update', `<p>Hi ${applicantName(app)},</p><p>Thank you for your interest in Nuestra Señora de Guia Academy. After careful review, we're unable to offer admission at this time.</p><p>${msg}</p>`));
  return { ok: true };
}

// Accept + enroll: assign the next student number for the school year.
export async function enrollApplication(id, note) {
  const app = await getApplication(id);
  if (!app) return { ok: false, error: 'Application not found.' };
  const { data: { user } } = await supabase.auth.getUser();
  const msg = note || 'Congratulations! You have been accepted and enrolled.';
  // Only reuse a number already attached to this exact application. A returning
  // student gets a new application row, so reusing an older historical row's
  // number would violate the unique student-number constraint.
  const reuse = app.student_no;

  // Atomic-ish: a UNIQUE index on student_no guarantees no duplicates. If two
  // registrars enroll at once and collide (Postgres 23505), regenerate + retry.
  let student_no = reuse, lastErr = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    if (!student_no) student_no = await nextStudentNo(app.school_year);
    const { data, error } = await supabase.from('applications').update({
      status: 'enrolled',
      student_no,
      reviewed_by: user?.id || null,
      reviewed_at: new Date().toISOString(),
      review_note: msg,
    }).eq('id', id).in('status', ACTIONABLE).select('id');
    if (!error) {
      // 0 rows → another registrar already enrolled/rejected/returned this one.
      if (!data || data.length === 0) return { ok: false, error: ALREADY_HANDLED };
      lastErr = null; break;
    }
    lastErr = error;
    if (error.code === '23505') { student_no = null; continue; } // number taken → retry
    break;
  }
  if (lastErr) return { ok: false, error: lastErr.message };
  logAction('ENROLL', `Enrolled ${app.form?.grade || app.grade_level} · ${applicantName(app)} (${student_no})`);
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
  if (!error && (status === 'verified' || status === 'rejected')) {
    logAction(status === 'verified' ? 'DOC_VERIFY' : 'DOC_REJECT',
      `${status === 'verified' ? 'Verified' : 'Rejected'} document (${key}): ${applicantName(app)}`);
  }
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

// --- Class sections ----------------------------------------------------------
// Every section holds at most this many students; enforced on assignment.
export const SECTION_CAPACITY = 45;

// Section lifecycle: 'draft' (registrar still editing) → 'pending' (submitted to
// Admin) → 'approved' (Admin released the roster to students). Editing an
// approved/pending section (rename or roster change) sends it back to 'draft',
// so it must be re-submitted and re-approved. Legacy rows default to 'pending'.
export const sectionStatus = (s) => s?.status || 'pending';

// True if another section in the same grade + year already uses this name.
async function sectionNameTaken(schoolYear, grade, name, exceptId) {
  const { data } = await supabase.from('sections')
    .select('id, name').eq('school_year', schoolYear).eq('grade', grade);
  const norm = String(name).trim().toLowerCase();
  return (data || []).some((s) => s.id !== exceptId && String(s.name).trim().toLowerCase() === norm);
}

export async function listSections(schoolYear, grade) {
  let q = supabase.from('sections').select('*').order('name', { ascending: true });
  if (schoolYear) q = q.eq('school_year', schoolYear);
  if (grade) q = q.eq('grade', grade);
  const { data, error } = await q;
  if (error) return [];
  return data;
}

// Every section (for the Admin approvals overview).
export async function listAllSections() {
  const { data, error } = await supabase.from('sections').select('*')
    .order('school_year', { ascending: false }).order('grade', { ascending: true }).order('name', { ascending: true });
  if (error) return [];
  return data;
}

// Admin approves a section → marks it approved AND writes the roster (classmate
// names) onto each member's own record, so students can see their class.
export async function approveSection(section) {
  const members = (await listEnrolledInGrade(section.school_year, section.grade))
    .filter((a) => a.form?.section === section.name);
  const roster = members.map((m) => applicantName(m)).sort();
  const { error } = await supabase.from('sections').update({ status: 'approved' }).eq('id', section.id);
  if (error) return { ok: false, error: error.message };
  for (const m of members) {
    const form = { ...(m.form || {}), sectionApproved: true, classmates: roster };
    await supabase.from('applications').update({ form }).eq('id', m.id);
  }
  logAction('SECTION_APPROVE', `Approved section ${section.grade} · ${section.name} (${members.length} students)`);
  return { ok: true, count: members.length };
}

// Admin un-approves (back to pending) → clears the roster flag on each member.
export async function unapproveSection(section) {
  const members = (await listEnrolledInGrade(section.school_year, section.grade))
    .filter((a) => a.form?.section === section.name);
  const { error } = await supabase.from('sections').update({ status: 'pending' }).eq('id', section.id);
  if (error) return { ok: false, error: error.message };
  for (const m of members) {
    const form = { ...(m.form || {}), sectionApproved: false, classmates: [] };
    await supabase.from('applications').update({ form }).eq('id', m.id);
  }
  logAction('SECTION_UNAPPROVE', `Un-approved section ${section.grade} · ${section.name}`);
  return { ok: true };
}

export async function createSection({ schoolYear, grade, name, strand }) {
  if (!schoolYear || !grade || !name) return { ok: false, error: 'School year, grade, and name are required.' };
  const clean = String(name).trim();
  // Senior High sections are strand-specific; other grades never carry a strand.
  const sectionStrand = isSHSGrade(grade) ? (strand || '') : null;
  if (isSHSGrade(grade) && !sectionStrand) return { ok: false, error: 'Choose a strand for this Senior High section.' };
  if (await sectionNameTaken(schoolYear, grade, clean))
    return { ok: false, error: `A section named "${clean}" already exists for ${grade}.` };
  const { data, error } = await supabase.from('sections')
    .insert({ school_year: schoolYear, grade, name: clean, strand: sectionStrand, capacity: SECTION_CAPACITY, status: 'draft' })
    .select('id').single();
  if (!error) logAction('SECTION_CREATE', `Created section ${grade}${sectionStrand ? ' ' + sectionStrand : ''} · ${clean}`);
  return { ok: !error, error: error?.message, id: data?.id };
}

// Rename a section (registrar). Enforces unique names, moves members to the new
// name, and sends the section back to 'draft' for re-submission + re-approval.
export async function renameSection(section, newName) {
  const clean = String(newName || '').trim();
  if (!clean) return { ok: false, error: 'Section name is required.' };
  if (clean === section.name) return { ok: true };
  if (await sectionNameTaken(section.school_year, section.grade, clean, section.id))
    return { ok: false, error: `A section named "${clean}" already exists for ${section.grade}.` };
  const members = (await listEnrolledInGrade(section.school_year, section.grade))
    .filter((a) => a.form?.section === section.name);
  for (const m of members) {
    const form = { ...(m.form || {}), section: clean, sectionApproved: false, classmates: [] };
    await supabase.from('applications').update({ form }).eq('id', m.id);
  }
  const { error } = await supabase.from('sections').update({ name: clean, status: 'draft' }).eq('id', section.id);
  if (error) return { ok: false, error: error.message };
  logAction('SECTION_RENAME', `Renamed section ${section.grade} · ${section.name} → ${clean}`);
  return { ok: true };
}

// Registrar submits (or re-submits) a section to Admin for approval.
export async function submitSection(section) {
  const { error } = await supabase.from('sections').update({ status: 'pending' }).eq('id', section.id);
  if (error) return { ok: false, error: error.message };
  logAction('SECTION_SUBMIT', `Submitted for approval: ${section.grade} · ${section.name}`);
  return { ok: true };
}

// Send an approved/pending section back to 'draft' after its roster or name
// changes, clearing any roster already released to students.
async function revertSectionToDraft(section) {
  if (sectionStatus(section) === 'approved') {
    const members = (await listEnrolledInGrade(section.school_year, section.grade))
      .filter((a) => a.form?.section === section.name);
    for (const m of members) {
      const form = { ...(m.form || {}), sectionApproved: false, classmates: [] };
      await supabase.from('applications').update({ form }).eq('id', m.id);
    }
  }
  await supabase.from('sections').update({ status: 'draft' }).eq('id', section.id);
}

export async function deleteSection(id) {
  const { error } = await supabase.from('sections').delete().eq('id', id);
  if (!error) logAction('SECTION_DELETE', 'Deleted a section');
  return { ok: !error, error: error?.message };
}

// Enrolled students in a grade + school year (the assignment pool). For Senior
// High, pass a strand to narrow the pool to that strand only.
export async function listEnrolledInGrade(schoolYear, grade, strand) {
  let q = supabase.from('applications')
    .select('*').eq('status', 'enrolled').eq('school_year', schoolYear)
    .filter('form->>grade', 'eq', grade);
  if (strand) q = q.filter('form->>strand', 'eq', strand);
  const { data, error } = await q.order('created_at', { ascending: true });
  if (error) return [];
  return data;
}

// Assign a list of enrolled applications to a section (writes the section name
// onto each student's enrollment record). Pass sectionName=null to unassign.
// Pass `section` so the 45-student cap is enforced and the section is sent back
// to 'draft' (needs re-approval) whenever its roster changes.
export async function assignToSection(apps, sectionName, section) {
  if (sectionName && section) {
    const current = (await listEnrolledInGrade(section.school_year, section.grade))
      .filter((a) => a.form?.section === sectionName);
    const adding = apps.filter((a) => a.form?.section !== sectionName).length;
    if (current.length + adding > SECTION_CAPACITY) {
      const room = Math.max(0, SECTION_CAPACITY - current.length);
      return { ok: false, error: `Section is full (${SECTION_CAPACITY} max) — room for ${room} more.` };
    }
  }
  for (const app of apps) {
    const form = { ...(app.form || {}), section: sectionName || null };
    // Placing an un-stranded student into a strand section sets their strand.
    if (sectionName && section?.strand && !form.strand) form.strand = section.strand;
    const { error } = await supabase.from('applications').update({ form }).eq('id', app.id);
    if (error) return { ok: false, error: error.message };
  }
  if (section && sectionStatus(section) !== 'draft') await revertSectionToDraft(section);
  logAction(sectionName ? 'SECTION_ASSIGN' : 'SECTION_UNASSIGN',
    sectionName
      ? `Assigned ${apps.length} student${apps.length === 1 ? '' : 's'} to ${section?.grade ? section.grade + ' · ' : ''}${sectionName}`
      : `Removed ${apps.length} student${apps.length === 1 ? '' : 's'} from their section`);
  return { ok: true };
}

// Every yearly record for one student (newest first) — for the Student Profile.
export async function getStudentRecord(studentId) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

// Newest application `created_at` per student, across ALL records — lets the UI
// tell a genuine "leftover" (its completed record is the student's latest) from
// a completed record that a re-enrollment has already superseded.
export async function latestAppDates() {
  const { data } = await supabase.from('applications').select('student_id, created_at').limit(20000);
  const map = {};
  (data || []).forEach((r) => {
    if (!map[r.student_id] || r.created_at > map[r.student_id]) map[r.student_id] = r.created_at;
  });
  return map;
}

// All students (enrolled, completed, or deprovisioned) — for Student Records
// with a filter. 'completed' = finished the year, awaiting re-enrollment; they
// stay visible here (not dropped from the roster).
export async function listStudents() {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .in('status', ['enrolled', 'completed', 'withdrawn', 'graduated', 'archived'])
    .order('student_no', { ascending: true })
    .limit(5000); // sanity cap vs unbounded fetch (see pagination TODO)
  if (error) return [];
  return data;
}

// Soft-deprovision: move an enrolled student to withdrawn / graduated / archived
// (keeps the record + student number; login is revoked by the status check).
export async function setLifecycle(id, status, note) {
  if (!['withdrawn', 'graduated', 'archived'].includes(status)) return { ok: false, error: 'Invalid status.' };
  const { data: { user } } = await supabase.auth.getUser();
  const app = await getApplication(id);
  if (status === 'graduated' && !GRADUATION_GRADES.includes(app?.form?.grade)) {
    return { ok: false, error: 'Only Grade 6, Grade 10, and Grade 12 students can be graduated.' };
  }
  const { error } = await supabase.from('applications')
    .update({ status, review_note: note || '', reviewed_by: user?.id || null, reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (!error) logAction(status.toUpperCase(), `Set ${status}: ${app ? applicantName(app) : id}${app?.student_no ? ' (' + app.student_no + ')' : ''}`);
  return { ok: !error, error: error?.message };
}

// Mark an enrolled student's school year as completed — they keep the record
// (now in history) and become eligible to re-enroll into the next grade.
export async function markCompleted(id, note) {
  const { data: { user } } = await supabase.auth.getUser();
  const app = await getApplication(id);
  const { error } = await supabase.from('applications')
    .update({ status: 'completed', review_note: note || 'School year completed.', reviewed_by: user?.id || null, reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (!error) logAction('COMPLETE', `Marked year completed: ${app ? applicantName(app) : id}${app?.form?.grade ? ' · ' + app.form.grade : ''}`);
  return { ok: !error, error: error?.message };
}

// Re-admit a former student (returnee / balik-aral) at a NEW grade + school year.
// Creates a fresh enrollment record for their SAME identity — so the intervening
// years elsewhere show as a gap, and history stays intact. The new record being
// the latest also restores their portal login. Returns { ok, id }.
export async function readmitStudent(prevApp, grade, schoolYear) {
  if (!grade || !schoolYear) return { ok: false, error: 'Grade and school year are required.' };
  const previousGrade = parseInt(String(prevApp?.form?.grade || '').replace(/\D/g, ''), 10);
  const returningGrade = parseInt(String(grade).replace(/\D/g, ''), 10);
  if (previousGrade === 12) {
    return { ok: false, error: 'Grade 12 students have completed the final grade and cannot be re-admitted.' };
  }
  if (!previousGrade || !returningGrade || returningGrade <= previousGrade) {
    return { ok: false, error: `A returning student must be re-admitted to a grade higher than Grade ${previousGrade}.` };
  }
  const { data, error } = await supabase.from('applications').insert({
    student_id: prevApp.student_id,
    school_year: schoolYear,
    grade_level: levelOfGrade(grade),
    student_type: 'Returnee',
    status: 'submitted',
    form: { ...(prevApp.form || {}), grade, schoolYear },
  }).select('id').single();
  if (error) return { ok: false, error: error.message };
  logAction('READMIT', `Re-admitted ${grade} (S.Y. ${schoolYear}): ${applicantName(prevApp)}`);
  return { ok: true, id: data.id };
}

// Bulk-archive leftover student records — e.g. completers who didn't re-enroll
// once the season closed. Records are kept; login is revoked but fully reversible
// later via reactivate / re-admit.
export async function bulkArchive(ids, note) {
  if (!ids?.length) return { ok: false, error: 'No students selected.' };
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('applications')
    .update({ status: 'archived', review_note: note || 'Bulk-archived after enrollment season.', reviewed_by: user?.id || null, reviewed_at: new Date().toISOString() })
    .in('id', ids);
  if (error) return { ok: false, error: error.message };
  logAction('BULK_ARCHIVE', `Archived ${ids.length} student record${ids.length === 1 ? '' : 's'}`);
  return { ok: true, count: ids.length };
}

// Reactivate a deprovisioned student back to enrolled (restores access).
export async function reactivateStudent(id) {
  const app = await getApplication(id);
  const { error } = await supabase.from('applications')
    .update({ status: 'enrolled', reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (!error) logAction('REACTIVATE', `Reactivated student: ${app ? applicantName(app) : id}${app?.student_no ? ' (' + app.student_no + ')' : ''}`);
  return { ok: !error, error: error?.message };
}
