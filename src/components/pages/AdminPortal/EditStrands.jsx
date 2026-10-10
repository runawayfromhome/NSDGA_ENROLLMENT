// Admin editor: SHS Courses (Strands). DepEd can revise the Senior High
// curriculum, so the list of strands offered in the Apply form, re-enrollment,
// and section creation is managed here instead of being hard-coded.
import { useEffect, useState } from 'react';
import { getStrands, saveStrands, DEFAULT_STRANDS } from '../../../lib/content';
import { useMfaLock } from '../../MfaLock';
import { CardSkeleton } from '../../Skeleton';

const uid = () => Math.random().toString(16).slice(2, 10);

const EditStrands = () => {
  const [rows, setRows] = useState(null); // [{ id, value }]
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { locked, banner } = useMfaLock('/AdminPortal/Settings');

  useEffect(() => {
    getStrands().then((items) => setRows(items.map((v) => ({ id: uid(), value: v }))));
  }, []);

  const setVal = (id, value) => setRows((r) => r.map((x) => (x.id === id ? { ...x, value } : x)));
  const add = () => setRows((r) => [...r, { id: uid(), value: '' }]);
  const remove = (id) => setRows((r) => r.filter((x) => x.id !== id));
  const resetDefaults = () => {
    if (window.confirm('Reset the list to the default DepEd strands? Unsaved changes will be lost. Remember to Save.')) {
      setRows(DEFAULT_STRANDS.map((v) => ({ id: uid(), value: v })));
    }
  };

  const save = async () => {
    const items = rows.map((r) => r.value.trim()).filter(Boolean);
    // Guard against duplicates (case-insensitive) — they'd create confusing dropdowns.
    const seen = new Set();
    for (const s of items) {
      const k = s.toLowerCase();
      if (seen.has(k)) { setError(`Duplicate course: "${s}". Each course must be unique.`); return; }
      seen.add(k);
    }
    if (items.length === 0) { setError('Add at least one SHS course, or this list will fall back to the defaults.'); return; }
    setSaving(true); setError(''); setSaved(false);
    const res = await saveStrands(items);
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else setError(res.error || 'Could not save. Are you an Admin?');
  };

  if (!rows) return <div className="min-h-screen bg-[#E5E7EB] py-10 px-4 md:px-16"><div className="max-w-3xl mx-auto space-y-6"><CardSkeleton lines={2} /><CardSkeleton lines={4} /></div></div>;

  return (
    <div className="min-h-screen bg-[#E5E7EB] py-10 px-4 md:px-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-[#800000]" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">SHS Courses</h1>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-bold text-emerald-600">Saved ✓</span>}
            <button onClick={save} disabled={saving || locked} className="px-7 py-2.5 bg-[#800000] text-white rounded-lg font-bold hover:bg-[#600000] disabled:opacity-60 cursor-pointer shadow-md">{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>

        {banner}
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#800000]" />
              <h3 className="text-lg font-bold text-gray-800">Senior High School Strands / Courses</h3>
            </div>
            <button onClick={add} disabled={locked} className="px-4 py-2 bg-[#800000]/10 text-[#800000] rounded-lg font-bold text-sm hover:bg-[#800000]/20 disabled:opacity-50 cursor-pointer">+ Add course</button>
          </div>
          <p className="text-xs text-gray-500 mb-6 ml-4">
            These appear in the Senior High <b>strand</b> dropdown on the Apply form, re-enrollment, and when the Registrar creates SHS sections.
            <span className="block mt-1 text-amber-600">⚠️ Renaming a course does not change students already assigned to the old name — add new courses rather than renaming when a curriculum changes, so existing records still match.</span>
          </p>

          {rows.length === 0 && <p className="text-slate-400 text-sm mb-4">No courses yet. Add at least one, or it falls back to the DepEd defaults.</p>}

          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="w-6 text-right text-xs font-bold text-slate-400">{i + 1}.</span>
                <input
                  className="ip flex-1"
                  placeholder="e.g. STEM"
                  value={r.value}
                  maxLength={60}
                  disabled={locked}
                  onChange={(e) => setVal(r.id, e.target.value)}
                />
                <button onClick={() => remove(r.id)} disabled={locked} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold text-sm disabled:opacity-40 cursor-pointer">Delete</button>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <button onClick={resetDefaults} disabled={locked} className="text-xs font-bold text-slate-500 hover:text-[#800000] disabled:opacity-40 cursor-pointer">↺ Reset to DepEd defaults ({DEFAULT_STRANDS.join(', ')})</button>
          </div>
        </div>
      </div>

      <style>{`.ip{width:100%;border:1px solid #E5E7EB;border-radius:.6rem;padding:.6rem .8rem;font-size:.875rem;outline:none;background:#fff}.ip:focus{border-color:#800000}`}</style>
    </div>
  );
};

export default EditStrands;
