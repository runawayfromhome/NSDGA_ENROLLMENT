// Admin editor: SHS Courses (Strands). DepEd can revise the Senior High
// curriculum, so the list of strands offered in the Apply form, re-enrollment,
// and section creation is managed here instead of being hard-coded.
//
// Below that list is a SEPARATE "Strand Promo" manager for the public
// /SHSStrands showcase page: standalone cards (name + description + photos),
// added/edited in a modal. It is DECOUPLED from the strand name list above, so
// editing promos never affects the Apply dropdown.
import { useEffect, useState } from 'react';
import { getStrands, saveStrands, DEFAULT_STRANDS, getStrandPromo, saveStrandPromo, uploadSiteImage } from '../../../lib/content';
import { useMfaLock } from '../../MfaLock';
import { CardSkeleton } from '../../Skeleton';
import { HiOutlinePhotograph, HiPencil, HiOutlineTrash, HiPlus, HiX } from 'react-icons/hi';

const uid = () => Math.random().toString(16).slice(2, 10);
const MAX_IMAGES = 6;
const DESC_LIMIT = 500;

// Shows an image, but falls back to a placeholder icon if the URL is broken
// (deleted / moved / corrupt) — so a broken image never renders as a broken icon.
function SafeImg({ src, className, fallback }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return fallback;
  return <img src={src} alt="" className={className} onError={() => setOk(false)} />;
}

