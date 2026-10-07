// Student "My Profile" — consistent portal frame (sidebar + header), real data
// from the student's application. Contact fields are editable + saved.
import { useEffect, useState } from 'react';
import StudentSidebar from '../../StudentSidebar';
import Header from '../../Header';
import { HiSave } from "react-icons/hi";
import { useSession } from '../../../contexts/useSession';
import { getMyApplication, updateMyForm } from '../../../lib/student';
import { formatEventDate } from '../../../lib/content';
import { CardSkeleton } from '../../Skeleton';

const onlyDigits = (v, max) => String(v).replace(/\D/g, '').slice(0, max);
const PHONE_RE = /^09\d{9}$/; // PH mobile: 09 + 9 digits

const Profile = () => {
  const { session } = useSession();
  const [app, setApp] = useState(undefined);
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    getMyApplication().then((a) => {
      setApp(a);
      setMobile(a?.form?.contact || '');
      setAddress(a?.form?.address || '');
    });
  }, []);

  const f = app?.form || {};
  const fullName = `${f.firstName || ''} ${f.middleName || ''} ${f.lastName || ''} ${f.suffix || ''}`.replace(/\s+/g, ' ').trim() || session?.name || 'Student';
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;

  const save = async () => {
    if (!app) return;
    setErr('');
    if (mobile && !PHONE_RE.test(mobile)) { setErr('Enter a valid mobile number (09XXXXXXXXX).'); return; }
    setSaving(true); setSaved(false);
    const res = await updateMyForm(app.id, { ...app.form, contact: mobile, address });
    setSaving(false);
    if (res.ok) { setSaved(true); setApp({ ...app, form: { ...app.form, contact: mobile, address } }); setTimeout(() => setSaved(false), 2500); }
    else setErr(res.error || 'Could not save changes.');
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <StudentSidebar activePage="My Profile" />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="flex-1 p-8 md:p-12">
          <div className="max-w-5xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

            {app === undefined && <div className="space-y-6"><CardSkeleton lines={1} /><CardSkeleton lines={3} /></div>}
            {app === null && <p className="text-slate-500">No application on file yet.</p>}

            {app && (
              <>
                {/* Hero card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-6">
                  <img src={avatarUrl} alt="Profile" className="w-16 h-16 rounded-full border border-gray-200 bg-slate-100" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{fullName}</h2>
                    <p className="text-slate-500 text-sm font-medium">{f.lrn ? `LRN: ${f.lrn}` : app.grade_level}{app.student_no ? ` · Student No. ${app.student_no}` : ''}</p>
                  </div>
                </div>

                {/* Personal info (read-only) */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                  <Divider>Personal Information</Divider>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                    <ReadField label="Birthdate" value={f.dob ? formatEventDate(f.dob) : ''} />
                    <ReadField label="Birthplace" value={f.birthplace} />
                    <ReadField label="Gender" value={f.sex} />
                    <ReadField label="Nationality" value={f.nationality} />
                    <ReadField label="Religion" value={f.religion} />
                    <ReadField label="Grade / Program" value={f.strand ? `${app.grade_level} · ${f.strand}` : app.grade_level} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 italic">To change personal details, ask the Registrar.</p>
                </div>

                {/* Contact info (editable) */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                  <Divider>Contact Information</Divider>
                  <div className="flex justify-end mb-2"><span className="text-[9px] text-slate-400 font-bold uppercase italic">Editable Fields</span></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                    <EditField label="Mobile Number" value={mobile} onChange={(v) => setMobile(onlyDigits(v, 11))} placeholder="09171234567" inputMode="numeric" />
                    <ReadField label="Email Address" value={session?.email} />
                  </div>
                  <div className="mt-5"><EditField label="Complete Address" value={address} onChange={setAddress} maxLength={200} /></div>
                  {err && <p className="text-xs font-bold text-red-600 mt-3 text-right">{err}</p>}
                  <div className="mt-8 flex justify-end items-center gap-3">
                    {saved && <span className="text-xs font-bold text-emerald-600">Saved ✓</span>}
                    <button onClick={save} disabled={saving} className="bg-[#800000] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#600000] transition-all shadow-md text-sm disabled:opacity-60">
                      <HiSave size={18} />{saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const Divider = ({ children }) => (
  <div className="relative mb-8">
    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
    <div className="relative flex justify-center"><span className="bg-white px-4 text-[10px] font-bold text-[#800000] uppercase tracking-[0.2em]">{children}</span></div>
  </div>
);
const ReadField = ({ label, value }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
    <div className="w-full p-3 bg-[#F1F5F9] border border-slate-200 rounded-lg text-slate-700 text-sm font-medium min-h-[44px]">{value || '—'}</div>
  </div>
);
const EditField = ({ label, value, onChange, placeholder, inputMode, maxLength }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} maxLength={maxLength} className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium focus:outline-none focus:border-[#800000]" />
  </div>
);

export default Profile;
