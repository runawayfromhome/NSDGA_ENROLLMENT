// Student Settings — consistent portal frame + real change-password
// (verifies the current password, then updates it via Supabase Auth).
import React, { useState } from 'react';
import StudentSidebar from '../../StudentSidebar';
import Header from '../../Header';
import { HiOutlineEye, HiOutlineEyeOff, HiSave } from "react-icons/hi";
import { verifyCurrentPassword, changePassword } from '../../../auth/authStore';

const Setting = () => {
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (nw.length < 8) return setMsg({ ok: false, text: 'New password must be at least 8 characters.' });
    if (nw !== confirm) return setMsg({ ok: false, text: 'New passwords do not match.' });
    setBusy(true);
    const v = await verifyCurrentPassword(cur);
    if (!v.ok) { setBusy(false); return setMsg({ ok: false, text: v.error || 'Current password is incorrect.' }); }
    const r = await changePassword(nw);
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error || 'Could not update password.' });
    setMsg({ ok: true, text: 'Password updated successfully.' });
    setCur(''); setNw(''); setConfirm('');
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <StudentSidebar activePage="Settings" />
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={false} />
        <main className="flex-1 p-8 md:p-12 flex flex-col items-center">
          <div className="w-full max-w-xl">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Settings</h1>
            <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10">
              <h2 className="text-2xl font-extrabold text-[#800000] mb-8 text-center">Change Password</h2>

              {msg && <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-semibold ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}

              <div className="space-y-6">
                <Field label="CURRENT PASSWORD" type={showCur ? 'text' : 'password'} value={cur} onChange={setCur} placeholder="Enter current password"
                  toggle={<Toggle on={showCur} set={setShowCur} />} />
                <div>
                  <Field label="NEW PASSWORD" type={showNew ? 'text' : 'password'} value={nw} onChange={setNw} placeholder="Enter new password"
                    toggle={<Toggle on={showNew} set={setShowNew} />} />
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-500 font-medium px-1">
                    <li>• At least 8 characters</li>
                    <li>• Mix of upper &amp; lowercase recommended</li>
                    <li>• Add a number and a special character</li>
                  </ul>
                </div>
                <Field label="CONFIRM NEW PASSWORD" type="password" value={confirm} onChange={setConfirm} placeholder="Repeat new password" />

                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={busy} className="bg-[#800000] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#600000] transition-all shadow-md text-sm cursor-pointer disabled:opacity-60">
                    <HiSave size={18} />{busy ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

const Field = ({ label, type, value, onChange, placeholder, toggle }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
    <div className="relative">
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full p-3 pr-12 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:border-[#800000]" />
      {toggle && <div className="absolute right-3 top-1/2 -translate-y-1/2">{toggle}</div>}
    </div>
  </div>
);
const Toggle = ({ on, set }) => (
  <button type="button" onClick={() => set(!on)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
    {on ? <HiOutlineEye size={20} /> : <HiOutlineEyeOff size={20} />}
  </button>
);

export default Setting;
