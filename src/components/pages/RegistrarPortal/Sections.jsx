// Registrar → Sections — create class sections per grade (Grade 1–12, many per
// grade) and assign enrolled students to each. Assignment is first-come,
// first-served: the unassigned list is ordered by enrollment date (earliest
// first). Rules: section names are unique per grade, each section holds at most
// 45 students, and every section can be edited then (re)submitted to Admin —
// only Admin approves. Editing a section sends it back to draft for re-approval.
import { useCallback, useEffect, useMemo, useState } from 'react';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import {
  listSections, createSection, deleteSection, renameSection, submitSection,
  listEnrolledInGrade, assignToSection, applicantName, sectionStatus, SECTION_CAPACITY,
} from '../../../lib/registrar';
import { getActiveSchoolYear, getStrands, getMaxSectionsPerGrade } from '../../../lib/content';
import { ALL_GRADES, isSHSGrade } from '../../../lib/grades';
import { useMfaLock } from '../../MfaLock';
import { HiOutlineUserGroup, HiOutlineTrash, HiOutlinePencil, HiOutlinePaperAirplane } from "react-icons/hi";
import { subscribeToTable } from '../../../lib/realtime';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—');

const STATUS = {
  draft:    { label: 'DRAFT',    cls: 'bg-slate-100 text-slate-500' },
  pending:  { label: 'PENDING',  cls: 'bg-amber-50 text-amber-700' },
  approved: { label: 'APPROVED', cls: 'bg-emerald-50 text-emerald-600' },
};

