// src/components/RemoveMfaSection.jsx
// OTP-confirmed "Remove MFA" (account recovery) for one target account. The
// server (admin-remove-mfa) enforces who may reset whom + emails the code.
import { useEffect, useRef, useState } from 'react';
import { requestRemoveMfaOtp, removeUserMfa } from '../auth/authStore';

export default function RemoveMfaSection({ account, locked, onDone }) {
  const [step, setStep] = useState('idle'); // idle | sent
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const refs = useRef([]);

  useEffect(() => { if (cooldown > 0) { const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); } }, [cooldown]);

  const setDigit = (i, v) => {
    const c = v.replace(/\D/g, '').slice(-1);
    setDigits((p) => { const n = [...p]; n[i] = c; return n; });
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); };

  const send = async () => {
    setBusy('otp'); setMsg('');
    const res = await requestRemoveMfaOtp();
    setBusy('');
    if (!res.ok) return setMsg('⚠️ ' + res.error);
    setStep('sent'); setCooldown(30);
    setMsg(`✓ We emailed a 6-digit code to your email (${res.sentTo || 'your account'}). Enter it below to confirm.`);
  };
  const confirm = async () => {
    const code = digits.join('');
    if (code.length !== 6) return setMsg('⚠️ Enter the 6-digit code.');
    if (!window.confirm(`Remove Multi-Factor Authentication for ${account.name}? They will be able to log in with just their password until they set it up again.`)) return;
    setBusy('confirm'); setMsg('');
    const res = await removeUserMfa(account.id, code, account.name);
    setBusy('');
    if (!res.ok) return setMsg('⚠️ ' + res.error);
    setStep('idle'); setDigits(['', '', '', '', '', '']);
    setMsg('✓ MFA removed. The user can log in with their password and set up a new authenticator.');
    onDone?.();
  };

  return (
    <div className="space-y-3">
      {msg && <div className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}
      <p className="text-[12px] text-slate-500">Use this only when the user lost their authenticator and is locked out. A 6-digit code is emailed to you to confirm.</p>
      {step === 'idle' ? (
        <button onClick={send} disabled={!!busy || locked} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-bold disabled:opacity-50 cursor-pointer">{busy === 'otp' ? 'Sending…' : 'Remove MFA'}</button>
      ) : (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <p className="text-[12px] font-bold text-slate-600">Enter the code emailed to you to confirm removing {account.name}'s MFA.</p>
          <div className="flex gap-2">
            {digits.map((d, i) => (
              <input key={i} ref={(el) => (refs.current[i] = el)} value={d} onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} inputMode="numeric" maxLength={1}
                className="w-11 h-14 text-center text-xl font-bold border border-gray-200 rounded-lg bg-white focus:border-[#800000] focus:outline-none" />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={confirm} disabled={busy === 'confirm'} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-sm font-bold disabled:opacity-60 cursor-pointer">{busy === 'confirm' ? 'Removing…' : 'Confirm remove'}</button>
            {cooldown > 0 ? <span className="text-[12px] text-slate-400">Resend in {cooldown}s</span> : <button onClick={send} disabled={!!busy} className="text-[12px] font-bold text-[#800000] hover:underline">Resend code</button>}
          </div>
        </div>
      )}
    </div>
  );
}
