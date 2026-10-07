// src/components/pages/StaffProfile/MfaSetup.jsx
// Forced MFA enrollment for roles that require it (admin, headadmin). Auto-starts
// enrollment, shows the QR + secret, and only lets the user in once they verify a
// code. No skip — only "Verify" or "Logout".
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AcademyLogo from '../../../assets/nuestralogo.jpg';
import { useSession } from '../../../contexts/useSession';
import { enrollMfa, activateMfa, ROLE_HOME } from '../../../auth/authStore';

const MfaSetup = () => {
  const { session, logout, refresh } = useSession();
  const navigate = useNavigate();

  const [enroll, setEnroll] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // run once, even under React StrictMode
    started.current = true;
    (async () => {
      const res = await enrollMfa();
      if (res.ok) setEnroll(res);
      else setError(res.error);
    })();
  }, []);

  const confirm = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await activateMfa(enroll.factorId, code);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    await refresh();
    navigate(ROLE_HOME[session.role] || '/Home', { replace: true });
  };

  const leave = async () => {
    await logout();
    navigate(session.role === 'headadmin' ? '/HeadAdminPortal/Login' : '/AdminPortal/Login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 md:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={AcademyLogo} alt="Academy" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-tight text-[#800000] leading-none">NSDGA · Security Setup</p>
            <p className="text-[11px] text-slate-400 mt-1">{session.email}</p>
          </div>
        </div>
        <button onClick={leave} className="text-sm font-bold text-slate-500 hover:text-[#800000] cursor-pointer">Logout</button>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-black text-slate-800 mb-1">Set up Two-Factor Authentication</h1>
          <p className="text-sm text-slate-500 mb-6">
            Your role requires an authenticator for security. Scan the code below with an app like Google
            Authenticator or Authy, then enter the 6-digit code to finish.
          </p>

          {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

          {!enroll && !error && <p className="text-sm text-slate-400">Preparing your setup…</p>}

          {enroll && (
            <form onSubmit={confirm} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-44 h-44 bg-white border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                  <img src={enroll.qrCode?.startsWith('<') ? `data:image/svg+xml;utf8,${encodeURIComponent(enroll.qrCode)}` : enroll.qrCode} alt="Authenticator QR" className="w-40 h-40" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Can't scan? Enter this key:</p>
                  <code className="block text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 break-all text-slate-700">{enroll.secret}</code>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-sm text-gray-700 mb-2">ENTER 6-DIGIT CODE</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric" autoFocus placeholder="123456"
                  className="w-full max-w-[220px] h-12 border border-gray-200 rounded-xl text-center text-xl tracking-[0.5em] focus:border-[#800000] focus:outline-none"
                />
              </div>

              <button type="submit" disabled={busy || code.length < 6}
                className="px-8 py-3 rounded-xl text-sm font-bold bg-[#800000] text-white hover:bg-[#600000] disabled:opacity-60 cursor-pointer">
                {busy ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default MfaSetup;
