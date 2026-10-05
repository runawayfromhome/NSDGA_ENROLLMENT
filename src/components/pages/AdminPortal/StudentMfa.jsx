// Admin → Student MFA. Account recovery for students who lost their authenticator
// and are locked out. Lists enrolled students (searchable); removing MFA requires
// an emailed OTP step-up (handled by RemoveMfaSection + admin-remove-mfa).
import { useEffect, useState } from 'react';
import AdminSidebar from '../../AdminSidebar';
import { listStudents, applicantName } from '../../../lib/registrar';
import { ALL_GRADES } from '../../../lib/grades';
import { TableSkeleton } from '../../Skeleton';
import { useMfaLock } from '../../MfaLock';
import RemoveMfaSection from '../../RemoveMfaSection';

const StudentMfa = () => {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [target, setTarget] = useState(null); // { id (student_id), name }
  const { locked, banner } = useMfaLock('/AdminPortal/Settings');

  useEffect(() => { listStudents().then(setRows); }, []);

  const gradeOf = (r) => r.form?.grade || r.grade_level || '';
  // Only offer grades that actually have enrolled students in the dropdown.
  const gradesPresent = ALL_GRADES.filter((g) => (rows || []).some((r) => r.status === 'enrolled' && gradeOf(r) === g));

  const filtered = (rows || []).filter((r) => {
    if (r.status !== 'enrolled') return false; // verified/active students only
    if (gradeFilter && gradeOf(r) !== gradeFilter) return false;
    const s = (applicantName(r) + ' ' + (r.student_no || '') + ' ' + (r.form?.lrn || '')).toLowerCase();
    return s.includes(q.trim().toLowerCase());
  });

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="p-6 md:p-12 max-w-[1100px] w-full">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-2 h-10 bg-[#800000]" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Student MFA</h1>
          </div>
          <p className="text-gray-500 text-sm ml-6 mb-6 max-w-2xl">
            Remove a student's Two-Factor Authentication if they lost their authenticator and are locked out.
            Enrolled students only. Confirmation requires a code emailed to you.
          </p>

          {banner}

          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, Student No., or LRN…"
              className="w-full md:w-96 px-5 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm outline-none focus:border-[#800000]" />
            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full md:w-52 px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm outline-none focus:border-[#800000] cursor-pointer">
              <option value="">All grade levels</option>
              {gradesPresent.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-6">
            {rows === null ? <TableSkeleton rows={6} cols={3} /> : (
              <div className="divide-y divide-gray-50">
                {filtered.length === 0 && <p className="py-8 text-center text-slate-400 text-sm">No enrolled students match.</p>}
                {filtered.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">{applicantName(r)}</p>
                      <p className="text-[11px] font-mono text-slate-400">{r.student_no || '—'}{r.form?.lrn ? ` · LRN ${r.form.lrn}` : ''} · {r.form?.grade || r.grade_level}</p>
                    </div>
                    <button disabled={locked} onClick={() => setTarget({ id: r.student_id, name: applicantName(r) })}
                      className="shrink-0 px-4 py-2 rounded-lg text-[12px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 cursor-pointer">Remove MFA</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-slate-800">Remove MFA — {target.name}</h3>
              <button onClick={() => setTarget(null)} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">✕</button>
            </div>
            <RemoveMfaSection account={target} locked={locked} onDone={() => {}} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMfa;
