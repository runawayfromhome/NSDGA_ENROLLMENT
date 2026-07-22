import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import AcademyLogo from '../assets/nuestralogo.jpg'

const NavBar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const admissionPaths = [
    '/ElemOnCampus', '/ElemOnline',
    '/JHSOnCampus', '/JHSOnline',
    '/SHSOnCampus', '/SHSOnline',
    '/Kindergarten', '/Calendar', '/About'
  ];

  const isSpecialPath = admissionPaths.includes(location.pathname);

  const pathMapping = {
    'Elementary': 'Elem',
    'Junior High School': 'JHS',
    'Senior High School': 'SHS',
    'Kindergarten': 'Kindergarten',
    'Calendar': 'Calendar',
  };

  const getLinkClassName = (isActive) => {
    if (isActive) return 'font-bold text-white';
    if (isSpecialPath) return 'font-medium text-white/70 hover:text-white';
    return 'font-medium text-black hover:text-[#800000]';
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <div className={`navbar sticky top-0 shadow-md px-4 md:px-10 lg:px-12 transition-all duration-300 h-20 z-[100] ${
        isSpecialPath ? 'bg-[#800000] text-white' : 'bg-white text-black'
      }`}>
        {/* Hamburger Button - Mobile Only */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="btn btn-ghost btn-circle lg:hidden"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex-1 flex items-center gap-2 md:gap-4">
          <div className="avatar">
            <div className="w-12 md:w-14 h-12 md:h-14 rounded-full overflow-hidden border-2 border-white/20 bg-white">
              <img 
                alt="Nuestra Señora De Guía Academy Logo" 
                src={AcademyLogo} 
                className="object-cover w-full h-full" 
              />
            </div>
          </div>

          <NavLink to="/Home" className="flex flex-col items-start normal-case leading-tight">
            <span className="text-xs md:text-lg lg:text-xl font-bold tracking-wide uppercase">Nuestra Señora De Guía Academy</span>
            <span className={`text-[7px] md:text-[10px] tracking-[0.2em] font-medium ${isSpecialPath ? 'text-white/90' : 'opacity-70'}`}>MARIKINA CITY</span>
          </NavLink>
        </div>

        {/* Desktop Menu */}
        <div className="flex-none hidden lg:flex">
          <div className="flex items-center gap-2 lg:gap-6">
            {['Kindergarten', 'Elementary', 'Junior High School', 'Senior High School'].map((item) => {
               const prefix = pathMapping[item];
               const isCurrentCategoryActive = prefix && location.pathname.startsWith(`/${prefix}`);

               return (
                 <div key={item} className="dropdown dropdown-hover dropdown-bottom dropdown-end">
                    {item === 'Kindergarten' ? (
                      <NavLink 
                        to="/Kindergarten" 
                        className={`cursor-pointer text-sm transition-colors py-2 flex items-center gap-1 ${getLinkClassName(location.pathname === '/Kindergarten')}`}
                      >
                        Kindergarten
                      </NavLink>
                    ) : (
                      <div tabIndex="0" role="button" className={`cursor-pointer text-sm transition-colors py-2 flex items-center gap-1 ${getLinkClassName(isCurrentCategoryActive)}`}>
                        {item} <span className="text-[10px]">▼</span>
                      </div>
                    )}

                    {item !== 'Kindergarten' && (
                      <ul tabIndex="0" className="dropdown-content menu bg-white text-black rounded-box z-[1] mt-1 w-52 p-2 shadow-xl border border-base-200">
                        <li className="hover:text-[#800000]">
                          <NavLink 
                            to={`/${prefix}OnCampus`} 
                            className="hover:bg-transparent active:bg-transparent"
                          >
                            On-Campus Admission
                          </NavLink>
                        </li>
                        <li className="hover:text-[#800000]">
                          <NavLink 
                            to={`/${prefix}Online`} 
                            className="hover:bg-transparent active:bg-transparent"
                          >
                            Online Admission
                          </NavLink>
                        </li>
                      </ul>
                    )}
                 </div>
               );
            })}

            <NavLink to="/Calendar" className={`text-xs md:text-sm transition-colors py-2 ${getLinkClassName(location.pathname === '/Calendar')}`}>Calendar</NavLink>
            <NavLink to="/About" className={`text-xs md:text-sm transition-colors py-2 ${getLinkClassName(location.pathname === '/About')}`}>About</NavLink>

            {isSpecialPath && (
              <button className="btn btn-sm md:btn-md rounded-lg bg-white text-[#800000] border-none hover:bg-gray-100 px-4 md:px-8 ml-2 md:ml-4 shadow-md active:scale-95 transition-all">
                  <span className="text-xs md:text-base font-bold">Apply Now</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className={`fixed top-20 left-0 right-0 lg:hidden z-[99] transition-all duration-300 ${
          isSpecialPath ? 'bg-[#800000]' : 'bg-white'
        } shadow-lg`}>
          <div className="p-4 space-y-3 max-h-[calc(100vh-80px)] overflow-y-auto">
            {['Kindergarten', 'Elementary', 'Junior High School', 'Senior High School'].map((item) => {
              const prefix = pathMapping[item];
              const isCurrentCategoryActive = prefix && location.pathname.startsWith(`/${prefix}`);

              return (
                <div key={item}>
                  {item === 'Kindergarten' ? (
                    <NavLink 
                      to="/Kindergarten" 
                      onClick={closeMenu}
                      className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${getLinkClassName(location.pathname === '/Kindergarten')}`}
                    >
                      Kindergarten
                    </NavLink>
                  ) : (
                    <>
                      <div className={`px-4 py-3 text-sm font-medium ${getLinkClassName(isCurrentCategoryActive)}`}>
                        {item}
                      </div>
                      <div className="pl-6 space-y-2">
                        <NavLink 
                          to={`/${prefix}OnCampus`} 
                          onClick={closeMenu}
                          className="block px-4 py-2 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors"
                        >
                          On-Campus Admission
                        </NavLink>
                        <NavLink 
                          to={`/${prefix}Online`} 
                          onClick={closeMenu}
                          className="block px-4 py-2 rounded-lg text-xs font-medium hover:bg-white/10 transition-colors"
                        >
                          Online Admission
                        </NavLink>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            <NavLink 
              to="/Calendar" 
              onClick={closeMenu}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${getLinkClassName(location.pathname === '/Calendar')}`}
            >
              Calendar
            </NavLink>
            <NavLink 
              to="/About" 
              onClick={closeMenu}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${getLinkClassName(location.pathname === '/About')}`}
            >
              About
            </NavLink>

            {isSpecialPath && (
              <button className="w-full btn btn-sm rounded-lg bg-white text-[#800000] border-none hover:bg-gray-100 shadow-md active:scale-95 transition-all">
                <span className="text-xs font-bold">Apply Now</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default NavBar