const Sections = () => {
  const [schoolYear, setSchoolYear] = useState('');
  const [grade, setGrade] = useState('Grade 7');
  const [sections, setSections] = useState([]);
  const [pool, setPool] = useState([]); // enrolled students in this grade/year
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // section being managed
  const [sort, setSort] = useState('fcfs'); // fcfs (earliest enrolled) | name
  const [picked, setPicked] = useState({}); // { appId: true }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [newStrand, setNewStrand] = useState(''); // strand for a new SHS section
  const [shsStrands, setShsStrands] = useState([]); // SHS courses, managed by Admin
  const [maxSections, setMaxSections] = useState(20); // Admin-set cap per grade/strand (default 20)
  const [editId, setEditId] = useState(null); // section being renamed
  const [editName, setEditName] = useState('');
  const [poolQ, setPoolQ] = useState(''); // search within the unassigned list
  const { locked, banner } = useMfaLock('/RegistrarPortal/Settings');

  const shs = isSHSGrade(grade);
  // Section cap is per "bucket": per grade (Elem/JHS), or per grade+strand (SHS),
  // so each SHS strand gets its own allowance.
  const bucketCount = shs
    ? (newStrand ? sections.filter((s) => (s.strand || '') === newStrand).length : 0)
    : sections.length;

  useEffect(() => { getActiveSchoolYear().then(setSchoolYear); }, []);
  useEffect(() => { getStrands().then(setShsStrands); }, []);
  useEffect(() => { getMaxSectionsPerGrade().then(setMaxSections); }, []);

  const load = useCallback(async () => {
    if (!schoolYear) return;
    setLoading(true);
    const [secs, enrolled] = await Promise.all([listSections(schoolYear, grade), listEnrolledInGrade(schoolYear, grade)]);
    setSections(secs); setPool(enrolled); setPicked({});
    setSelected((prev) => secs.find((s) => s.id === prev?.id) || null);
    setLoading(false);
  }, [schoolYear, grade]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!schoolYear) return undefined;
    const refresh = () => { load(); };
    const removeSections = subscribeToTable('sections', {
      channelName: `registrar-sections-${schoolYear}-${grade}`,
      filter: `school_year=eq.${schoolYear}`,
      onChange: refresh,
    });
    const removeApplications = subscribeToTable('applications', {
      channelName: `registrar-section-applications-${schoolYear}-${grade}`,
      onChange: refresh,
    });
    return () => { removeSections(); removeApplications(); };
  }, [schoolYear, grade, load]);

  const countIn = (nm) => pool.filter((a) => a.form?.section === nm).length;
  const members = selected ? pool.filter((a) => a.form?.section === selected.name) : [];
  const room = selected ? Math.max(0, SECTION_CAPACITY - members.length) : 0;
  const pickedCount = Object.values(picked).filter(Boolean).length;
  const unassigned = useMemo(() => {
    let list = pool.filter((a) => !a.form?.section);
    // A strand-specific SHS section draws from its own strand, plus any not-yet-
    // stranded SHS students (assigning them here sets their strand).
    if (selected?.strand) list = list.filter((a) => !a.form?.strand || a.form?.strand === selected.strand);
    return [...list].sort((a, b) => sort === 'fcfs'
      ? new Date(a.created_at) - new Date(b.created_at) // first come, first served
      : applicantName(a).localeCompare(applicantName(b)));
  }, [pool, sort, selected]);

  // Visible subset after the search box (does not affect selection/capacity math).
  const unassignedShown = useMemo(
    () => unassigned.filter((a) => applicantName(a).toLowerCase().includes(poolQ.trim().toLowerCase())),
    [unassigned, poolQ]);

  const addSection = async () => {
    if (!name.trim()) return setMsg('⚠️ Section name is required.');
    if (shs && !newStrand) return setMsg('⚠️ Choose a strand for this Senior High section.');
    if (bucketCount >= maxSections) return setMsg(`⚠️ This ${shs ? 'strand' : 'grade'} already has the maximum ${maxSections} sections. Delete an unused one first.`);
    setBusy(true); setMsg('');
    const r = await createSection({ schoolYear, grade, name: name.trim(), strand: shs ? newStrand : null });
    setBusy(false);
    if (!r.ok) return setMsg('⚠️ ' + r.error);
    setName(''); setNewStrand(''); await load();
  };

  const saveRename = async (s) => {
    setBusy(true); setMsg('');
    const r = await renameSection(s, editName);
    setBusy(false);
    if (!r.ok) return setMsg('⚠️ ' + r.error);
    setEditId(null); setEditName(''); await load();
  };

  const submit = async (s) => {
    if (!countIn(s.name)) return setMsg('⚠️ Add at least one student before submitting.');
    setBusy(true); setMsg('');
    const r = await submitSection(s);
    setBusy(false);
    if (!r.ok) return setMsg('⚠️ ' + r.error);
    setMsg(`✓ Submitted ${s.name} to Admin for approval.`); await load();
  };

  const assignPicked = async () => {
    const apps = unassigned.filter((a) => picked[a.id]);
    if (!apps.length) return;
    setBusy(true); setMsg('');
    const r = await assignToSection(apps, selected.name, selected);
    setBusy(false);
    if (!r.ok) return setMsg('⚠️ ' + r.error);
    setMsg(`✓ Assigned ${apps.length} student${apps.length === 1 ? '' : 's'} to ${selected.name}.`);
    await load();
  };
  // Auto-fill the section with the earliest-enrolled unassigned students (FCFS),
  // up to the remaining room. Respects the SHS strand filter via `unassigned`.
  const autoFill = async () => {
    if (!selected || room === 0) return;
    const pickFcfs = [...unassigned]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(0, room);
    if (!pickFcfs.length) return;
    setBusy(true); setMsg('');
    const r = await assignToSection(pickFcfs, selected.name, selected);
    setBusy(false);
    if (!r.ok) return setMsg('⚠️ ' + r.error);
    setMsg(`✓ Auto-assigned ${pickFcfs.length} earliest-enrolled student${pickFcfs.length === 1 ? '' : 's'} to ${selected.name}.`);
    await load();
  };
  const removeStudent = async (app) => { setBusy(true); await assignToSection([app], null, selected); setBusy(false); await load(); };
  const removeSection = async (s) => { if (countIn(s.name)) return setMsg('⚠️ Remove students from this section first.'); await deleteSection(s.id); if (selected?.id === s.id) setSelected(null); await load(); };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="p-8 md:p-12 max-w-[1400px] w-full mx-auto space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Class Sections</h1>
          <p className="text-slate-500 text-sm -mt-4">Section names are unique per grade · up to {SECTION_CAPACITY} students each · edit anytime, then submit to Admin for approval.</p>

          {banner}

          {/* filters + add */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-end gap-4">
            <Field label="School Year"><div className="sel w-36 bg-slate-100 !text-slate-500 flex items-center" title="Set by Admin — registrar can't change this">{schoolYear || '…'}</div></Field>
            <Field label="Grade">
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="sel w-40">
                {ALL_GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <div className="h-8 w-px bg-gray-200 mx-1" />
            <Field label="New section name"><input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSection()} className="sel w-44" placeholder={shs ? 'STEM-A' : 'St. Peter'} /></Field>
            {shs && (
              <Field label="Strand">
                <select value={newStrand} onChange={(e) => setNewStrand(e.target.value)} className="sel w-32">
                  <option value="">Select…</option>
                  {shsStrands.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            )}
            <button disabled={busy || locked || bucketCount >= maxSections} onClick={addSection} className="px-6 py-2.5 bg-[#800000] text-white rounded-xl font-bold hover:bg-[#600000] disabled:opacity-60">+ Add Section</button>
            {bucketCount >= maxSections && <span className="self-center text-[11px] font-bold text-red-500">Max {maxSections} reached{shs ? ' for this strand' : ''}</span>}
          </div>

          {msg && <div className={`rounded-xl px-5 py-3 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* section list */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">{grade} · {schoolYear} — {sections.length} section{sections.length === 1 ? '' : 's'}</h2>
              {loading && <p className="text-slate-400 text-sm">Loading…</p>}
              {!loading && sections.length === 0 && <div className="bg-white rounded-2xl border border-gray-100 p-6 text-slate-400 text-sm">No sections yet for {grade}. Add one above.</div>}
              {sections.map((s) => {
                const st = STATUS[sectionStatus(s)] || STATUS.pending;
                const count = countIn(s.name);
                const full = count >= SECTION_CAPACITY;
                return (
                  <div key={s.id} onClick={() => setSelected(s)} className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition ${selected?.id === s.id ? 'border-[#800000]' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className="flex items-center justify-between gap-3">
                      {editId === s.id ? (
                        <input autoFocus value={editName} onClick={(e) => e.stopPropagation()} onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveRename(s); if (e.key === 'Escape') setEditId(null); }}
                          className="sel flex-1 min-w-0" placeholder="Section name" />
                      ) : (
                        <p className="font-bold text-slate-800 truncate">{s.name}{s.strand ? <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-violet-50 text-violet-600 align-middle">{s.strand}</span> : ''}</p>
                      )}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide ${st.cls}`}>{st.label}</span>
                        <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${full ? 'text-red-600' : 'text-slate-600'}`}><HiOutlineUserGroup size={18} />{count}/{SECTION_CAPACITY}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                      {editId === s.id ? (
                        <>
                          <button disabled={busy || locked} onClick={() => saveRename(s)} className="px-3 py-1.5 text-xs font-bold bg-[#800000] text-white rounded-lg disabled:opacity-60">Save</button>
                          <button onClick={() => { setEditId(null); setEditName(''); }} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditId(s.id); setEditName(s.name); }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"><HiOutlinePencil size={14} /> Edit</button>
                          {sectionStatus(s) === 'approved'
                            ? <span className="text-xs font-bold text-emerald-600">✓ Approved by Admin</span>
                            : sectionStatus(s) === 'pending'
                              ? <span className="text-xs font-semibold text-amber-600">Awaiting Admin approval</span>
                              : <button disabled={busy || locked} onClick={() => submit(s)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60"><HiOutlinePaperAirplane size={13} /> Submit to Admin</button>}
                          <button disabled={locked} onClick={() => removeSection(s)} className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40" title="Delete section"><HiOutlineTrash size={16} /></button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* manage selected */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              {!selected ? (
                <p className="text-slate-400 text-sm py-8 text-center">Select a section to manage its students.</p>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800">{selected.name}{selected.strand ? <span className="ml-2 px-2 py-0.5 rounded-md text-[11px] font-black bg-violet-50 text-violet-600 align-middle">{selected.strand}</span> : ''}</h3>
                    <p className="text-[12px] text-slate-400">{members.length}/{SECTION_CAPACITY} students · {room} slot{room === 1 ? '' : 's'} left{selected.strand ? ` · ${selected.strand} students only` : ''}</p>
                  </div>

                  {/* members */}
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Members</p>
                  {members.length === 0 && <p className="text-slate-400 text-sm mb-4">No students yet.</p>}
                  <div className="space-y-1.5 mb-6 max-h-52 overflow-y-auto">
                    {members.map((a) => (
                      <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-sm font-semibold text-slate-700">{applicantName(a)} <span className="text-slate-400 font-normal">· enrolled {fmtDate(a.created_at)}</span></span>
                        <button disabled={busy || locked} onClick={() => removeStudent(a)} className="text-[11px] font-bold text-red-600 hover:underline disabled:opacity-40">Remove</button>
                      </div>
                    ))}
                  </div>

                  {/* add students */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add students ({unassigned.length} unassigned)</p>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className="text-xs font-bold text-slate-500 bg-slate-100 rounded-lg px-2 py-1 outline-none">
                      <option value="fcfs">Sort: Earliest enrolled</option>
                      <option value="name">Sort: Name</option>
                    </select>
                  </div>
                  <input value={poolQ} onChange={(e) => setPoolQ(e.target.value)} placeholder="Search unassigned by name…" className="sel w-full mb-2" />
                  {room === 0 && <p className="text-xs font-bold text-red-600 mb-2">Section is full ({SECTION_CAPACITY} students).</p>}
                  <div className="space-y-1.5 max-h-52 overflow-y-auto mb-4">
                    {unassigned.length === 0 && <p className="text-slate-400 text-sm">All enrolled students are sectioned.</p>}
                    {unassigned.length > 0 && unassignedShown.length === 0 && <p className="text-slate-400 text-sm">No unassigned student matches “{poolQ}”.</p>}
                    {unassignedShown.map((a) => {
                      const checked = !!picked[a.id];
                      const capReached = !checked && pickedCount >= room;
                      return (
                        <label key={a.id} className={`flex items-center gap-3 bg-white border border-slate-100 rounded-lg px-3 py-2 ${capReached ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50'}`}>
                          <input type="checkbox" checked={checked} disabled={capReached} onChange={(e) => setPicked({ ...picked, [a.id]: e.target.checked })} className="accent-[#800000] w-4 h-4" />
                          <span className="text-sm font-semibold text-slate-700 flex-1">{applicantName(a)}</span>
                          <span className="text-xs font-bold text-slate-500">enrolled {fmtDate(a.created_at)}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button disabled={busy || room === 0 || unassigned.length === 0 || locked} onClick={autoFill} title="Fill the remaining slots with the earliest-enrolled unassigned students"
                      className="px-4 py-2.5 border border-teal-600 text-teal-700 rounded-xl font-bold text-sm hover:bg-teal-50 disabled:opacity-40 whitespace-nowrap">Auto-fill {room ? `(${Math.min(room, unassigned.length)})` : ''}</button>
                    <button disabled={busy || pickedCount === 0 || locked} onClick={assignPicked} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold disabled:opacity-50">Assign {pickedCount || ''} to {selected.name}</button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">Auto-fill assigns earliest-enrolled first. Editing a section sends it back to Admin for re-approval.</p>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
      <style>{`.sel{background:#F1F3F6;border-radius:.75rem;padding:.6rem .8rem;font-size:.875rem;font-weight:600;color:#475569;border:none;outline:none}`}</style>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

export default Sections;
