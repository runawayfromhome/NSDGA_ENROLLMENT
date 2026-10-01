// Admin editor for the Executive Board. Loads/saves from Supabase (site_content.board),
// supports photo upload + reordering. Shows on the public About Us page.
import { useEffect, useState } from 'react';
import { getSection, saveSection, uploadSiteImage } from '../../../lib/content';
import { useMfaLock } from '../../MfaLock';
import { HiOutlineTrash, HiChevronUp, HiChevronDown, HiPlus, HiOutlinePhotograph } from 'react-icons/hi';

const rid = () => Math.random().toString(16).slice(2, 8);
const DEFAULT = [
  { id: rid(), name: 'Engr. Felipe C. Urrutia', title: 'School President', photo: '' },
  { id: rid(), name: 'Guia B. Urrutia', title: 'Executive Vice President', photo: '' },
  { id: rid(), name: 'Philip James B. Urrutia', title: 'V.P. for Building Administration', photo: '' },
  { id: rid(), name: 'Engr. Patrick Gene B. Urrutia', title: 'V.P. for External Affairs', photo: '' },
  { id: rid(), name: 'Phia Mae U. Grivas', title: 'V.P. for Finance', photo: '' },
  { id: rid(), name: 'Engr. Paul Gian B. Urrutia', title: 'V.P. for Academics', photo: '' },
];

const move = (arr, i, dir) => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

const EditExecutiveBoard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [error, setError] = useState('');
  const { locked, banner } = useMfaLock('/AdminPortal/Settings');

  useEffect(() => {
    (async () => {
      const c = await getSection('board');
      setItems(c.items?.length ? c.items : DEFAULT);
      setLoading(false);
    })();
  }, []);

  const patch = (id, p) => setItems(items.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const add = () => setItems([...items, { id: rid(), name: '', title: '', photo: '' }]);
  const remove = (id) => setItems(items.filter((m) => m.id !== id));
  const reorder = (i, dir) => setItems(move(items, i, dir));

  const onFile = async (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(id); setError('');
    const res = await uploadSiteImage(file, 'board');
    setUploadingId(null);
    if (!res.ok) { setError(res.error || 'Upload failed'); return; }
    patch(id, { photo: res.url });
  };

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    const res = await saveSection('board', { items });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else setError(res.error || 'Could not save. Are you an Admin?');
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] py-10 px-6 md:px-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-1">
              <div className="w-2 h-10 bg-[#800000]" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Executive Board</h1>
            </div>
            <p className="text-gray-500 text-sm ml-6">Names, positions &amp; photos shown on the public About Us page. Use ↑ / ↓ to order them.</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-bold text-emerald-600">Saved ✓</span>}
            <button onClick={add} className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 flex items-center gap-1 cursor-pointer"><HiPlus /> Add Member</button>
            <button onClick={save} disabled={saving || locked} className="px-7 py-2.5 bg-[#800000] text-white rounded-lg font-bold hover:bg-[#600000] disabled:opacity-60 cursor-pointer shadow-md">{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>

        {banner}
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading && <p className="text-slate-400 text-sm">Loading…</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((m, i) => (
            <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                    {m.photo ? <img src={m.photo} alt="" className="w-full h-full object-cover" /> : <HiOutlinePhotograph className="text-gray-300" size={30} />}
                  </div>
                  <label className="block text-center text-[11px] font-bold text-[#800000] mt-2 cursor-pointer hover:underline">
                    {uploadingId === m.id ? 'Uploading…' : (m.photo ? 'Change' : 'Add photo')}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(m.id, e)} disabled={uploadingId === m.id} />
                  </label>
                </div>
                <div className="flex-1 space-y-2">
                  <input value={m.name} onChange={(e) => patch(m.id, { name: e.target.value })} placeholder="Full name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-[#800000]" />
                  <input value={m.title} onChange={(e) => patch(m.id, { title: e.target.value })} placeholder="Position (e.g. School President)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-600 outline-none focus:border-[#800000]" />
                  <div className="flex items-center gap-1 pt-1">
                    <button onClick={() => reorder(i, -1)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"><HiChevronUp /></button>
                    <button onClick={() => reorder(i, 1)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"><HiChevronDown /></button>
                    <button onClick={() => remove(m.id)} className="p-1.5 text-[#C55A5A] hover:bg-red-50 rounded cursor-pointer ml-auto"><HiOutlineTrash /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditExecutiveBoard;
