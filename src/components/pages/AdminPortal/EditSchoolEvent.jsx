// Admin editor for School Events. Loads/saves from Supabase (site_content),
// supports up to 6 photos per event (shown as a carousel on the public pages),
// and a Publish toggle. Published events appear on the homepage and Calendar.
import { useEffect, useState } from 'react';
import { getSection, saveSection, uploadSiteImage, formatEventDate, eventImages } from '../../../lib/content';
import { useMfaLock } from '../../MfaLock';
import { HiOutlineCalendar, HiOutlinePencilAlt, HiOutlineTrash, HiOutlinePhotograph, HiPlus, HiX } from 'react-icons/hi';

const MAX_IMAGES = 6;
const DESC_LIMIT = 500;
const blank = { id: '', title: '', date: '', category: '', location: '', description: '', images: [], published: true };

// Image that falls back to a placeholder icon if the URL is broken.
function SafeImg({ src, className, fallback }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return fallback;
  return <img src={src} alt="" className={className} onError={() => setOk(false)} />;
}

const EditSchoolEvent = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { locked, banner } = useMfaLock('/AdminPortal/Settings');

  const load = async () => { const c = await getSection('events'); setItems(c.items || []); setLoading(false); };
  useEffect(() => { load(); }, []);

  const persist = async (next) => {
    setItems(next);
    setSaving(true);
    const res = await saveSection('events', { items: next });
    setSaving(false);
    if (!res.ok) setError(res.error || 'Could not save. Are you an Admin?');
  };

  const openAdd = () => { setError(''); setEditing({ ...blank, id: 'e-' + Date.now() }); };
  // Migrate a legacy single-photo event to the images[] shape when editing.
  const openEdit = (ev) => { setError(''); setEditing({ ...blank, ...ev, images: eventImages(ev) }); };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!editing.title || !editing.date) { setError('Title and date are required.'); return; }
    // Save clean: strip the legacy `image` field, keep images[].
    const { image, ...rest } = editing;
    const clean = { ...rest, images: (editing.images || []).filter(Boolean) };
    const exists = items.some((x) => x.id === clean.id);
    const next = exists ? items.map((x) => (x.id === clean.id ? clean : x)) : [...items, clean];
    await persist(next);
    setEditing(null);
  };

  const removeEvent = async (id) => { if (window.confirm('Delete this event?')) await persist(items.filter((x) => x.id !== id)); };
  const togglePublish = async (ev) => { await persist(items.map((x) => (x.id === ev.id ? { ...x, published: !x.published } : x))); };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if ((editing.images || []).length >= MAX_IMAGES) { setError(`Up to ${MAX_IMAGES} photos per event.`); return; }
    setUploading(true); setError('');
    const res = await uploadSiteImage(file, 'events');
    setUploading(false);
    if (!res.ok) { setError(res.error || 'Upload failed. Did you create the site-images bucket?'); return; }
    setEditing((f) => ({ ...f, images: [...(f.images || []), res.url] }));
  };
  const removeImage = (idx) => setEditing((f) => ({ ...f, images: (f.images || []).filter((_, i) => i !== idx) }));

  return (
    <div className="min-h-screen bg-[#F3F4F6] py-10 px-6 md:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-2 h-10 bg-[#800000]" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">School Events</h1>
            </div>
            <p className="text-gray-500 text-sm max-w-md">Add events with up to {MAX_IMAGES} photos. <b>Published</b> events appear on the homepage and the calendar.</p>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-slate-400">Saving…</span>}
            <button onClick={openAdd} disabled={locked} className="bg-[#800000] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#600000] flex items-center gap-2 cursor-pointer disabled:opacity-50"><HiPlus /> Add Event</button>
          </div>
        </div>

        {banner}
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading && <p className="text-slate-400 text-sm">Loading events…</p>}
        {!loading && items.length === 0 && <p className="text-slate-400 text-sm">No events yet. Click &ldquo;Add Event&rdquo; to create one.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((ev) => {
            const imgs = eventImages(ev);
            return (
              <div key={ev.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="relative h-40 bg-gradient-to-br from-[#800000] to-[#b34747] flex items-center justify-center">
                  <SafeImg src={imgs[0]} className="w-full h-full object-cover" fallback={<HiOutlinePhotograph className="text-white/60" size={40} />} />
                  {imgs.length > 1 && <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">{imgs.length} photos</span>}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#800000]">{ev.category || 'EVENT'}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${ev.published ? 'bg-green-50 text-[#48A675]' : 'bg-gray-100 text-gray-400'}`}>{ev.published ? 'PUBLISHED' : 'DRAFT'}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{ev.title}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><HiOutlineCalendar /> {formatEventDate(ev.date)}{ev.location ? ' · ' + ev.location : ''}</p>
                  <p className="text-sm text-slate-500 mt-2 flex-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.description}</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => openEdit(ev)} className="flex-1 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center gap-1 cursor-pointer"><HiOutlinePencilAlt /> Edit</button>
                    <button onClick={() => togglePublish(ev)} disabled={locked} className="flex-1 py-2 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer disabled:opacity-50">{ev.published ? 'Unpublish' : 'Publish'}</button>
                    <button onClick={() => removeEvent(ev.id)} disabled={locked} className="py-2 px-3 rounded-lg text-xs font-bold bg-red-50 text-[#C55A5A] hover:bg-red-100 cursor-pointer disabled:opacity-50"><HiOutlineTrash /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitForm} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-xl font-bold text-slate-800">{items.some((x) => x.id === editing.id) ? 'Edit Event' : 'Add Event'}</h2>

            {/* Photos (up to 6 — shown as a carousel) */}
            <div>
              <label className="lbl">Photos <span style={{ textTransform: 'none', fontWeight: 400 }}>(up to {MAX_IMAGES} — shown as a carousel)</span></label>
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {(editing.images || []).map((src, idx) => (
                  <div key={idx} className="relative w-24 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[11px] hover:bg-black/80 cursor-pointer" title="Remove"><HiX size={12} /></button>
                  </div>
                ))}
                {(editing.images || []).length < MAX_IMAGES && (
                  <label className="w-24 h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center shrink-0 cursor-pointer hover:border-[#800000] text-slate-400 hover:text-[#800000]">
                    {uploading ? <span className="text-[11px] font-bold">Uploading…</span> : <><HiOutlinePhotograph size={22} /><span className="text-[10px] font-bold mt-0.5">Add photo</span></>}
                    <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            <div><label className="lbl">Title *</label><input className="inp" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl">Date *</label><input type="date" className="inp" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></div>
              <div><label className="lbl">Category</label><input className="inp" placeholder="e.g. Campus Event" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
            </div>
            <div><label className="lbl">Location</label><input className="inp" placeholder="e.g. NSDGA Main Campus" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></div>
            <div>
              <div className="flex items-center justify-between">
                <label className="lbl">Description</label>
                <span className={`text-[11px] font-semibold ${(editing.description || '').length >= DESC_LIMIT ? 'text-red-500' : 'text-slate-400'}`}>{(editing.description || '').length}/{DESC_LIMIT}</span>
              </div>
              <textarea className="inp" style={{ minHeight: 100 }} maxLength={DESC_LIMIT} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Publish (show on the public website)</label>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-bold text-slate-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
              <button type="submit" disabled={locked || uploading} className="px-6 py-2.5 rounded-lg bg-[#800000] text-white text-sm font-bold hover:bg-[#600000] cursor-pointer disabled:opacity-50">Save Event</button>
            </div>
          </form>
        </div>
      )}

      <style>{`.lbl{display:block;font-size:11px;font-weight:700;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}.inp{width:100%;border:1px solid #E5E7EB;border-radius:.6rem;padding:.6rem .8rem;font-size:.875rem;outline:none;background:#fff}.inp:focus{border-color:#800000}`}</style>
    </div>
  );
};

export default EditSchoolEvent;
