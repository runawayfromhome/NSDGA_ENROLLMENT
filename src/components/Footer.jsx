import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import FaceBook from '../components/icons/FaceBook'
import EmailIcon from '../components/icons/EmailIcon'
import AcademyLogo from '../assets/nuestralogo.jpg'
import ContactUsModal from './icons/ContactUsModal'
import { getContact } from '../lib/content'

const Footer = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contact, setContact] = useState(null);
  useEffect(() => { getContact().then(setContact); }, []);

  return (
    <>
      <footer className="footer sm:footer-horizontal bg-[#800000] text-white py-10 px-10 md:px-16 lg:px-24">
        <aside>
          <div className="flex items-start gap-4">
            <div className="avatar">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-white/20">
                <img src={AcademyLogo} alt="NSGA Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-bold text-lg leading-tight uppercase">
                Nuestra Señora De Guia <br /> Academy of Marikina
              </p>
              <p className="max-w-xs text-sm leading-relaxed opacity-90">
                Empowering children to reach their fullest potential through 
                quality education, values formation, and a strong foundation 
                in faith and lifelong learning.
              </p>
            </div>
          </div>
        </aside>

        <nav>
          <h6 className="text-lg font-semibold mb-2">CAMPUS LOCATIONS</h6>
          <h2 className="text-md font-bold">Greenland Campus</h2>
          <h1 className="text-[10px] font-black tracking-widest text-white mb-1">MAIN CAMPUS</h1>
          <p className="text-sm opacity-80 mb-4">14 Washington St. Greenland Subd. Ph.1<br />
          Nangka Marikina City<br />
          Tel: (7) 933-7729 | 0925-8856698
          </p>
          <h2 className="text-md font-bold">Greenheights Campus</h2>
          <p className="text-sm opacity-80">98 Soliven St. Greenheights Subd. Ph.3<br />
          Nangka Marikina City<br />
          </p>
        </nav>

        <nav>
          <h2 className="text-md font-bold">Parang Campus</h2>
          <p className="text-sm opacity-80 mb-4">3 C.M. Recto St. Parang <br />
          Marikina City </p>
          <h2 className="text-md font-bold">J.P Rizal Campus</h2>
          <p className="text-sm opacity-80">904 J.P. Rizal St. Nangka Marikina City </p>
        </nav>

        <nav>
          <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
          <div className="flex flex-col gap-2">
            <NavLink to="/Calendar" className="link link-hover text-sm opacity-80">Academic Calendar</NavLink>
            <NavLink to="/About" className="link link-hover text-sm opacity-80">About Us</NavLink>
            <button 
              onClick={() => setIsContactOpen(true)}
              className="link link-hover text-sm opacity-80 text-left"
            >
              Contact Us
            </button>
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            <a href={contact?.facebookUrl || 'https://facebook.com'} target="_blank" rel="noreferrer" className="flex items-center gap-2 link link-hover text-white">
              <FaceBook size={20} />
              <span>Facebook</span>
            </a>
            <a href={`mailto:${contact?.generalEmail || 'nsga_marikina@yahoo.com'}`} className="flex items-center gap-2 link link-hover text-white">
              <EmailIcon size={20} color="white" />
              <span>Email Us</span>
            </a>
          </div>
        </nav>
      </footer>

      <footer className="footer footer-center bg-[#800000] text-white border-t border-white/20 p-6 px-10 md:px-16 lg:px-24">
        <aside>
          <p className="text-xs opacity-70">
            Copyright © {new Date().getFullYear()} - All rights reserved by Nuestra Señora De Guia Academy
          </p>
        </aside>
      </footer>

      {/* Render the Separate Modal Component */}
      <ContactUsModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} contact={contact} />
    </>
  )
}

export default Footer