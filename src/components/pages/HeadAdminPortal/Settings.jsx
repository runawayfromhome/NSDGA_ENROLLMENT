// HeadAdmin account settings — Change Password + MFA + Account Limits.
import { useEffect, useRef, useState } from 'react';
import HeadAdminSidebar from '../../HeadAdminSidebar';
import ChangePassword from '../../ChangePassword';
import MfaSettings from '../../MfaSettings';
import { getAccountLimits, requestAccountLimitsOtp, saveAccountLimitsWithOtp, getAccountUsage } from '../../../auth/authStore';

const ROLES = [
  { key: 'headadmin', label: 'Head Administrator', hint: 'Full control — keep this small.' },
  { key: 'admin', label: 'Admin', hint: 'Website content, approvals, finance export.' },
  { key: 'registrar', label: 'Registrar', hint: 'Processes applications and enrollment.' },
];

const AccountLimitsCard = () => {
  const [limits, setLimits] = useState(null);
  const [usage, setUsage] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [step, setStep] = useState('idle'); // idle | sent (awaiting OTP)
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [info, setInfo] = useState('');
  const refs = useRef([]);

  useEffect(() => { getAccountLimits().then(setLimits); getAccountUsage().then(setUsage); }, []);
  useEffect(() => { if (cooldown > 0) { const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); } }, [cooldown]);

  const set = (role, v) => { setLimits((p) => ({ ...p, [role]: v.replace(/\D/g, '').slice(0, 2) })); setStep('idle'); setErr(''); setSaved(false); };
  const setDigit = (i, v) => {
    const c = v.replace(/\D/g, '').slice(-1);
    setDigits((p) => { const n = [...p]; n[i] = c; return n; });
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); };

  // Step 1 — email a confirmation code.
  const requestCode = async () => {
    setBusy('otp'); setErr(''); setSaved(false); setInfo('');
    const res = await requestAccountLimitsOtp();
    setBusy('');
    if (!res.ok) return setErr(res.error);
    setStep('sent'); setCooldown(30); setDigits(['', '', '', '', '', '']);
    setInfo(`We emailed a 6-digit code to ${res.sentTo || 'your email'}. Enter it below to apply the new limits.`);
  };
  // Step 2 — verify + save.
  const confirm = async () => {
    const code = digits.join('');
    if (code.length !== 6) return setErr('Enter the 6-digit code.');
    setBusy('confirm'); setErr('');
    const res = await saveAccountLimitsWithOtp(limits, code);
    setBusy('');
    if (!res.ok) return setErr(res.error);
    setLimits(res.limits); setStep('idle'); setDigits(['', '', '', '', '', '']); setInfo('');
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    getAccountUsage().then(setUsage);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl">
      <h2 className="text-2xl font-extrabold text-[#800000] mb-1">Account Limits</h2>
      <p className="text-sm text-slate-500 mb-6">
        The maximum number of <b>active</b> (verified &amp; enabled) accounts allowed per staff role.
        Disabled accounts don't count. Students are never limited. Saving requires an emailed code.
      </p>

      {err && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">⚠️ {err}</div>}
      {saved && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-[#48A675]">Limits updated ✓</div>}

      {!limits ? <p className="text-slate-400 text-sm">Loading…</p> : (
        <div className="space-y-5">
          {ROLES.map((r) => {
            const u = usage?.[r.key];
            const over = u && u.active > Number(limits[r.key]);
            return (
              <div key={r.key} className="flex items-center justify-between gap-4 border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-700">{r.label}</p>
                  <p className="text-[12px] text-slate-400">{r.hint}</p>
                  {u && (
                    <p className={`text-[12px] font-bold mt-1 ${over ? 'text-red-600' : 'text-slate-500'}`}>
                      Currently active: {u.active}{over ? ' — over the new limit' : ''}
                    </p>
                  )}
                </div>
                <input value={limits[r.key] ?? ''} onChange={(e) => set(r.key, e.target.value)} inputMode="numeric" disabled={step === 'sent'}
                  className="w-20 h-12 text-center text-lg font-bold border border-gray-200 rounded-xl bg-white focus:border-[#800000] focus:outline-none shrink-0 disabled:bg-gray-50" />
              </div>
            );
          })}

          {step === 'idle' ? (
            <div className="pt-1">
              <button onClick={requestCode} disabled={!!busy}
                className="bg-[#800000] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#600000] transition-all disabled:opacity-60 text-sm cursor-pointer">
                {busy === 'otp' ? 'Sending code…' : 'Save Limits'}
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              {info && <p className="text-[12px] font-semibold text-slate-600">{info}</p>}
              <div className="flex gap-2">
                {digits.map((d, i) => (
                  <input key={i} ref={(el) => (refs.current[i] = el)} value={d} onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} inputMode="numeric" maxLength={1}
                    className="w-11 h-14 text-center text-xl font-bold border border-gray-200 rounded-lg bg-white focus:border-[#800000] focus:outline-none" />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={confirm} disabled={busy === 'confirm'}
                  className="px-6 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold disabled:opacity-60 cursor-pointer">{busy === 'confirm' ? 'Applying…' : 'Confirm & apply'}</button>
                {cooldown > 0 ? <span className="text-[12px] text-slate-400">Resend in {cooldown}s</span> : <button onClick={requestCode} disabled={!!busy} className="text-[12px] font-bold text-[#800000] hover:underline">Resend code</button>}
                <button onClick={() => { setStep('idle'); setErr(''); setInfo(''); }} className="text-[12px] font-bold text-slate-400 hover:underline ml-auto">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const HeadAdminSettings = () => (
  <div className="flex min-h-screen bg-[#F8F9FA]">
    <HeadAdminSidebar />
    <div className="flex-1 lg:ml-64 flex flex-col">
      <main className="px-6 pt-20 pb-8 md:p-12 max-w-[1200px] w-full space-y-10">
        <h1 className="text-3xl font-bold text-slate-800">Account Settings &amp; Security</h1>
        <ChangePassword />
        <MfaSettings />
        <AccountLimitsCard />
      </main>
    </div>
  </div>
);

export default HeadAdminSettings;
