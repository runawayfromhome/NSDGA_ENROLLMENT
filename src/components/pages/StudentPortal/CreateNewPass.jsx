import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import NuestraLogoImage from '../../../assets/nuestradg.png'
import AcademyLogo from "../../../assets/nuestralogo.jpg"
import ProcedureCard from "../../icons/StudentPortalIcons/ProcedureCard"
import Input from "../../form/Input"
import Padlock from "../../icons/StudentPortalIcons/Padlock"
import Eye from "../../icons/StudentPortalIcons/Eye"
import { setNewPassword } from '../../../lib/student'

const CreateNewPass = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.target);
    const pw = fd.get('newPassword'), cf = fd.get('confirmPassword');
    if ((pw || '').length < 8) return setError('Password must be at least 8 characters.');
    if (pw !== cf) return setError('Passwords do not match.');
    setBusy(true);
    const res = await setNewPassword(pw);
    setBusy(false);
    if (!res.ok) return setError(res.error || 'Reset failed. Your link may have expired — request a new one.');
    setDone(true);
    setTimeout(() => navigate('/StudentPortal/Login'), 1800);
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

      {/* Right Side: Create New Password Form */}
      <div className="w-full lg:w-[55%] bg-[#F9FAFB] flex flex-col items-center justify-center px-6 md:px-20 relative py-10">
        <ProcedureCard className="w-full max-w-md p-10 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-[#800000] mb-4">Create New Password</h2>
          
          <p className="text-gray-500 text-sm mb-8 text-center leading-relaxed">
            Your new password must be different from previous passwords.
          </p>
          
          {done && <div className="w-full mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">✓ Password updated. Redirecting to login…</div>}
          {error && <div className="w-full mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            {/* New Password Field */}
            <div className="space-y-1">
              <Input
                name="newPassword"
                label="NEW PASSWORD"
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
            </div>

            {/* Password Requirements Checklist */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-[11px] font-bold text-gray-700 mb-2 uppercase">Create a strong password</p>
              <ul className="text-[11px] space-y-1 text-gray-500 list-disc pl-4">
                <li className="text-[#800000] font-semibold">At least 8 characters</li>
                <li>Mixed uppercase and lowercase (recommended)</li>
                <li>A number and a special character (recommended)</li>
              </ul>
            </div>

            {/* Confirm New Password Field */}
            <Input
              name="confirmPassword"
              label="CONFIRM NEW PASSWORD"
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

            {/* Reset Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={busy || done}
                className="btn w-full md:w-auto bg-[#800000] hover:bg-[#600000] text-white border-none px-10 h-12 rounded-md text-sm normal-case font-bold shadow-md cursor-pointer transition-colors disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Reset Password'}
              </button>
            </div>
          </form>
        </ProcedureCard>

        {/* Footer */}
        <div className="absolute bottom-6 text-center text-[10px] uppercase tracking-widest text-gray-400">
          © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default CreateNewPass