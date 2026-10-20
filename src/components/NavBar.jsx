import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import AcademyLogo from '../assets/nuestralogo.jpg'

const NavBar = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // which desktop dropdown is open (hover/click)

  const pathMapping = {
    'Elementary': 'Elem',
    'Junior High School': 'JHS',
    'Senior High School': 'SHS',
    'Kindergarten': 'Kindergarten',
    'Calendar': 'Calendar',
  };

  // One consistent maroon style on every page.
  const getLinkClassName = (isActive) =>
    isActive ? 'font-bold text-white' : 'font-medium text-white/70 hover:text-white';

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <div className="navbar sticky top-0 shadow-md px-4 md:px-10 lg:px-12 h-20 z-[100] bg-[#800000] text-white">
        {/* Hamburger Button - Mobile Only */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="btn btn-ghost btn-circle lg:hidden text-white"
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
            <span className="text-xs md:text-lg lg:text-xl font-bold tracking-wide uppercase text-white">Nuestra Señora De Guía Academy</span>
            <span className="text-[7px] md:text-[10px] tracking-[0.2em] font-medium text-white/80">MARIKINA CITY</span>
          </NavLink>
        </div>

        {/* Desktop Menu */}
        <div className="flex-none hidden lg:flex">
          <div className="flex items-center gap-2 lg:gap-6">
            {['Kindergarten', 'Elementary', 'Junior High School', 'Senior High School'].map((item) => {
              const prefix = pathMapping[item];
              const isCurrentCategoryActive = prefix && location.pathname.startsWith(`/${prefix}`);

              if (item === 'Kindergarten') {
                return (
                  <NavLink key={item} to="/Kindergarten"
                    className={`cursor-pointer text-sm transition-colors py-2 ${getLinkClassName(location.pathname === '/Kindergarten')}`}>
                    Kindergarten
                  </NavLink>
                );
              }

              const subLinks = [
                { to: `/${prefix}OnCampus`, label: 'On-Campus Admission' },
                { to: `/${prefix}Online`, label: 'Online Admission' },
                ...(prefix === 'SHS' ? [{ to: '/SHSStrands', label: 'Strands / Tracks' }] : []),
              ];
              const open = openMenu === item;

              return (
                <div key={item} className="relative"
                  onMouseEnter={() => setOpenMenu(item)}
                  onMouseLeave={() => setOpenMenu((m) => (m === item ? null : m))}>
                  <button type="button"
                    onClick={() => setOpenMenu((m) => (m === item ? null : item))}
                    className={`cursor-pointer text-sm transition-colors py-2 flex items-center gap-1.5 ${getLinkClassName(isCurrentCategoryActive)}`}>
                    {item}
                    <svg className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 4.5 6 7.5 9 4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* pt-3 keeps a visual gap while staying inside the hover area, so moving the cursor to the menu doesn't close it */}
                  <div className={`absolute right-0 top-full pt-3 min-w-[230px] z-50 transition-all duration-200 origin-top-right ${open ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1 pointer-events-none'}`}>
                    <ul className="bg-white rounded-xl shadow-2xl border border-gray-100 p-2">
                      {subLinks.map((l) => (
                        <li key={l.to}>
                          <NavLink to={l.to} onClick={() => setOpenMenu(null)}
                            className={({ isActive }) => `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#800000]/10 text-[#800000]' : 'text-slate-600 hover:bg-[#800000]/5 hover:text-[#800000]'}`}>
                            {l.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}

            <NavLink to="/Calendar" className={`text-xs md:text-sm transition-colors py-2 ${getLinkClassName(location.pathname === '/Calendar')}`}>Calendar</NavLink>
            <NavLink to="/About" className={`text-xs md:text-sm transition-colors py-2 ${getLinkClassName(location.pathname === '/About')}`}>About</NavLink>
            <NavLink to="/StudentPortal/Login" className={`text-xs md:text-sm transition-colors py-2 ${getLinkClassName(location.pathname === '/StudentPortal/Login')}`}>Login</NavLink>

            <NavLink
              to="/StudentPortal/Apply"
              className="btn btn-sm md:btn-md rounded-lg bg-white text-[#800000] border-none hover:bg-gray-100 px-4 md:px-8 ml-2 md:ml-4 shadow-md active:scale-95 transition-all"
            >
              <span className="text-xs md:text-base font-bold">Apply Now</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed top-20 left-0 right-0 lg:hidden z-[99] bg-[#800000] shadow-lg">
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
                        <NavLink to={`/${prefix}OnCampus`} onClick={closeMenu} className="block px-4 py-2 rounded-lg text-xs font-medium text-white/80 hover:bg-white/10 transition-colors">On-Campus Admission</NavLink>
                        <NavLink to={`/${prefix}Online`} onClick={closeMenu} className="block px-4 py-2 rounded-lg text-xs font-medium text-white/80 hover:bg-white/10 transition-colors">Online Admission</NavLink>
                        {prefix === 'SHS' && (
                          <NavLink to="/SHSStrands" onClick={closeMenu} className="block px-4 py-2 rounded-lg text-xs font-medium text-white/80 hover:bg-white/10 transition-colors">Strands / Tracks</NavLink>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            <NavLink to="/Calendar" onClick={closeMenu} className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${getLinkClassName(location.pathname === '/Calendar')}`}>Calendar</NavLink>
            <NavLink to="/About" onClick={closeMenu} className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${getLinkClassName(location.pathname === '/About')}`}>About</NavLink>
            <NavLink to="/StudentPortal/Login" onClick={closeMenu} className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${getLinkClassName(location.pathname === '/StudentPortal/Login')}`}>Login</NavLink>

            <NavLink to="/StudentPortal/Apply" onClick={closeMenu} className="block text-center w-full btn btn-sm rounded-lg bg-white text-[#800000] border-none hover:bg-gray-100 shadow-md active:scale-95 transition-all">
              <span className="text-xs font-bold">Apply Now</span>
            </NavLink>
          </div>
        </div>
      )}
    </>
  )
}

export default NavBar
