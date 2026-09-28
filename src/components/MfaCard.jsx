// A self-contained Two-Factor Authentication (TOTP) card. A user can turn on an
// authenticator app or turn it off. Reuses the shared MFA helpers, so it works
// for any signed-in role (students included).
import { useEffect, useState } from 'react';
import { getMfaFactor, enrollMfa, activateMfa, disableMfa } from '../auth/authStore';

export default function MfaCard() {
  const [factor, setFactor] = useState(undefined); // undefined = loading, null = off, object = on
  const [enroll, setEnroll] = useState(null);      // { factorId, qrCode, secret }
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);            // { ok, text }

  const refresh = async () => setFactor(await getMfaFactor());
  useEffect(() => { refresh(); }, []);

  const start = async () => {
    setBusy(true); setMsg(null);
    const res = await enrollMfa();
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error || 'Could not start setup.' });
    setEnroll(res); setCode('');
  };
  const activate = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const res = await activateMfa(enroll.factorId, code);
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error });
    setEnroll(null); setCode('');
    setMsg({ ok: true, text: 'Two-factor authentication is now ON. You will be asked for a code at every login.' });
    await refresh();
  };
  const cancel = () => { setEnroll(null); setCode(''); setMsg(null); };
  const turnOff = async () => {
    if (!factor) return;
    if (!window.confirm('Turn off two-factor authentication? Your account will be less protected.')) return;
    setBusy(true); setMsg(null);
    const res = await disableMfa(factor.id);
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: res.error || 'Could not turn it off.' });
    setMsg({ ok: true, text: 'Two-factor authentication is now OFF.' });
    await refresh();
  };

  const enabled = !!factor;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-10 mt-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-extrabold text-[#800000]">Two-Factor Authentication</h2>
        <span className={`px-3 py-1 rounded-full text-[11px] font-black ${enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
          {factor === undefined ? '…' : enabled ? 'ON' : 'OFF'}
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Add an extra layer of security. When ON, you'll enter a 6-digit code from an authenticator app
        (Google Authenticator, Authy, etc.) every time you log in.
      </p>

      {msg && <div className={`mb-5 rounded-lg px-4 py-3 text-sm font-semibold ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</div>}

      {enroll ? (
        <form onSubmit={activate} className="space-y-5">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-44 h-44 bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
              {enroll.qrCode?.startsWith('<')
                ? <div className="w-40 h-40" dangerouslySetInnerHTML={{ __html: enroll.qrCode }} />
                : <img src={enroll.qrCode} alt="Authenticator QR" className="w-40 h-40" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Scan with your authenticator app, or enter this key manually:</p>
              <code className="block text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 break-all text-slate-700">{enroll.secret}</code>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-sm text-gray-700 mb-2">Enter the 6-digit code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoFocus placeholder="123456"
              className="w-full max-w-[220px] h-12 border border-gray-200 rounded-xl text-center text-xl tracking-[0.5em] focus:border-[#800000] focus:outline-none" />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={busy || code.length < 6} className="px-6 py-3 rounded-xl text-sm font-bold bg-[#800000] text-white hover:bg-[#600000] disabled:opacity-60 cursor-pointer">{busy ? 'Verifying…' : 'Verify & Turn On'}</button>
            <button type="button" onClick={cancel} className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={enabled ? turnOff : start} disabled={busy || factor === undefined}
          className={`px-6 py-3 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-60 ${enabled ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-[#800000] text-white hover:bg-[#600000]'}`}>
          {busy ? 'Please wait…' : enabled ? 'Turn Off' : 'Turn On 2FA'}
        </button>
      )}
    </div>
  );
}
