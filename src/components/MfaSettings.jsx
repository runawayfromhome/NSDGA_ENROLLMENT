// src/components/MfaSettings.jsx
// Lets a staff member turn on Two-Factor Authentication with an authenticator
// app (Google Authenticator, Authy, etc.): Enable -> scan QR -> verify code.
// Once on, the 6-digit code is required at every login. A Disable button turns
// it off (handy for the demo).
import { useEffect, useState } from 'react';
import { HiOutlineShieldCheck, HiOutlineShieldExclamation } from 'react-icons/hi';
import { getMfaFactor, enrollMfa, activateMfa, disableMfa } from '../auth/authStore';

const MfaSettings = () => {
  const [loading, setLoading] = useState(true);
  const [factor, setFactor] = useState(null);   // active (verified) factor, or null
  const [enroll, setEnroll] = useState(null);    // { factorId, qrCode, secret } while enrolling
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => { setFactor(await getMfaFactor()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const startEnroll = async () => {
    setError(''); setBusy(true);
    const res = await enrollMfa();
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setEnroll(res);
  };

  const confirmEnroll = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    const res = await activateMfa(enroll.factorId, code);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setEnroll(null); setCode(''); await load();
  };

  const turnOff = async () => {
    setBusy(true);
    await disableMfa(factor.id);
    setBusy(false);
    await load();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        {factor
          ? <HiOutlineShieldCheck className="text-[#48A675]" size={26} />
          : <HiOutlineShieldExclamation className="text-slate-400" size={26} />}
        <h2 className="text-2xl font-extrabold text-[#800000]">Two-Factor Authentication (MFA)</h2>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Protect your account with an authenticator app. When ON, you'll enter a 6-digit code each time you log in.
      </p>

      {loading && <p className="text-sm text-slate-400">Checking status…</p>}

      {/* ON */}
      {!loading && factor && !enroll && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-green-50 border border-green-200 px-5 py-4">
          <span className="text-sm font-bold text-[#48A675]">● MFA is ON for your account</span>
          <button onClick={turnOff} disabled={busy}
            className="px-6 py-2.5 rounded-xl text-sm font-bold border border-red-200 text-[#C55A5A] bg-red-50 hover:bg-red-100 disabled:opacity-60 cursor-pointer">
            {busy ? 'Please wait…' : 'Disable MFA'}
          </button>
        </div>
      )}

      {/* OFF */}
      {!loading && !factor && !enroll && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
          <span className="text-sm font-bold text-slate-500">○ MFA is OFF</span>
          <button onClick={startEnroll} disabled={busy}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#800000] text-white hover:bg-[#600000] disabled:opacity-60 cursor-pointer">
            {busy ? 'Please wait…' : 'Enable MFA'}
          </button>
        </div>
      )}

      {/* ENROLLING: show QR + verify */}
      {enroll && (
        <form onSubmit={confirmEnroll} className="space-y-5">
          <ol className="text-sm text-slate-600 space-y-1 list-decimal ml-5">
            <li>Open your authenticator app and scan this QR code.</li>
            <li>Enter the 6-digit code it shows to confirm.</li>
          </ol>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-44 h-44 bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
              {enroll.qrCode?.startsWith('<')
                ? <div className="w-40 h-40" dangerouslySetInnerHTML={{ __html: enroll.qrCode }} />
                : <img src={enroll.qrCode} alt="Authenticator QR" className="w-40 h-40" />}
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Can't scan? Enter this key:</p>
              <code className="block text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 break-all text-slate-700">{enroll.secret}</code>
            </div>
          </div>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          <div>
            <label className="block font-semibold text-sm text-gray-700 mb-2">ENTER 6-DIGIT CODE</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric" autoFocus placeholder="123456"
              className="w-full max-w-[220px] h-12 border border-gray-200 rounded-xl text-center text-xl tracking-[0.5em] focus:border-[#800000] focus:outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={busy || code.length < 6}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#800000] text-white hover:bg-[#600000] disabled:opacity-60 cursor-pointer">
              {busy ? 'Verifying…' : 'Verify & Activate'}
            </button>
            <button type="button" onClick={() => { setEnroll(null); setCode(''); setError(''); }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold border border-gray-300 text-slate-600 hover:bg-gray-50 cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      )}

      {!loading && !enroll && error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      )}
    </div>
  );
};

export default MfaSettings;
