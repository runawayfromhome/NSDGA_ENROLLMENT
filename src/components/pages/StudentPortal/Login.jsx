import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import NuestraLogoImage from '../../../assets/nuestradg.png'
import AcademyLogo from '../../../assets/nuestralogo.jpg'
import Input from '../../form/Input'
import PersonIcon from '../../icons/StudentPortalIcons/PersonIcon'
import Padlock from '../../icons/StudentPortalIcons/Padlock'
import Eye from '../../icons/StudentPortalIcons/Eye'
import { signInStudent } from '../../../lib/student'
import { useSession } from '../../../contexts/useSession'

const Login = () => {
  const navigate = useNavigate();
  const { refresh, completeMfa } = useSession();
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mfa, setMfa] = useState(null); // { factorId } while awaiting the 2FA code
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const goHome = (s) => navigate(s?.isEnrolled ? '/StudentPortal/Dashboard' : '/StudentPortal/ApplicationStatus');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    const fd = new FormData(e.target);
    const res = await signInStudent(fd.get('email'), fd.get('password'));
    if (!res.ok) { setBusy(false); return setError(res.error); }
    const s = await refresh(); // load session (incl. enrollment + MFA status)
    setBusy(false);
    // If the student turned on 2FA, ask for the authenticator code first.
    if (s?.needsMfa) { setMfa({ factorId: s.mfaFactorId }); return; }
    goHome(s);
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setError(''); setVerifying(true);
    const res = await completeMfa(mfa.factorId, code);
    setVerifying(false);
    if (!res.ok) { setError(res.error); return; }
    const s = await refresh();
    goHome(s);
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden font-sans">
      {/* Left Side: Background and Branding */}
      <div 
        className="relative hidden lg:flex lg:w-[45%] items-center justify-center p-12 text-center text-white"
        style={{
          backgroundImage: `url(${NuestraLogoImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 z-0" style={{ backgroundColor: 'rgba(128, 0, 0, 0.85)' }} />
        <div className="relative z-10 flex flex-col items-center">
          <img 
            src={AcademyLogo} 
            alt="Academy Logo" 
            className="w-44 h-44 mb-6 rounded-full object-cover border-4 border-white/20 drop-shadow-2xl" 
          />
          <h1 className="text-4xl font-bold leading-tight mb-4 tracking-tight">
            Nuestra Señora de Guia <br /> Academy
          </h1>
          <p className="text-lg italic opacity-90 font-light">Guiding Young Minds Toward Excellence and Faith.</p>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-[55%] bg-[#F9FAFB] flex flex-col items-center justify-center px-6 md:px-20 relative">
        <NavLink to="/Home" className="absolute top-6 left-6 flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-[#800000] transition-colors">
          ← Back to Home
        </NavLink>
        <div className="w-full max-w-md">
          {mfa ? (
            <form onSubmit={handleMfaVerify} className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Two-Factor Verification</h2>
              <p className="text-gray-500 mb-8">Enter the 6-digit code from your authenticator app.</p>
              {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 mb-4">{error}</div>}
              <div>
                <label className="block font-semibold text-sm text-gray-700 mb-2">AUTHENTICATION CODE</label>
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoFocus placeholder="123456"
                  className="w-full h-12 bg-white border border-gray-200 focus:border-[#800000] focus:outline-none rounded-xl text-center text-xl tracking-[0.5em]" />
              </div>
              <button type="submit" disabled={verifying || code.length < 6}
                className="btn w-full bg-[#800000] hover:bg-[#600000] text-white border-none h-12 rounded-lg text-lg normal-case font-bold shadow-md cursor-pointer flex items-center justify-center disabled:opacity-60">
                {verifying ? 'Verifying…' : 'Verify & Continue'}
              </button>
              <button type="button" onClick={() => { setMfa(null); setCode(''); setError(''); }} className="w-full text-center text-gray-400 text-xs hover:text-gray-600 cursor-pointer">← Back to login</button>
            </form>
          ) : (
          <>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Student Portal Login</h2>
          <p className="text-gray-500 mb-10">Welcome back! Please enter your details.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              name="email"
              label="Email"
              type="email"
              placeholder="e.g. 136676090147"
              icon={<PersonIcon className="scale-50" />} 
            />
            <Input
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              icon={<Padlock className="scale-50" />}
              rightElement={
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="transition-opacity hover:opacity-70 scale-75 outline-none"
                >
                  <Eye visible={showPassword} />
                </button>
              }
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: rememberMe ? '#800000' : 'white',
                    borderColor: rememberMe ? '#800000' : '#D1D5DB',
                  }}
                >
                  {rememberMe && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="select-none">Remember me</span>
              </label>

              <NavLink to="/StudentPortal/ForgotPass" className="text-[#800000] font-bold hover:text-[#a00000] transition-colors">
                Forgot password?
              </NavLink>
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

            <button
              type="submit"
              disabled={busy}
              className="btn w-full bg-[#800000] hover:bg-[#600000] text-white border-none h-12 rounded-lg text-lg normal-case font-bold shadow-md cursor-pointer flex items-center justify-center disabled:opacity-60"
            >
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Updated Sign Up Link */}
          <p className="text-center mt-6 text-gray-600 text-sm">
            Don't have an account yet?{" "}
            <NavLink to="/StudentPortal/Apply" className="text-[#800000] font-bold hover:text-[#a00000] transition-colors">
              Apply now
            </NavLink>
          </p>
          </>
          )}
        </div>

        <div className="absolute bottom-8 text-center text-[10px] uppercase tracking-widest text-gray-400">
          © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default Login
