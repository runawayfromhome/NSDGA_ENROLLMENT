// src/components/ResetPasswordSection.jsx
// OTP-confirmed "Reset Password" for one target account (account recovery). The
// server (admin-set-password) enforces who may reset whom + emails the code to
// the acting staff member. Used by HeadAdmin (→ staff) and Admin (→ student).
// `account` = { id (target auth user id), name, role }.
import { useEffect, useRef, useState } from 'react';
import { requestSetPasswordOtp, setUserPassword } from '../auth/authStore';
import { passwordChecks, isPasswordValid } from '../lib/password';

export default function ResetPasswordSection({ account, locked, onDone }) {
  const [pw, setPw] = useState('');
  const [step, setStep] = useState('idle'); // idle | sent
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const refs = useRef([]);
  const valid = isPasswordValid(pw, account.role);

  useEffect(() => { if (cooldown > 0) { const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); } }, [cooldown]);

  const setDigit = (i, v) => {
    const c = v.replace(/\D/g, '').slice(-1);
    setDigits((p) => { const n = [...p]; n[i] = c; return n; });
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); };

  const send = async () => {
    if (!valid) return setMsg('⚠️ Set a valid new password first (see the requirements).');
    setBusy('otp'); setMsg('');
    const res = await requestSetPasswordOtp();
    setBusy('');
    if (!res.ok) return setMsg('⚠️ ' + res.error);
    setStep('sent'); setCooldown(30);
    setMsg(`✓ We emailed a 6-digit code to your email (${res.sentTo || 'your account'}). Enter it below to confirm.`);
  };
  const confirm = async () => {
    const code = digits.join('');
    if (code.length !== 6) return setMsg('⚠️ Enter the 6-digit code.');
    setBusy('confirm'); setMsg('');
    const res = await setUserPassword(account.id, pw, code, account.name);
    setBusy('');
    if (!res.ok) return setMsg('⚠️ ' + res.error);
    setStep('idle'); setDigits(['', '', '', '', '', '']); setPw('');
    setMsg('✓ Password reset. Share the new temporary password with the account holder securely.');
    onDone?.();
  };

  return (
    <div className="space-y-3">
      {msg && <div className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}
      <p className="text-[12px] text-slate-500">Use this when the user forgot their password. A 6-digit code is emailed to you to confirm, then you share the new temporary password with them securely.</p>
      <input type="text" value={pw} onChange={(e) => { setPw(e.target.value); setStep('idle'); setMsg(''); }} placeholder="New temporary password"
        className="w-full h-12 border border-gray-200 rounded-xl px-4 text-sm bg-white outline-none focus:border-[#800000]" disabled={step === 'sent' || locked} />
      <ul className="space-y-1">
        {Object.entries(passwordChecks(pw, account.role)).map(([label, ok]) => (
          <li key={label} className={`flex items-center gap-2 text-[12px] font-medium ${ok ? 'text-[#48A675]' : 'text-slate-400'}`}><span>{ok ? '✓' : '•'}</span> {label}</li>
        ))}
      </ul>
      {step === 'idle' ? (
        <button onClick={send} disabled={!valid || !!busy || locked} className="px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold disabled:opacity-50 cursor-pointer">{busy === 'otp' ? 'Sending…' : 'Reset password'}</button>
      ) : (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <p className="text-[12px] font-bold text-slate-600">Enter the code emailed to you to confirm resetting {account.name}'s password.</p>
          <div className="flex gap-2">
            {digits.map((d, i) => (
              <input key={i} ref={(el) => (refs.current[i] = el)} value={d} onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} inputMode="numeric" maxLength={1}
                className="w-11 h-14 text-center text-xl font-bold border border-gray-200 rounded-lg bg-white focus:border-[#800000] focus:outline-none" />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={confirm} disabled={busy === 'confirm'} className="px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold disabled:opacity-60 cursor-pointer">{busy === 'confirm' ? 'Confirming…' : 'Confirm reset'}</button>
            {cooldown > 0 ? <span className="text-[12px] text-slate-400">Resend in {cooldown}s</span> : <button onClick={send} disabled={!!busy} className="text-[12px] font-bold text-[#800000] hover:underline">Resend code</button>}
          </div>
        </div>
      )}
    </div>
  );
}
