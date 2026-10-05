// src/lib/billing.js
// Finance Status handoff (Option B: export + import).
// The school does NOT hold the finance side, so the app never handles money —
// it only stores a payment STATUS (+ OR number and remarks) per enrollment
// record, set by staff after Finance assesses/receives payment offline. Admin
// exports enrolled students to a CSV for Finance, then imports the returned CSV
// to update statuses automatically. Students see the result read-only.
import { supabase } from './supabase';
import { logAction } from '../auth/authStore';

export const BILLING_STATUS = {
  not_assessed: { label: 'Not Assessed',    cls: 'bg-slate-100 text-slate-500' },
  assessed:     { label: 'Assessed',        cls: 'bg-blue-50 text-blue-600' },
  partial:      { label: 'Partial',         cls: 'bg-amber-50 text-amber-700' },
  paid:         { label: 'Paid',            cls: 'bg-emerald-50 text-emerald-600' },
  voucher:      { label: 'Voucher-Covered', cls: 'bg-teal-50 text-teal-600' },
};
export const BILLING_ORDER = ['not_assessed', 'assessed', 'partial', 'paid', 'voucher'];

const nameOf = (app) => {
  const f = app?.form || {};
  return `${f.firstName || ''} ${f.lastName || ''}`.replace(/\s+/g, ' ').trim() || app?.student_no || '—';
};

// Enrolled students for the billing desk (optionally one school year), by no.
export async function listBillingRows(schoolYear) {
  let q = supabase.from('applications').select('*').eq('status', 'enrolled');
  if (schoolYear && schoolYear !== 'All') q = q.eq('school_year', schoolYear);
  const { data, error } = await q.order('student_no', { ascending: true });
  if (error) return [];
  return data;
}

// Merge a patch into one record's billing (staff only, per RLS + trigger).
export async function updateBilling(id, patch, studentName) {
  const clean = {};
  Object.entries(patch || {}).forEach(([k, v]) => { if (v !== undefined) clean[k] = v; });
  const { data: cur } = await supabase.from('applications').select('billing, student_no').eq('id', id).maybeSingle();
  const billing = { ...(cur?.billing || {}), ...clean, updatedAt: new Date().toISOString() };
  const { error } = await supabase.from('applications').update({ billing }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  const who = studentName || cur?.student_no || id;
  logAction('BILLING_UPDATE', `Billing ${BILLING_STATUS[billing.status]?.label || billing.status || '—'}: ${who}${billing.orNumber ? ' (OR ' + billing.orNumber + ')' : ''}`);
  return { ok: true };
}

// ---- CSV export ------------------------------------------------------------
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export const BILLING_HEADERS = [
  'Student No', 'Last Name', 'First Name', 'Grade', 'Strand',
  'Voucher', 'Voucher Type', 'Voucher ID',
  'Status', 'OR Number', 'Remarks',
];

export function billingCsv(rows) {
  const lines = rows.map((r) => {
    const f = r.form || {}, b = r.billing || {};
    return [
      r.student_no, f.lastName, f.firstName, f.grade || r.grade_level, f.strand || '',
      f.voucherApplicant || '', f.voucherType || '', f.voucherId || '',
      BILLING_STATUS[b.status]?.label || 'Not Assessed',
      b.orNumber || '', b.remarks || '',
    ].map(csvCell).join(',');
  });
  return [BILLING_HEADERS.map(csvCell).join(','), ...lines].join('\r\n');
}

export function downloadBillingCsv(rows, year) {
  const url = URL.createObjectURL(new Blob([billingCsv(rows)], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = `billing-${year && year !== 'All' ? year : 'all'}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ---- CSV import ------------------------------------------------------------
// Minimal RFC-4180-ish parser (handles quotes, commas, and CRLF/LF).
function parseCsv(text) {
  const rows = []; let row = [], field = '', inQ = false;
  const s = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => String(v).trim() !== ''));
}

function normalizeStatus(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return undefined;
  const byKey = BILLING_ORDER.find((k) => k === s);
  if (byKey) return byKey;
  const byLabel = BILLING_ORDER.find((k) => BILLING_STATUS[k].label.toLowerCase() === s);
  if (byLabel) return byLabel;
  if (s.startsWith('voucher')) return 'voucher';
  if (s.startsWith('paid')) return 'paid';
  if (s.startsWith('partial')) return 'partial';
  if (s.startsWith('assess')) return 'assessed';
  return 'not_assessed';
}

// Import a Finance-returned CSV. Matches each row to an enrolled record by
// Student No and updates its billing. `rows` = the current billing rows (so we
// can match without another query). Returns { ok, updated, skipped, misses }.
export async function importBillingCsv(text, rows, staffName) {
  const table = parseCsv(text);
  if (table.length < 2) return { ok: false, error: 'The CSV has no data rows.' };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const col = (name) => header.indexOf(name);
  const cNo = col('student no');
  if (cNo < 0) return { ok: false, error: 'CSV must include a "Student No" column.' };
  const cStatus = col('status'), cOr = col('or number'), cRem = col('remarks');

  const byNo = {};
  rows.forEach((r) => { if (r.student_no) byNo[String(r.student_no).trim()] = r; });

  let updated = 0, skipped = 0; const misses = [];
  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    const no = String(row[cNo] || '').trim();
    const app = byNo[no];
    if (!app) { skipped++; if (no) misses.push(no); continue; }
    const patch = { updatedByName: staffName };
    if (cStatus >= 0) { const st = normalizeStatus(row[cStatus]); if (st) patch.status = st; }
    if (cOr >= 0) patch.orNumber = String(row[cOr] ?? '').trim();
    if (cRem >= 0) patch.remarks = String(row[cRem] ?? '').trim();
    const res = await updateBilling(app.id, patch, nameOf(app));
    if (res.ok) updated++; else skipped++;
  }
  return { ok: true, updated, skipped, misses };
}
