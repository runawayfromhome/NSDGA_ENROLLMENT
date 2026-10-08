// Email OTP verification — the final signup step. The signed-in applicant enters
// the 6-digit code emailed to them; on success their draft becomes 'submitted'
// and they land on the Applicant Dashboard.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import AcademyLogo from '../../../assets/nuestralogo.jpg';
import NuestraLogoImage from '../../../assets/nuestradg.png';
import { requestSignupOtp, verifySignupOtp, getMyApplication, isEnrolledStatus } from '../../../lib/student';
import { useSession } from '../../../contexts/useSession';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const { refresh } = useSession();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef([]);

  // Guard: must be a signed-in applicant with a draft; otherwise bounce.
  useEffect(() => {
    (async () => {
      const app = await getMyApplication();
      if (!app) { navigate('/StudentPortal/Login', { replace: true }); return; }
      if (app.status !== 'draft') { navigate(isEnrolledStatus(app.status) ? '/StudentPortal/Dashboard' : '/StudentPortal/ApplicationStatus', { replace: true }); return; }
    })();
  }, [navigate]);

  useEffect(() => { if (cooldown > 0) { const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); } }, [cooldown]);

  const setDigit = (i, v) => {
    const c = v.replace(/\D/g, '').slice(-1);
    setDigits((p) => { const n = [...p]; n[i] = c; return n; });
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const onPaste = (e) => {
    const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (t) { e.preventDefault(); setDigits(Array.from({ length: 6 }, (_, k) => t[k] || '')); refs.current[Math.min(t.length, 5)]?.focus(); }
  };

  const verify = async () => {
    const code = digits.join('');
    if (code.length !== 6) return setError('Enter the 6-digit code.');
    setBusy(true); setError('');
    const res = await verifySignupOtp(code);
    setBusy(false);
    if (!res.ok) { setError(res.error || 'Verification failed.'); return; }
    await refresh(); // pick up the now-submitted status
    navigate('/StudentPortal/ApplicationStatus', { replace: true });
  };

  const resend = async () => {
    setError(''); setBusy(true);
    const res = await requestSignupOtp();
    setBusy(false);
    if (!res.ok) return setError(res.error || 'Could not resend the code.');
    setSentTo(res.sentTo || ''); setCooldown(30);
  };

  return (
    <div className="flex min-h-screen w-full font-sans">
      <div className="relative hidden lg:flex lg:w-[38%] flex-col items-center justify-center p-12 text-center text-white"
        style={{ backgroundImage: `url(${NuestraLogoImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(128,0,0,0.88)' }} />
        <div className="relative z-10 flex flex-col items-center">
          <img src={AcademyLogo} alt="Logo" className="w-28 h-28 mb-6 rounded-full object-cover border-4 border-white/20" />
          <h1 className="text-3xl font-bold leading-tight mb-1">Nuestra Señora de Guia<br />Academy</h1>
          <p className="italic opacity-90">Online Admission</p>
        </div>
      </div>

      <div className="w-full lg:w-[62%] bg-[#F9FAFB] flex flex-col justify-center px-6 md:px-16 py-10">
        <div className="w-full max-w-md mx-auto">
          <NavLink to="/StudentPortal/Apply" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-[#800000] mb-6">← Back to Application</NavLink>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Verify Your Account</h2>
          <p className="text-gray-500 text-sm mt-1 mb-6">
            We've emailed a 6-digit verification code{sentTo ? <> to <b>{sentTo}</b></> : ' to your registered email'}. Enter it below to complete your registration.
          </p>

          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

          <div className="flex gap-2 sm:gap-3 justify-between mb-6" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input key={i} ref={(el) => (refs.current[i] = el)} value={d}
                onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)}
                inputMode="numeric" maxLength={1}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border border-gray-200 rounded-xl bg-white focus:border-[#800000] focus:outline-none" />
            ))}
          </div>

          <button onClick={verify} disabled={busy} className="w-full py-3 bg-[#800000] hover:bg-[#600000] text-white rounded-lg font-bold shadow disabled:opacity-60">
            {busy ? 'Verifying…' : 'Verify & Complete Registration →'}
          </button>

          <p className="text-center mt-6 text-sm text-gray-500">
            Didn't receive the code?{' '}
            {cooldown > 0
              ? <span className="text-gray-400">Resend in {cooldown}s</span>
              : <button onClick={resend} disabled={busy} className="text-[#800000] font-bold">Resend Code</button>}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
