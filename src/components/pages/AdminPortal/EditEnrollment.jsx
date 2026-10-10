// Admin editor: Enrollment Period toggle + Announcements.
// - Enrollment open/closed gates the public Apply wizard.
// - Announcements show in the student portal.
import { useEffect, useState } from 'react';
import { getEnrollment, saveEnrollment, seasonStatus } from '../../../lib/content';
import { useMfaLock } from '../../MfaLock';
import { nextSchoolYear } from '../../../lib/grades';
import { CardSkeleton } from '../../Skeleton';

const uid = () => Math.random().toString(16).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

const EditEnrollment = () => {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { locked, banner } = useMfaLock('/AdminPortal/Settings');

  useEffect(() => { getEnrollment().then(setData); }, []);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const advanceYear = () => {
    const next = nextSchoolYear(data.activeSchoolYear);
    if (next === data.activeSchoolYear) return;
    if (window.confirm(`Advance the Active School Year to ${next}?\n\nNew applications and new sections will be filed under ${next}. Existing records are not affected. Don't forget to Save.`)) {
      set('activeSchoolYear', next);
    }
  };
  const setAnn = (id, field, value) => set('announcements', data.announcements.map((a) => a.id === id ? { ...a, [field]: value } : a));
  const addAnn = () => set('announcements', [{ id: uid(), title: '', body: '', date: today() }, ...data.announcements]);
  const removeAnn = (id) => set('announcements', data.announcements.filter((a) => a.id !== id));

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    const res = await saveEnrollment(data);
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else setError(res.error || 'Could not save. Are you an Admin?');
  };

  if (!data) return <div className="min-h-screen bg-[#E5E7EB] py-10 px-4 md:px-16"><div className="max-w-4xl mx-auto space-y-6"><CardSkeleton lines={2} /><CardSkeleton lines={3} /></div></div>;

  return (
    <div className="min-h-screen bg-[#E5E7EB] py-10 px-4 md:px-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-[#800000]" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Enrollment &amp; Announcements</h1>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-bold text-emerald-600">Saved ✓</span>}
            <button onClick={save} disabled={saving || locked} className="px-7 py-2.5 bg-[#800000] text-white rounded-lg font-bold hover:bg-[#600000] disabled:opacity-60 cursor-pointer shadow-md">{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>

        {banner}
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* Enrollment period */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-[#800000]" />
            <h3 className="text-lg font-bold text-gray-800">Online Admission Period</h3>
          </div>
          <label className="flex items-center gap-3 cursor-pointer mb-5">
            <input type="checkbox" checked={data.open} onChange={(e) => set('open', e.target.checked)} className="w-5 h-5 accent-[#800000]" />
            <span className="font-semibold text-gray-700">Online admission is <b className={data.open ? 'text-emerald-600' : 'text-red-600'}>{data.open ? 'OPEN' : 'CLOSED'}</b></span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <label className="block">
              <span className="block font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">Active School Year</span>
              <div className="flex gap-2">
                <input className="ip flex-1" value={data.activeSchoolYear} onChange={(e) => set('activeSchoolYear', e.target.value)} placeholder="2026-2027" />
                <button type="button" onClick={advanceYear} title={`Advance to ${nextSchoolYear(data.activeSchoolYear)}`} className="shrink-0 px-3 rounded-lg bg-[#800000] text-white text-xs font-bold hover:bg-[#600000] cursor-pointer whitespace-nowrap">Next year →</button>
              </div>
            </label>
            <label className="block">
              <span className="block font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">Season Start</span>
              <input className="ip" type="date" value={data.seasonStart} onChange={(e) => set('seasonStart', e.target.value)} />
            </label>
            <label className="block">
              <span className="block font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">Season End</span>
              <input className="ip" type="date" value={data.seasonEnd} onChange={(e) => set('seasonEnd', e.target.value)} />
            </label>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            Current status: <b className={seasonStatus(data).open ? 'text-emerald-600' : 'text-red-600'}>{seasonStatus(data).label}</b>
            <span className="text-gray-400"> — leave the dates blank to control it with the toggle only. <b>All new applicants and new sections are filed under the Active School Year</b> — use “Next year →” to advance it when a new enrollment season begins.</span>
          </p>
          <label className="block mb-5">
            <span className="block font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">Max Sections per Grade / Strand</span>
            <input className="ip w-40" type="number" min="1" max="100" value={data.maxSectionsPerGrade ?? 20}
              onChange={(e) => set('maxSectionsPerGrade', e.target.value === '' ? '' : Math.max(1, Math.min(100, Number(e.target.value) || 1)))} />
            <span className="block text-[11px] text-gray-400 mt-1.5">Anti-spam cap on how many sections the Registrar may create per grade (per strand for Senior High). Default <b>20</b>. Raise it only if a grade genuinely needs more.</span>
          </label>
          <label className="block">
            <span className="block font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">Message shown when closed</span>
            <textarea className="ip" style={{ minHeight: 80 }} value={data.closedMessage} onChange={(e) => set('closedMessage', e.target.value)} />
          </label>
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#800000]" />
              <h3 className="text-lg font-bold text-gray-800">Announcements <span className="text-slate-400 font-normal text-sm">(shown to students)</span></h3>
            </div>
            <button onClick={addAnn} className="px-4 py-2 bg-[#800000]/10 text-[#800000] rounded-lg font-bold text-sm hover:bg-[#800000]/20 cursor-pointer">+ Add</button>
          </div>

          {data.announcements.length === 0 && <p className="text-slate-400 text-sm">No announcements yet.</p>}

          <div className="space-y-5">
            {data.announcements.map((a) => (
              <div key={a.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex gap-3 mb-3">
                  <input className="ip flex-1" placeholder="Title" value={a.title} onChange={(e) => setAnn(a.id, 'title', e.target.value)} />
                  <input className="ip w-44" type="date" value={a.date} onChange={(e) => setAnn(a.id, 'date', e.target.value)} />
                  <button onClick={() => removeAnn(a.id)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold text-sm cursor-pointer">Delete</button>
                </div>
                <textarea className="ip" style={{ minHeight: 64 }} placeholder="Announcement details…" value={a.body} onChange={(e) => setAnn(a.id, 'body', e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`.ip{width:100%;border:1px solid #E5E7EB;border-radius:.6rem;padding:.6rem .8rem;font-size:.875rem;outline:none;background:#fff}.ip:focus{border-color:#800000}`}</style>
    </div>
  );
};

export default EditEnrollment;
