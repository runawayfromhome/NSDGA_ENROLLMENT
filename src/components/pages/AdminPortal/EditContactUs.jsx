// Admin editor for Contact Information. Loads/saves from Supabase
// (site_content.contact); shown in the public footer + "Contact Us" popup.
import { useEffect, useState } from 'react';
import { getContact, saveSection } from '../../../lib/content';
import { CardSkeleton } from '../../Skeleton';
import { useMfaLock } from '../../MfaLock';

const EditContactUs = () => {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { locked, banner } = useMfaLock('/AdminPortal/Settings');

  useEffect(() => { getContact().then(setForm); }, []);

  const setDept = (dept, field, value) => setForm({ ...form, [dept]: { ...form[dept], [field]: value } });
  const set = (field, value) => setForm({ ...form, [field]: value });

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    const res = await saveSection('contact', form);
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else setError(res.error || 'Could not save. Are you an Admin?');
  };

  if (!form) return <div className="min-h-screen bg-[#E5E7EB] py-10 px-4 md:px-16"><div className="max-w-5xl mx-auto space-y-6"><CardSkeleton lines={3} /><CardSkeleton lines={3} /></div></div>;

  return (
    <div className="min-h-screen bg-[#E5E7EB] py-10 px-4 md:px-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-1">
              <div className="w-2 h-10 bg-[#800000]" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Contact Information</h1>
            </div>
            <p className="text-gray-500 text-sm ml-6">These details show in the website footer and the &ldquo;Contact Us&rdquo; popup.</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-bold text-emerald-600">Saved ✓</span>}
            <button onClick={save} disabled={saving || locked} className="px-7 py-2.5 bg-[#800000] text-white rounded-lg font-bold hover:bg-[#600000] disabled:opacity-60 cursor-pointer shadow-md">{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </div>

        {banner}
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="space-y-6">
          <Card title="Registrar's Office">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Email"><input className="ip" value={form.registrar.email} onChange={(e) => setDept('registrar', 'email', e.target.value)} /></Field>
              <Field label="Mobile"><input className="ip" value={form.registrar.mobile} onChange={(e) => setDept('registrar', 'mobile', e.target.value)} /></Field>
              <Field label="Landline"><input className="ip" value={form.registrar.landline} onChange={(e) => setDept('registrar', 'landline', e.target.value)} /></Field>
            </div>
          </Card>

          <Card title="Finance & Accounting">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Email"><input className="ip" value={form.finance.email} onChange={(e) => setDept('finance', 'email', e.target.value)} /></Field>
              <Field label="Mobile"><input className="ip" value={form.finance.mobile} onChange={(e) => setDept('finance', 'mobile', e.target.value)} /></Field>
              <Field label="Landline"><input className="ip" value={form.finance.landline} onChange={(e) => setDept('finance', 'landline', e.target.value)} /></Field>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Technical Support">
              <Field label="Email"><input className="ip" value={form.techSupport.email} onChange={(e) => setDept('techSupport', 'email', e.target.value)} /></Field>
            </Card>
            <Card title="Office Hours">
              <textarea className="ip" style={{ minHeight: 92 }} value={form.officeHours} onChange={(e) => set('officeHours', e.target.value)} />
            </Card>
          </div>

          <Card title="Public / Social">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="General Email (footer &quot;Email Us&quot;)"><input className="ip" value={form.generalEmail} onChange={(e) => set('generalEmail', e.target.value)} /></Field>
              <Field label="Facebook URL"><input className="ip" value={form.facebookUrl} onChange={(e) => set('facebookUrl', e.target.value)} /></Field>
            </div>
          </Card>
        </div>
      </div>

      <style>{`.ip{width:100%;border:1px solid #E5E7EB;border-radius:.6rem;padding:.6rem .8rem;font-size:.875rem;outline:none;background:#fff}.ip:focus{border-color:#800000}`}</style>
    </div>
  );
};

const Card = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1.5 h-6 bg-[#800000]" />
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">{label}</span>
    {children}
  </label>
);

export default EditContactUs;
