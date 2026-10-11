// Admin → Manage Student Account. Pick an enrolled student to view their profile
// and recover their account: reset the password or remove MFA if they're locked
// out. Both actions require a code emailed to the acting admin (step-up) and that
// the admin has their own MFA enabled.
import { useEffect, useState } from 'react';
import AdminSidebar from '../../AdminSidebar';
import { listStudents, applicantName } from '../../../lib/registrar';
import { ALL_GRADES } from '../../../lib/grades';
import { TableSkeleton } from '../../Skeleton';
import { useMfaLock } from '../../MfaLock';
import RemoveMfaSection from '../../RemoveMfaSection';
import ResetPasswordSection from '../../ResetPasswordSection';

const PAGE_SIZE = 20; // students shown per "page"; "Load more" reveals the next batch

const ageFrom = (dob) => {
  if (!dob) return '—';
  const d = new Date(dob); if (isNaN(d)) return '—';
  const t = new Date(); let a = t.getFullYear() - d.getFullYear();
  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
  return String(a);
};

const ManageStudent = () => {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [target, setTarget] = useState(null); // the selected student row
  const { locked, banner } = useMfaLock('/AdminPortal/Settings');

  useEffect(() => { listStudents().then(setRows); }, []);
  // Any change to the search/filter starts the list back at the first page.
  useEffect(() => { setShown(PAGE_SIZE); }, [q, gradeFilter]);

  const gradeOf = (r) => r.form?.grade || r.grade_level || '';

  const filtered = (rows || []).filter((r) => {
    if (r.status !== 'enrolled') return false; // verified/active students only
    if (gradeFilter && gradeOf(r) !== gradeFilter) return false;
    const s = (applicantName(r) + ' ' + (r.student_no || '') + ' ' + (r.form?.lrn || '')).toLowerCase();
    return s.includes(q.trim().toLowerCase());
  });
  const visible = filtered.slice(0, shown);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="p-6 md:p-12 max-w-[1100px] w-full">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-2 h-10 bg-[#800000]" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Manage Student Account</h1>
          </div>
          <p className="text-gray-500 text-sm ml-6 mb-6 max-w-2xl">
            Select an enrolled student to view their profile and recover their account —
            reset the password or remove Multi-Factor Authentication if they're locked out.
            Each action requires a code emailed to you to confirm.
          </p>

          {banner}

          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, Student No., or LRN…"
              className="w-full md:w-96 px-5 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm outline-none focus:border-[#800000]" />
            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full md:w-52 px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm outline-none focus:border-[#800000] cursor-pointer">
              <option value="">All grade levels</option>
              {ALL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-6">
            {rows === null ? <TableSkeleton rows={6} cols={3} /> : (
              <div className="divide-y divide-gray-50">
                {filtered.length === 0 && <p className="py-8 text-center text-slate-400 text-sm">No enrolled students match.</p>}
                {visible.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{applicantName(r)}</p>
                      <p className="text-[11px] font-mono text-slate-400">{r.student_no || '—'}{r.form?.lrn ? ` · LRN ${r.form.lrn}` : ''} · {r.form?.grade || r.grade_level}</p>
                    </div>
                    <button disabled={locked} onClick={() => setTarget(r)}
                      className="shrink-0 px-4 py-2 rounded-lg text-[12px] font-bold bg-[#800000] text-white hover:bg-[#600000] disabled:opacity-40 cursor-pointer">Manage</button>
                  </div>
                ))}
              </div>
            )}

            {rows !== null && filtered.length > 0 && (
              <div className="flex flex-col items-center gap-3 pt-5 mt-2 border-t border-gray-50">
                <p className="text-[11px] text-slate-400">Showing {visible.length} of {filtered.length} enrolled students</p>
                {visible.length < filtered.length && (
                  <button onClick={() => setShown((n) => n + PAGE_SIZE)}
                    className="px-6 py-2.5 rounded-xl text-[13px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">
                    Load more
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {target && <ManageModal row={target} locked={locked} onClose={() => setTarget(null)} />}
    </div>
  );
};

// ---- Manage modal: profile + account-recovery tools ------------------------
const ManageModal = ({ row, locked, onClose }) => {
  const f = row.form || {};
  const name = applicantName(row);
  const account = { id: row.student_id, name, role: 'student' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-black text-slate-800 truncate">{name}</h3>
            <p className="text-xs text-slate-400">
              {row.student_no ? `Student No. ${row.student_no} · ` : ''}{f.grade || row.grade_level}{f.strand ? ` (${f.strand})` : ''} · S.Y. {row.school_year}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer shrink-0">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Profile */}
          <div>
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Profile</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <D label="First Name" v={f.firstName} /><D label="Middle Name" v={f.middleName} /><D label="Last Name" v={f.lastName} />
              <D label="LRN" v={f.lrn} /><D label="Sex" v={f.sex} /><D label="Age" v={ageFrom(f.dob)} />
              <D label="Date of Birth" v={f.dob} /><D label="Nationality" v={f.nationality} /><D label="Religion" v={f.religion} />
              <D label="Contact" v={f.contact} /><D label="Section" v={f.section} /><D label="Student Type" v={row.student_type} />
            </div>
            <div className="mt-4"><D label="Home Address" v={f.address} /></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <D label="Father" v={f.fatherName} /><D label="Mother" v={f.motherName} /><D label="Guardian" v={f.guardianName} />
              <D label="Guardian Contact" v={f.guardianContact} />
            </div>
          </div>

          {/* Reset password */}
          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Reset Password</h4>
            <ResetPasswordSection account={account} locked={locked} />
          </div>

          {/* Remove MFA */}
          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Multi-Factor Authentication</h4>
            <RemoveMfaSection account={account} locked={locked} />
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-100 cursor-pointer">Close</button>
        </div>
      </div>
    </div>
  );
};

const D = ({ label, v }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
    <div className="w-full p-2.5 bg-[#F1F5F9] border border-slate-200 rounded-lg text-slate-700 text-sm font-medium min-h-[40px]">{v || '—'}</div>
  </div>
);

export default ManageStudent;
