// src/auth/LoginForm.jsx
// One reusable staff login that copies the STUDENT login's look & feel, but is
// wired to real (mock) authentication. Registrar, Admin and HeadAdmin all reuse
// this so the three pages stay identical in style and behaviour.
//
// Key differences from the student login (by design):
//   - a portal label + role badge so staff know which door they're in
//   - NO "Sign up" link (staff accounts are created by HeadAdmin only)
//   - a real error message on failed login
//   - "Forgot password? Contact administrator" instead of self-service reset
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NuestraLogoImage from '../assets/nuestradg.png';
import AcademyLogo from '../assets/nuestralogo.jpg';
import Input from '../components/form/Input';
import PersonIcon from '../components/icons/StudentPortalIcons/PersonIcon';
import Padlock from '../components/icons/StudentPortalIcons/Padlock';
import Eye from '../components/icons/StudentPortalIcons/Eye';
import { useSession } from '../contexts/useSession';
import { ROLE_HOME } from './authStore';

export default function LoginForm({ portalName = 'Staff Portal', subtitle, role = null }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mfa, setMfa] = useState(null); // { factorId } while awaiting the 6-digit code
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { login, completeMfa, logout, session } = useSession();
  const navigate = useNavigate();

  // If we arrive here already signed-in-but-owing-MFA (e.g. a refresh mid-login),
  // jump straight to the code step.
  useEffect(() => {
    if (session?.needsMfa && session.mfaFactorId && !mfa) setMfa({ factorId: session.mfaFactorId });
  }, [session, mfa]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Input is an uncontrolled component, so we read values straight from the form.
    const email = e.target.elements.email.value;
    const password = e.target.elements.password.value;

    setSubmitting(true);
    const result = await login(email, password, role);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.mfaRequired) {
      setMfa({ factorId: result.factorId }); // show the authenticator code step
      return;
    }
    navigate(ROLE_HOME[result.profile.role] || '/Home');
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setError('');
    setVerifying(true);
    const res = await completeMfa(mfa.factorId, code);
    setVerifying(false);
    if (!res.ok) { setError(res.error); return; }
    navigate(ROLE_HOME[res.profile.role] || '/Home');
  };

  const backToLogin = async () => {
    await logout();
    setMfa(null); setCode(''); setError('');
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden font-sans">
      {/* Left: branding (same treatment as the student login) */}
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
          <p className="text-lg italic opacity-90 font-light">Staff &amp; Administration Access</p>
        </div>
      </div>

      {/* Right: the form */}
      <div className="w-full lg:w-[55%] bg-[#F9FAFB] flex flex-col items-center justify-center px-6 md:px-20 relative">
        <div className="w-full max-w-md">
          <span className="inline-block text-[#800000] font-bold text-xs uppercase tracking-[0.3em] mb-2">
            {portalName}
          </span>

          {mfa ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Two-Factor Verification</h2>
              <p className="text-gray-500 mb-8">Enter the 6-digit code from your authenticator app.</p>
              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
              )}
              <form onSubmit={handleMfaVerify} className="space-y-6">
                <div>
                  <label className="block font-semibold text-sm text-gray-700 mb-2">AUTHENTICATION CODE</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoFocus
                    placeholder="123456"
                    className="input input-bordered w-full h-12 bg-white border-gray-200 focus:border-[#800000] focus:outline-none rounded-xl text-center text-xl tracking-[0.5em]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying || code.length < 6}
                  className="w-full bg-[#800000] hover:bg-[#600000] disabled:opacity-60 text-white h-12 rounded-lg text-md font-bold shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {verifying ? 'Verifying…' : <>Verify &amp; Continue <span>→</span></>}
                </button>
              </form>
              <button onClick={backToLogin} className="w-full text-center mt-6 text-gray-400 text-xs hover:text-gray-600 cursor-pointer">
                Use a different account
              </button>
            </>
          ) : (
          <>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Access</h2>
          <p className="text-gray-500 mb-8">{subtitle || 'Please authenticate to continue.'}</p>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              name="email"
              label="EMAIL"
              type="email"
              placeholder="you@nsdgamarikina.edu.ph"
              icon={<PersonIcon className="scale-50 opacity-50" />}
            />
            <Input
              name="password"
              label="PASSWORD"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              icon={<Padlock className="scale-50 opacity-50" />}
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
                <input type="checkbox" name="remember" className="w-4 h-4 rounded border-gray-300 accent-[#800000]" />
                <span className="select-none font-medium">Remember me</span>
              </label>
              <span className="text-gray-400 italic">Forgot password? Contact administrator</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#800000] hover:bg-[#600000] disabled:opacity-60 text-white h-12 rounded-lg text-md font-bold shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {submitting ? 'Signing in…' : <>Sign In <span>→</span></>}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-400 text-xs">
            Staff accounts are provisioned by the Head Administrator. No self-registration.
          </p>
          </>
          )}
        </div>

        <div className="absolute bottom-8 text-center text-[10px] uppercase tracking-widest text-gray-400">
          © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
        </div>
      </div>
    </div>
  );
}
