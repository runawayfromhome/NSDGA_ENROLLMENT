// Admin editor for the Academic Schedule — PER LEVEL (Kinder / Elementary /
// Junior High / Senior High), because Elem & JHS use quarters while SHS uses
// semesters. Saves to Supabase (site_content.schedule); the public Calendar
// reads it. A "term" is just a named period (Quarter or Semester) with rows.
import { useEffect, useState } from 'react';
import { getSection, saveSection } from '../../../lib/content';
import { HiOutlineTrash, HiChevronUp, HiChevronDown, HiPlus } from 'react-icons/hi';

const rid = () => Math.random().toString(16).slice(2, 8);
const q = (name) => ({ id: rid(), name, range: '', items: [] });

const defaultSchedule = () => ({
  levels: [
    { id: 'kinder', label: 'Kindergarten', terms: [q('1st Quarter'), q('2nd Quarter'), q('3rd Quarter'), q('4th Quarter')] },
    { id: 'elementary', label: 'Elementary', terms: [q('1st Quarter'), q('2nd Quarter'), q('3rd Quarter'), q('4th Quarter')] },
    { id: 'junior', label: 'Junior High', terms: [q('1st Quarter'), q('2nd Quarter'), q('3rd Quarter'), q('4th Quarter')] },
    { id: 'senior', label: 'Senior High', terms: [
      { id: rid(), name: '1st Semester', range: 'August – December 2025', items: [
        { id: rid(), label: 'Start of Classes', date: 'Aug 14, 2025' },
        { id: rid(), label: 'Mid-term Exams', date: 'Oct 16–18, 2025' },
        { id: rid(), label: 'Final Exams', date: 'Dec 11–13, 2025' },
      ] },
      { id: rid(), name: '2nd Semester', range: 'January – June 2026', items: [
        { id: rid(), label: 'Resumption of Classes', date: 'Jan 6, 2026' },
        { id: rid(), label: 'Commencement Exercises', date: 'June 4–6, 2026' },
      ] },
    ] },
  ],
});

const move = (arr, i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

const EditAcademicSched = () => {
  const [levels, setLevels] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const c = await getSection('schedule');
      setLevels(c.levels?.length ? c.levels : defaultSchedule().levels);
      setLoading(false);
    })();
  }, []);

  const active = levels[activeIdx] || { terms: [] };
  const setActiveTerms = (terms) => setLevels(levels.map((l, i) => (i === activeIdx ? { ...l, terms } : l)));

  const patchTerm = (ti, patch) => setActiveTerms(active.terms.map((t, i) => (i === ti ? { ...t, ...patch } : t)));
  const addTerm = () => setActiveTerms([...active.terms, { id: rid(), name: 'New Term', range: '', items: [] }]);
  const removeTerm = (ti) => setActiveTerms(active.terms.filter((_, i) => i !== ti));
  const moveTerm = (ti, dir) => setActiveTerms(move(active.terms, ti, dir));

  const addItem = (ti) => patchTerm(ti, { items: [...active.terms[ti].items, { id: rid(), label: '', date: '' }] });
  const removeItem = (ti, ii) => patchTerm(ti, { items: active.terms[ti].items.filter((_, i) => i !== ii) });
  const moveItem = (ti, ii, dir) => patchTerm(ti, { items: move(active.terms[ti].items, ii, dir) });
  const patchItem = (ti, ii, patch) => patchTerm(ti, { items: active.terms[ti].items.map((it, i) => (i === ii ? { ...it, ...patch } : it)) });

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    const res = await saveSection('schedule', { levels });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else setError(res.error || 'Could not save. Are you an Admin?');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] py-10 px-6 md:px-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <div className="flex items-center gap-4 mb-1">
              <div className="w-2 h-10 bg-[#800000]" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Academic Schedule</h1>
            </div>
            <p className="text-gray-500 text-sm max-w-lg ml-6">Set milestones per level. Elementary &amp; Junior High use quarters; Senior High uses semesters. Shown on the public Calendar.</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-bold text-emerald-600">Saved ✓</span>}
            <button onClick={save} disabled={saving} className="px-7 py-2.5 bg-[#800000] text-white rounded-lg font-bold hover:bg-[#600000] disabled:opacity-60 cursor-pointer shadow-md">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading && <p className="text-slate-400 text-sm">Loading…</p>}

        {!loading && (
          <>
            {/* Level tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {levels.map((l, i) => (
                <button key={l.id} onClick={() => setActiveIdx(i)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-colors cursor-pointer ${i === activeIdx ? 'bg-[#800000] text-white' : 'bg-white border border-gray-200 text-slate-500 hover:bg-gray-50'}`}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* Terms of the active level */}
            <div className="space-y-5">
              {active.terms.map((term, ti) => (
                <div key={term.id} className="bg-white rounded-2xl border-l-4 border-[#800000] shadow-sm p-5">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <input value={term.name} onChange={(e) => patchTerm(ti, { name: e.target.value })}
                      className="flex-1 min-w-[160px] text-lg font-bold text-[#800000] border-b border-transparent hover:border-gray-200 focus:border-[#800000] outline-none" placeholder="Term name (e.g. 1st Quarter)" />
                    <input value={term.range} onChange={(e) => patchTerm(ti, { range: e.target.value })}
                      className="w-56 text-xs font-medium text-slate-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#800000]" placeholder="Date range (e.g. Aug – Oct 2025)" />
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveTerm(ti, -1)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"><HiChevronUp /></button>
                      <button onClick={() => moveTerm(ti, 1)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"><HiChevronDown /></button>
                      <button onClick={() => removeTerm(ti)} className="p-1.5 text-[#C55A5A] hover:bg-red-50 rounded cursor-pointer"><HiOutlineTrash /></button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {term.items.map((it, ii) => (
                      <div key={it.id} className="flex items-center gap-3">
                        <input value={it.label} onChange={(e) => patchItem(ti, ii, { label: e.target.value })}
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#800000]" placeholder="Milestone (e.g. Final Exams)" />
                        <input value={it.date} onChange={(e) => patchItem(ti, ii, { date: e.target.value })}
                          className="w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#800000]" placeholder="Date (e.g. Dec 11–13)" />
                        <button onClick={() => moveItem(ti, ii, -1)} className="p-1 text-slate-300 hover:text-slate-600 cursor-pointer"><HiChevronUp /></button>
                        <button onClick={() => moveItem(ti, ii, 1)} className="p-1 text-slate-300 hover:text-slate-600 cursor-pointer"><HiChevronDown /></button>
                        <button onClick={() => removeItem(ti, ii)} className="p-1 text-[#C55A5A] hover:bg-red-50 rounded cursor-pointer"><HiOutlineTrash /></button>
                      </div>
                    ))}
                    <button onClick={() => addItem(ti)} className="text-[#800000] text-sm font-bold flex items-center gap-1 mt-1 cursor-pointer"><HiPlus /> Add milestone</button>
                  </div>
                </div>
              ))}

              <button onClick={addTerm} className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-slate-500 font-bold text-sm hover:border-[#800000] hover:text-[#800000] cursor-pointer">
                + Add Term (Quarter / Semester)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EditAcademicSched;
