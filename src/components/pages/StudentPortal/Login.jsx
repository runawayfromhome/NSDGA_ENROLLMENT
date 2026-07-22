import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import NuestraLogoImage from '../../../assets/nuestradg.png'
import AcademyLogo from '../../../assets/nuestralogo.jpg'
import Input from '../../form/Input'
import PersonIcon from '../../icons/StudentPortalIcons/PersonIcon' 
import Padlock from '../../icons/StudentPortalIcons/Padlock'
import Eye from '../../icons/StudentPortalIcons/Eye'

const Login = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-[55%] bg-[#F9FAFB] flex flex-col items-center justify-center px-6 md:px-20 relative">
        <div className="w-full max-w-md">
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

            {/* Sign In Button turned into NavLink */}
            <NavLink 
              to="/StudentPortal/LoginOtp" 
              className="btn w-full bg-[#800000] hover:bg-[#600000] text-white border-none h-12 rounded-lg text-lg normal-case font-bold shadow-md cursor-pointer flex items-center justify-center"
            >
              Sign In
            </NavLink>
          </form>

          {/* Updated Sign Up Link */}
          <p className="text-center mt-6 text-gray-600 text-sm">
            Don't have an account yet?{" "}
            <NavLink to="/StudentPortal/Signup" className="text-[#800000] font-bold hover:text-[#a00000] transition-colors">
              Sign up
            </NavLink>
          </p>
        </div>

        <div className="absolute bottom-8 text-center text-[10px] uppercase tracking-widest text-gray-400">
          © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default Login
