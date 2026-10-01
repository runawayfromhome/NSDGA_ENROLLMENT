// Admin → Section Approvals. Reviews the class sections the Registrar created,
// approves them (which releases each student's section + classmate list to their
// portal), or sends them back to pending. Admin is also the only role that can
// PRINT the class lists and grade master lists.
import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../AdminSidebar';
import { listAllSections, listEnrolled, approveSection, unapproveSection, applicantName, sectionStatus } from '../../../lib/registrar';
import { printClassList, printGradeList } from '../../../lib/print';
import { ALL_GRADES } from '../../../lib/grades';
import { CardSkeleton } from '../../Skeleton';
import { useMfaLock } from '../../MfaLock';
import { HiOutlinePrinter } from 'react-icons/hi';

const SectionApprovals = () => {
  const [sections, setSections] = useState(null);
  const [enrolled, setEnrolled] = useState([]);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const { locked, banner } = useMfaLock('/AdminPortal/Settings');
  const [open, setOpen] = useState(null); // section id whose members are shown
  const [printGrade, setPrintGrade] = useState('Grade 7');

  const load = async () => {
    const [secs, enr] = await Promise.all([listAllSections(), listEnrolled()]);
    setSections(secs); setEnrolled(enr);
  };
  useEffect(() => { load(); }, []);

  const membersOf = (s) => enrolled.filter((a) => a.school_year === s.school_year && a.form?.grade === s.grade && a.form?.section === s.name);

  const doApprove = async (s) => {
    setBusy(s.id); setMsg('');
    const r = await approveSection(s);
    setBusy('');
    setMsg(r.ok ? `✓ Approved ${s.grade} · ${s.name} — released to ${r.count} student${r.count === 1 ? '' : 's'}.` : '⚠️ ' + r.error);
    await load();
  };
  const doUnapprove = async (s) => { setBusy(s.id); await unapproveSection(s); setBusy(''); setMsg(`↩ ${s.name} sent back to pending.`); await load(); };

  // Master list for the chosen grade (all its sections + students).
  const printMaster = () => {
    const gradeSections = (sections || []).filter((s) => s.grade === printGrade);
    const gradeStudents = enrolled.filter((a) => a.form?.grade === printGrade);
    const schoolYear = gradeSections[0]?.school_year || '';
    printGradeList({ grade: printGrade, schoolYear, sections: gradeSections, students: gradeStudents });
  };

  const printGrades = useMemo(() => ALL_GRADES, []);

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="p-6 md:p-12 max-w-5xl w-full">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-2 h-10 bg-[#800000]" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Section Approvals</h1>
          </div>
          <p className="text-gray-500 text-sm ml-6 mb-6">Approve the class sections the Registrar set up. Approving releases each student's section and classmate list to their portal. Only Admin can print the official lists.</p>

          {/* Master-list printing */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Print grade master list</label>
              <select value={printGrade} onChange={(e) => setPrintGrade(e.target.value)} className="bg-[#F1F3F6] rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none">
                {printGrades.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <button onClick={printMaster} className="flex items-center gap-2 px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl font-bold text-sm"><HiOutlinePrinter size={16} /> Print {printGrade} master list</button>
          </div>

          {msg && <div className={`mb-5 rounded-lg px-4 py-3 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}
          {banner}

          {sections === null && <div className="space-y-4"><CardSkeleton lines={2} /><CardSkeleton lines={2} /></div>}
          {sections && sections.length === 0 && <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-slate-400">No sections created yet.</div>}

          <div className="space-y-3">
            {(sections || []).map((s) => {
              const mem = membersOf(s);
              const status = sectionStatus(s);
              const approved = status === 'approved';
              const isDraft = status === 'draft';
              const badge = approved ? 'bg-emerald-50 text-emerald-600' : isDraft ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-700';
              return (
                <div key={s.id} className={`bg-white rounded-2xl shadow-sm p-5 ${isDraft ? 'opacity-75' : ''}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-800">{s.grade} · {s.name} {s.strand ? <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-violet-50 text-violet-600">{s.strand}</span> : ''} <span className="text-slate-400 font-normal text-sm">· S.Y. {s.school_year}</span></p>
                      <p className="text-[12px] text-slate-400">{mem.length} student{mem.length === 1 ? '' : 's'} · <button onClick={() => setOpen(open === s.id ? null : s.id)} className="text-[#800000] font-bold hover:underline">{open === s.id ? 'hide' : 'view'} members</button></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => printClassList({ grade: s.grade, section: s.name, schoolYear: s.school_year, students: mem })} disabled={mem.length === 0} className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-sm disabled:opacity-50" title="Print class list"><HiOutlinePrinter size={15} /> Class list</button>
                      <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black ${badge}`}>{isDraft ? 'DRAFT' : approved ? 'APPROVED' : 'PENDING'}</span>
                      {approved
                        ? <button disabled={busy === s.id || locked} onClick={() => doUnapprove(s)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-sm disabled:opacity-60">Unapprove</button>
                        : isDraft
                          ? <span className="px-4 py-2 text-slate-400 text-sm font-semibold">Not submitted yet</span>
                          : <button disabled={busy === s.id || mem.length === 0 || locked} onClick={() => doApprove(s)} className="px-5 py-2 bg-[#800000] hover:bg-[#600000] text-white rounded-lg font-bold text-sm disabled:opacity-50">{busy === s.id ? 'Approving…' : '✓ Approve'}</button>}
                    </div>
                  </div>
                  {open === s.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                      {mem.length === 0 && <span className="text-sm text-slate-400">No students assigned yet — the Registrar needs to add students first.</span>}
                      {mem.map((a) => <span key={a.id} className="text-xs font-semibold bg-slate-100 text-slate-600 rounded-full px-3 py-1">{applicantName(a)}</span>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SectionApprovals;
