import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import NuestraLogoImage from '../../../assets/nuestradg.png'
import AcademyLogo from '../../../assets/nuestralogo.jpg'
import Input from '../../form/Input'

import PersonIcon from '../../icons/StudentPortalIcons/PersonIcon'
import Padlock from '../../icons/StudentPortalIcons/Padlock'
import Eye from '../../icons/StudentPortalIcons/Eye'
import EmailIcon from '../../icons/StudentPortalIcons/EmailIcon'
import Rotate from '../../icons/StudentPortalIcons/Rotate'
import ArrowIcon from '../../icons/StudentPortalIcons/ArrowIcon'

const Signup = () => {
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Added separate state for confirm password visibility if you want them independent, 
  // but using the same 'showPassword' state as requested to match the password behavior.

  const handleSubmit = (e) => {
    e.preventDefault();
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

      {/* Right Side: Signup Form */}
      <div className="w-full lg:w-[55%] bg-[#F9FAFB] flex flex-col items-center justify-center px-6 md:px-20 relative py-10">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-500 mb-8">Register with your student credentials to access the portal.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <Input
              name="fullname"
              label="Full Name"
              type="text"
              placeholder="Juan Dela Cruz"
              icon={<PersonIcon className="scale-50" />} 
            />

            {/* Email Field */}
            <Input
              name="email"
              label="Email"
              type="email"
              placeholder="juandelacruz@gmail.com"
              icon={<EmailIcon className="scale-50" />} 
            />

            {/* Password Field */}
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

            {/* Confirm Password Field - Updated with Eye Toggle */}
            <Input
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              icon={<Rotate className="scale-50" />} 
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

            {/* Terms and Privacy Checkbox */}
            <div className="flex items-start gap-2 text-xs pt-2">
              <div
                onClick={() => setAgreed(!agreed)}
                className="w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer"
                style={{
                  backgroundColor: agreed ? '#800000' : 'white',
                  borderColor: agreed ? '#800000' : '#D1D5DB',
                }}
              >
                {agreed && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <p className="text-gray-600 leading-tight">
                I have read and agree to the <span className="text-[#800000] font-bold cursor-pointer">Terms of Service</span> and <span className="text-[#800000] font-bold cursor-pointer">Privacy Policy</span> of NSDGA. <span className="text-red-500">*</span>
              </p>
            </div>

            {/* Create Account Button */}
            <button type="submit" className="btn w-full bg-[#800000] hover:bg-[#600000] text-white border-none h-14 rounded-lg text-lg normal-case font-bold shadow-lg cursor-pointer mt-4 flex items-center justify-center gap-2">
              Create Account 
              <ArrowIcon size={18} className="mt-0.5" />
            </button>
          </form>

          {/* Login Redirection */}
          <p className="text-center mt-8 text-gray-600 text-sm">
            Already have an account?{" "}
            <NavLink to="/StudentPortal/Login" className="text-[#800000] font-bold hover:text-[#a00000] transition-colors">
              Login
            </NavLink>
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 text-center text-[10px] uppercase tracking-widest text-gray-400">
          © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default Signup