// Registrar → Sections — create class sections per grade (Grade 1–12, many per
// grade) and assign enrolled students to each. Assignment is first-come,
// first-served: the unassigned list is ordered by enrollment date (earliest
// first). Sections stay editable; only Admin can print the lists.
import { useEffect, useMemo, useState } from 'react';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import {
  listSections, createSection, deleteSection,
  listEnrolledInGrade, assignToSection, applicantName,
} from '../../../lib/registrar';
import { getActiveSchoolYear } from '../../../lib/content';
import { ALL_GRADES } from '../../../lib/grades';
import { HiOutlineUserGroup, HiOutlineTrash } from "react-icons/hi";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—');

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
  const [form, setForm] = useState({ name: '', capacity: '' });

  useEffect(() => { getActiveSchoolYear().then(setSchoolYear); }, []);

  const load = async () => {
    if (!schoolYear) return;
    setLoading(true);
    const [secs, enrolled] = await Promise.all([listSections(schoolYear, grade), listEnrolledInGrade(schoolYear, grade)]);
    setSections(secs); setPool(enrolled); setPicked({});
    setSelected((prev) => secs.find((s) => s.id === prev?.id) || null);
    setLoading(false);
  };
  useEffect(() => { load(); }, [schoolYear, grade]);

  const countIn = (name) => pool.filter((a) => a.form?.section === name).length;
  const members = selected ? pool.filter((a) => a.form?.section === selected.name) : [];
  const unassigned = useMemo(() => {
    const list = pool.filter((a) => !a.form?.section);
    return [...list].sort((a, b) => sort === 'fcfs'
      ? new Date(a.created_at) - new Date(b.created_at) // first come, first served
      : applicantName(a).localeCompare(applicantName(b)));
  }, [pool, sort]);

  const addSection = async () => {
    if (!form.name.trim()) return setMsg('⚠️ Section name is required.');
    setBusy(true); setMsg('');
    const r = await createSection({ schoolYear, grade, name: form.name.trim(), capacity: form.capacity ? +form.capacity : null });
    setBusy(false);
    if (!r.ok) return setMsg('⚠️ ' + r.error);
    setForm({ name: '', capacity: '' }); await load();
  };

  const assignPicked = async () => {
    const apps = unassigned.filter((a) => picked[a.id]);
    if (!apps.length) return;
    setBusy(true); setMsg('');
    const r = await assignToSection(apps, selected.name);
    setBusy(false);
    if (!r.ok) return setMsg('⚠️ ' + r.error);
    setMsg(`✓ Assigned ${apps.length} student${apps.length === 1 ? '' : 's'} to ${selected.name}.`);
    await load();
  };
  const removeStudent = async (app) => { setBusy(true); await assignToSection([app], null); setBusy(false); await load(); };
  const removeSection = async (s) => { if (countIn(s.name)) return setMsg('⚠️ Remove students from this section first.'); await deleteSection(s.id); if (selected?.id === s.id) setSelected(null); await load(); };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <RegistrarSidebar />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="p-8 md:p-12 max-w-[1400px] w-full mx-auto space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Class Sections</h1>

          {/* filters + add */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-end gap-4">
            <Field label="School Year"><input value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)} className="sel w-36" placeholder="2026-2027" /></Field>
            <Field label="Grade">
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="sel w-40">
                {ALL_GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <div className="h-8 w-px bg-gray-200 mx-1" />
            <Field label="New section name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="sel w-44" placeholder="St. Peter" /></Field>
            <Field label="Capacity"><input value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="sel w-24" placeholder="40" /></Field>
            <button disabled={busy} onClick={addSection} className="px-6 py-2.5 bg-[#800000] text-white rounded-xl font-bold hover:bg-[#600000] disabled:opacity-60">+ Add Section</button>
          </div>

          {msg && <div className={`rounded-xl px-5 py-3 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* section list */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">{grade} · {schoolYear} — {sections.length} section{sections.length === 1 ? '' : 's'}</h2>
              {loading && <p className="text-slate-400 text-sm">Loading…</p>}
              {!loading && sections.length === 0 && <div className="bg-white rounded-2xl border border-gray-100 p-6 text-slate-400 text-sm">No sections yet for {grade}. Add one above.</div>}
              {sections.map((s) => (
                <div key={s.id} onClick={() => setSelected(s)} className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition ${selected?.id === s.id ? 'border-[#800000]' : 'border-gray-100 hover:border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800">{s.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600"><HiOutlineUserGroup size={18} />{countIn(s.name)}{s.capacity ? `/${s.capacity}` : ''}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeSection(s); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete section"><HiOutlineTrash size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* manage selected */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              {!selected ? (
                <p className="text-slate-400 text-sm py-8 text-center">Select a section to manage its students.</p>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800">{selected.name}</h3>
                    <p className="text-[12px] text-slate-400">{members.length}{selected.capacity ? `/${selected.capacity}` : ''} students</p>
                  </div>

                  {/* members */}
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Members</p>
                  {members.length === 0 && <p className="text-slate-400 text-sm mb-4">No students yet.</p>}
                  <div className="space-y-1.5 mb-6 max-h-52 overflow-y-auto">
                    {members.map((a) => (
                      <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-sm font-semibold text-slate-700">{applicantName(a)} <span className="text-slate-400 font-normal">· enrolled {fmtDate(a.created_at)}</span></span>
                        <button disabled={busy} onClick={() => removeStudent(a)} className="text-[11px] font-bold text-red-600 hover:underline">Remove</button>
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
                  <div className="space-y-1.5 max-h-52 overflow-y-auto mb-4">
                    {unassigned.length === 0 && <p className="text-slate-400 text-sm">All enrolled students are sectioned.</p>}
                    {unassigned.map((a) => (
                      <label key={a.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" checked={!!picked[a.id]} onChange={(e) => setPicked({ ...picked, [a.id]: e.target.checked })} className="accent-[#800000] w-4 h-4" />
                        <span className="text-sm font-semibold text-slate-700 flex-1">{applicantName(a)}</span>
                        <span className="text-xs font-bold text-slate-500">enrolled {fmtDate(a.created_at)}</span>
                      </label>
                    ))}
                  </div>
                  <button disabled={busy || !Object.values(picked).some(Boolean)} onClick={assignPicked} className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold disabled:opacity-50">Assign selected to {selected.name}</button>
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
