// Forgot-password step 2: enter the 6-digit code emailed by send-reset-otp.
// Verifies the code (without consuming it), then carries email + code to the
// New Password screen. Requires router state from ForgotPass.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import NuestraLogoImage from '../../../assets/nuestradg.png';
import AcademyLogo from '../../../assets/nuestralogo.jpg';
import ProcedureCard from '../../icons/StudentPortalIcons/ProcedureCard';
import { verifyResetOtp, sendResetOtp } from '../../../lib/student';

const ForgotPassOtp = () => {
  const navigate = useNavigate();
  const email = useLocation().state?.email || '';
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef([]);

  useEffect(() => { if (!email) navigate('/StudentPortal/ForgotPass', { replace: true }); }, [email, navigate]);
  useEffect(() => { if (cooldown > 0) { const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); } }, [cooldown]);

  const setDigit = (i, v) => {
    const c = v.replace(/\D/g, '').slice(-1);
    setDigits((p) => { const n = [...p]; n[i] = c; return n; });
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); };
  const onPaste = (e) => {
    const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (t) { e.preventDefault(); setDigits(Array.from({ length: 6 }, (_, k) => t[k] || '')); refs.current[Math.min(t.length, 5)]?.focus(); }
  };

  const verify = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) return setError('Enter the 6-digit code.');
    setBusy(true); setError('');
    const res = await verifyResetOtp(email, code);
    setBusy(false);
    if (!res.ok) return setError(res.error || 'Incorrect or expired code.');
    navigate('/StudentPortal/CreateNewPass', { state: { email, code } });
  };

  const resend = async () => {
    setError(''); setBusy(true);
    const res = await sendResetOtp(email);
    setBusy(false);
    if (!res.ok) return setError(res.error || 'Could not resend the code.');
    setCooldown(30);
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden font-sans">
      <div className="relative hidden lg:flex lg:w-[45%] items-center justify-center p-12 text-center text-white"
        style={{ backgroundImage: `url(${NuestraLogoImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 z-0" style={{ backgroundColor: 'rgba(128, 0, 0, 0.85)' }} />
        <div className="relative z-10 flex flex-col items-center">
          <img src={AcademyLogo} alt="Academy Logo" className="w-44 h-44 mb-6 rounded-full object-cover border-4 border-white/20 drop-shadow-2xl" />
          <h1 className="text-4xl font-bold leading-tight mb-4 tracking-tight">Nuestra Señora de Guia <br /> Academy</h1>
          <p className="text-lg italic opacity-90 font-light">Guiding Young Minds Toward Excellence and Faith.</p>
        </div>
      </div>

      <div className="w-full lg:w-[55%] bg-[#F9FAFB] flex flex-col items-center justify-center px-6 md:px-20 relative py-10">
        <ProcedureCard className="w-full max-w-md p-10 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-[#800000] mb-6">OTP Verification</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed max-w-[300px]">
            We've emailed a 6-digit code{email ? <> to <b>{email}</b></> : ''}. Enter it below to reset your password.
          </p>

          {error && <div className="w-full mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

          <form onSubmit={verify} className="w-full flex flex-col items-center space-y-6">
            <div className="flex gap-2" onPaste={onPaste}>
              {digits.map((d, i) => (
                <input key={i} ref={(el) => (refs.current[i] = el)} value={d}
                  onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)}
                  inputMode="numeric" maxLength={1}
                  className="w-11 h-14 border border-gray-300 rounded-md text-center text-xl font-bold focus:border-[#800000] focus:ring-1 focus:ring-[#800000] outline-none transition-all" />
              ))}
            </div>

            <button type="submit" disabled={busy} className="w-full bg-[#800000] hover:bg-[#600000] text-white border-none h-12 rounded-md text-sm normal-case font-bold shadow-md cursor-pointer transition-colors disabled:opacity-60">
              {busy ? 'Verifying…' : 'Verify Code'}
            </button>
          </form>

          <p className="mt-8 text-gray-500 text-sm">
            Didn't receive the code?{' '}
            {cooldown > 0
              ? <span className="text-gray-400">Resend in {cooldown}s</span>
              : <button onClick={resend} disabled={busy} className="text-[#800000] font-bold hover:underline">Resend Code</button>}
          </p>
          <p className="mt-3 text-gray-500 text-sm">
            <NavLink to="/StudentPortal/Login" className="text-[#800000] font-bold hover:underline">Back to Login</NavLink>
          </p>
        </ProcedureCard>

        <div className="absolute bottom-6 text-center text-[10px] uppercase tracking-widest text-gray-400">
          © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default ForgotPassOtp;
