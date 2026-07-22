import React from 'react'
import MainLayout from '../../layouts/Mainlayouts'
import ArrowIcon from '../icons/StudentPortalIcons/ArrowIcon'
import NuestraLogoImage from '../../assets/nuestradg.png'

const Home = () => {
  return (
    <MainLayout>
      <div
        className="relative w-screen min-h-screen -ml-[50vw] left-1/2 right-1/2 -mr-[50vw] flex items-center"
        style={{
          // This uses your updated school facade image from src/assets/nuestradg.png
          backgroundImage: `url(${NuestraLogoImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Overlay layer to ensure text remains readable against the school facade */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(85, 0, 0, 0.65)' }} // Slightly increased opacity for the new detailed background
        />

        <div className="relative z-10 w-full px-4 sm:px-6 md:pl-16 lg:pl-24">
          <div className="max-w-4xl text-left text-white">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight">
              Empowering <br /> Minds,
            </h1>
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light italic mt-2 mb-6 md:mb-10">
              Nurturing Faith.
            </h2>
            <p className="mb-6 md:mb-12 text-base sm:text-lg md:text-xl leading-relaxed max-w-lg opacity-100">
              An institution of prestigious learning and spiritual growth,
              dedicated to shaping the visionary leaders of tomorrow
              through the lens of classical academic excellence.
            </p>
            <button className="btn btn-sm sm:btn-md md:btn-lg rounded-xl bg-[#600000] hover:bg-white hover:text-[#600000] border-none text-white px-6 sm:px-8 md:px-12 h-auto py-3 md:py-5 flex items-center gap-2 md:gap-4 shadow-2xl transition-all text-sm md:text-lg font-semibold\">
              <span>Apply Now</span>
              <ArrowIcon className="text-lg md:text-2xl\" />
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default Home