const EditStrands = () => {
  const [rows, setRows] = useState(null); // [{ id, value }]
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { locked, banner } = useMfaLock('/AdminPortal/Settings');

  // --- Promo manager state (separate from the name list) ---
  const [promo, setPromo] = useState(null);   // [{ id, name, description, images[] }]
  const [modal, setModal] = useState(null);   // { id|null, draft } when open
  const [pSaving, setPSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pToast, setPToast] = useState('');
  const [pErr, setPErr] = useState('');

  useEffect(() => {
    getStrands().then((items) => setRows(items.map((v) => ({ id: uid(), value: v }))));
    getStrandPromo().then((items) => setPromo(items.map((it) => ({ id: it.id || uid(), ...it }))));
  }, []);

  // ---- Name list (unchanged — feeds Apply / sections) ----------------------
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

  // ---- Promo manager -------------------------------------------------------
  const pFlash = (m) => { setPToast(m); setTimeout(() => setPToast(''), 2500); };
  const persistPromo = async (next) => {
    const clean = next.map((x) => ({ id: x.id, name: (x.name || '').trim(), description: (x.description || '').trim(), images: (x.images || []).filter(Boolean) }));
    return saveStrandPromo(clean);
  };

  const openAdd = () => { setPErr(''); setModal({ id: null, draft: { name: '', description: '', images: [] } }); };
  const openEdit = (item) => { setPErr(''); setModal({ id: item.id, draft: { name: item.name || '', description: item.description || '', images: [...(item.images || [])] } }); };
  const closeModal = () => { if (!pSaving && !uploading) { setModal(null); setPErr(''); } };
  const setDraft = (p) => setModal((m) => ({ ...m, draft: { ...m.draft, ...p } }));

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (modal.draft.images.length >= MAX_IMAGES) { setPErr(`Up to ${MAX_IMAGES} photos per strand.`); return; }
    setUploading(true); setPErr('');
    const res = await uploadSiteImage(file, 'strands');
    setUploading(false);
    if (!res.ok) { setPErr(res.error || 'Upload failed'); return; }
    setDraft({ images: [...modal.draft.images, res.url] });
  };
  const removeImage = (idx) => setDraft({ images: modal.draft.images.filter((_, i) => i !== idx) });

  const saveModal = async () => {
    const name = modal.draft.name.trim();
    if (!name) { setPErr('Enter the strand name.'); return; }
    const clean = { name, description: modal.draft.description.trim(), images: modal.draft.images.filter(Boolean) };
    const next = modal.id
      ? promo.map((x) => (x.id === modal.id ? { ...x, ...clean } : x))
      : [...promo, { id: uid(), ...clean }];
    setPSaving(true); setPErr('');
    const res = await persistPromo(next);
    setPSaving(false);
    if (!res.ok) { setPErr(res.error || 'Could not save. Are you an Admin with MFA enabled?'); return; }
    setPromo(next);
    setModal(null);
    pFlash(modal.id ? 'Strand updated ✓' : 'Strand added ✓');
  };

  const deletePromo = async (item) => {
    if (!window.confirm(`Delete “${item.name}” from the Strands page?`)) return;
    const next = promo.filter((x) => x.id !== item.id);
    setPSaving(true); setPErr('');
    const res = await persistPromo(next);
    setPSaving(false);
    if (!res.ok) { setPErr(res.error || 'Could not save.'); return; }
    setPromo(next);
    pFlash('Strand deleted ✓');
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

        {/* ===== 1) Strand NAME list (feeds Apply form + sections) ===== */}
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
                <input className="ip flex-1" placeholder="e.g. STEM" value={r.value} maxLength={60} disabled={locked} onChange={(e) => setVal(r.id, e.target.value)} />
                <button onClick={() => remove(r.id)} disabled={locked} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold text-sm disabled:opacity-40 cursor-pointer">Delete</button>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <button onClick={resetDefaults} disabled={locked} className="text-xs font-bold text-slate-500 hover:text-[#800000] disabled:opacity-40 cursor-pointer">↺ Reset to DepEd defaults ({DEFAULT_STRANDS.join(', ')})</button>
          </div>
        </div>

        {/* ===== 2) Strand PROMO (public /SHSStrands page) ===== */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#800000]" />
              <h3 className="text-lg font-bold text-gray-800">Strand Promo — Public Page</h3>
            </div>
            <div className="flex items-center gap-3">
              {pToast && <span className="text-xs font-bold text-emerald-600">{pToast}</span>}
              <a href="/SHSStrands" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg border border-[#800000] text-[#800000] font-bold text-sm hover:bg-[#800000]/5">View page ↗</a>
              <button onClick={openAdd} disabled={locked} className="px-4 py-2 bg-[#800000] text-white rounded-lg font-bold text-sm hover:bg-[#600000] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"><HiPlus /> Add strand</button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-6 ml-4">
            Promotional cards shown on the public <b>Strands / Tracks</b> page (/SHSStrands). Each has one or more photos (shown as a left/right carousel), a name, and a description. This is separate from the list above — changes here do <b>not</b> affect the Apply form.
          </p>

          {pErr && !modal && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pErr}</div>}
          {promo === null && <p className="text-slate-400 text-sm">Loading…</p>}
          {promo && promo.length === 0 && <p className="text-slate-400 text-sm">No promo strands yet. Click “Add strand” to create the first card.</p>}

          <div className="space-y-3">
            {(promo || []).map((item) => (
              <div key={item.id} className="flex items-center gap-4 border border-gray-100 rounded-xl p-3 hover:border-[#800000]/30 transition-colors">
                <div className="relative w-20 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  <SafeImg src={item.images?.[0]} className="w-full h-full object-cover" fallback={<HiOutlinePhotograph className="text-gray-300" size={22} />} />
                  {item.images?.length > 1 && <span className="absolute bottom-0.5 right-0.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">{item.images.length}</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{item.name || <span className="italic text-slate-400">Untitled</span>}</p>
                  <p className="text-[12px] text-slate-500 truncate mt-0.5">{item.description || <span className="italic text-slate-400">No description</span>}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(item)} disabled={locked} className="p-2 text-slate-500 hover:text-[#800000] hover:bg-[#800000]/5 rounded-lg disabled:opacity-40 cursor-pointer" title="Edit"><HiPencil size={17} /></button>
                  <button onClick={() => deletePromo(item)} disabled={locked || pSaving} className="p-2 text-[#C55A5A] hover:bg-red-50 rounded-lg disabled:opacity-40 cursor-pointer" title="Delete"><HiOutlineTrash size={17} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---- Add / Edit promo modal ---- */}
      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-gray-900">{modal.id ? 'Edit Strand' : 'Add Strand'}</h3>
              <button onClick={closeModal} disabled={pSaving || uploading} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg disabled:opacity-40 cursor-pointer"><HiX size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              {pErr && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pErr}</div>}

              {/* Photos */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Photos <span className="normal-case font-normal text-slate-400">(up to {MAX_IMAGES} — shown as a carousel)</span></label>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {modal.draft.images.map((src, idx) => (
                    <div key={idx} className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(idx)} disabled={locked} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[11px] hover:bg-black/80 cursor-pointer" title="Remove"><HiX size={12} /></button>
                    </div>
                  ))}
                  {modal.draft.images.length < MAX_IMAGES && (
                    <label className="w-24 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center shrink-0 cursor-pointer hover:border-[#800000] text-slate-400 hover:text-[#800000]">
                      {uploading ? <span className="text-[11px] font-bold">Uploading…</span> : <><HiOutlinePhotograph size={22} /><span className="text-[10px] font-bold mt-0.5">Add photo</span></>}
                      <input type="file" accept="image/*" className="hidden" disabled={locked || uploading} onChange={onFile} />
                    </label>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Landscape looks best. No photo = themed default on the page.</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Strand Name</label>
                <input className="ip w-full" placeholder="e.g. HT - Hospitality and Tourism" value={modal.draft.name} maxLength={80} disabled={locked} autoFocus onChange={(e) => setDraft({ name: e.target.value })} />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">Description</label>
                  <span className={`text-[11px] font-semibold ${modal.draft.description.length >= DESC_LIMIT ? 'text-red-500' : 'text-slate-400'}`}>{modal.draft.description.length}/{DESC_LIMIT}</span>
                </div>
                <textarea rows={5} className="ip w-full resize-y" placeholder="Short promo description shown on the strand card…" value={modal.draft.description} maxLength={DESC_LIMIT} disabled={locked} onChange={(e) => setDraft({ description: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
              <button onClick={closeModal} disabled={pSaving || uploading} className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 disabled:opacity-50 cursor-pointer">Cancel</button>
              <button onClick={saveModal} disabled={locked || pSaving || uploading} className="px-7 py-2.5 bg-[#800000] text-white rounded-lg font-bold text-sm hover:bg-[#600000] disabled:opacity-60 cursor-pointer shadow-md">{pSaving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.ip{width:100%;border:1px solid #E5E7EB;border-radius:.6rem;padding:.6rem .8rem;font-size:.875rem;outline:none;background:#fff}.ip:focus{border-color:#800000}`}</style>
    </div>
  );
};

export default EditStrands;
