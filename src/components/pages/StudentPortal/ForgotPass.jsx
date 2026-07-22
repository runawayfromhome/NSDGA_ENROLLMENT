import React from 'react'
import { NavLink } from 'react-router-dom'
import NuestraLogoImage from '../../../assets/nuestradg.png'
import AcademyLogo from '../../../assets/nuestralogo.jpg'
import ProcedureCard from '../../icons/StudentPortalIcons/ProcedureCard'
import Input from '../../form/Input'
import EmailIcon from '../../icons/StudentPortalIcons/EmailIcon'
import SendIcon from '../../icons/StudentPortalIcons/SendIcon'

const ForgotPass = () => {
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

      {/* Right Side: Forgot Password Form */}
      <div className="w-full lg:w-[55%] bg-[#F9FAFB] flex flex-col items-center justify-center px-6 md:px-20 relative py-10">
        <ProcedureCard className="w-full max-w-md p-8">
          <h2 className="text-2xl font-bold text-[#800000] mb-6">Forgot password?</h2>
          
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Enter your registered email address to receive a password reset code.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <Input
              name="email"
              label="Email Address"
              type="email"
              placeholder="juandelacruz@gmail.com"
              icon={<EmailIcon className="scale-50" />} 
            />

            {/* Send Button as NavLink */}
            <div className="flex justify-end">
              <NavLink 
                to="/StudentPortal/ForgotPassOtp"
                className="btn bg-[#800000] hover:bg-[#600000] text-white border-none px-6 h-12 rounded-md text-sm normal-case font-bold shadow-md cursor-pointer flex items-center gap-2"
              >
                Send Code
                <SendIcon size={16} className="text-white" />
              </NavLink>
            </div>
          </form>

          {/* Back to Login */}
          <p className="text-center mt-32 text-gray-500 text-sm">
            Remembered your password?{" "}
            <NavLink to="/StudentPortal/Login" className="text-[#800000] font-bold hover:underline">
              Log In
            </NavLink>
          </p>
        </ProcedureCard>

        {/* Footer */}
        <div className="absolute bottom-6 text-center text-[10px] uppercase tracking-widest text-gray-400">
          © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default ForgotPass
