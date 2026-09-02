import NuestraLogoImage from '../../../assets/nuestradg.png'
import AcademyLogo from '../../../assets/nuestralogo.jpg'
import ProcedureCard from '../../icons/StudentPortalIcons/ProcedureCard'
import { useRef } from 'react';

const LoginOtp = () => {
  // Create an array of refs to control the focus of each input
  const inputRefs = useRef([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const otp = inputRefs.current.map(input => input.value).join("");
    console.log("Submitted OTP:", otp);
  };

  const handleChange = (e, index) => {
    const value = e.target.value;
    
    // If user typed a character, move focus to the next box
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // If user hits Backspace and the current box is empty, move focus to the previous box
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      inputRefs.current[index - 1].focus();
    }
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

      {/* Right Side: OTP Form */}
      <div className="w-full lg:w-[55%] bg-[#F9FAFB] flex flex-col items-center justify-center px-6 md:px-20 relative py-10">
        <ProcedureCard className="w-full max-w-md p-10 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-[#800000] mb-8">OTP Verification</h2>
          
          <p className="text-gray-500 text-sm mb-10 leading-relaxed max-w-[280px]">
            We've sent a 6-digit code to your email. Please enter it below.
          </p>
          
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center space-y-6">
            {/* 6-Digit OTP Inputs */}
            <div className="flex gap-2 mb-4">
              {[...Array(6)].map((_, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)} // Assign ref to each input
                  type="text"
                  maxLength="1"
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-10 h-12 border border-gray-300 rounded-md text-center text-xl font-bold focus:border-[#800000] focus:ring-1 focus:ring-[#800000] outline-none transition-all"
                  placeholder="•"
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              <button 
                type="submit" 
                className="w-full bg-[#800000] hover:bg-[#600000] text-white border-none h-12 rounded-md text-sm normal-case font-bold shadow-md cursor-pointer transition-colors"
              >
                Verify OTP
              </button>
              
              <button 
                type="button"
                className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-[#800000] h-12 rounded-md text-sm normal-case font-bold shadow-sm cursor-pointer transition-colors"
              >
                Resend OTP
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <p className="mt-8 text-gray-500 text-sm">
            Didn't receive the code?{" "}
            <span className="text-[#800000] font-bold cursor-pointer hover:underline">
              Resend Code
            </span>
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

export default LoginOtp