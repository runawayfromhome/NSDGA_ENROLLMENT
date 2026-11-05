import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/Mainlayouts'
import ArrowIcon from '../icons/StudentPortalIcons/ArrowIcon'
import NuestraLogoImage from '../../assets/nuestradg.png'
import { getPublishedEvents, formatEventDate } from '../../lib/content'
import ImageCarousel from '../ImageCarousel'
import { LuCalendarDays } from 'react-icons/lu'

const Home = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])

  useEffect(() => {
    getPublishedEvents().then((items) => setEvents(items.slice(0, 3)))
  }, [])

  return (
    <MainLayout>
      {/* HERO */}
      <div
        className="relative w-screen min-h-screen -ml-[50vw] left-1/2 right-1/2 -mr-[50vw] flex items-center"
        style={{
          backgroundImage: `url(${NuestraLogoImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(85, 0, 0, 0.65)' }} />

        <div className="relative z-10 w-full px-4 sm:px-6 md:pl-16 lg:pl-24">
          <div className="max-w-4xl text-left text-white">
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight">
              Empowering <br /> Minds,
            </h1>
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light italic mt-2 mb-6 md:mb-10">
              Nurturing Faith.
            </h2>
            <p className="mb-6 md:mb-12 text-base sm:text-lg md:text-xl leading-relaxed max-w-lg">
              An institution of prestigious learning and spiritual growth, dedicated to shaping the
              visionary leaders of tomorrow through the lens of classical academic excellence.
            </p>
            <NavLink
              to="/StudentPortal/Apply"
              className="btn btn-sm sm:btn-md md:btn-lg rounded-xl bg-[#600000] hover:bg-white hover:text-[#600000] border-none text-white px-6 sm:px-8 md:px-12 h-auto py-3 md:py-5 inline-flex items-center gap-2 md:gap-4 shadow-2xl transition-all text-sm md:text-lg font-semibold"
            >
              <span>Apply Now</span>
              <ArrowIcon className="text-lg md:text-2xl" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* LATEST EVENTS (managed by Admin) */}
      {events.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-6 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-10">
            <div>
              <p className="text-[#800000] font-bold text-xs tracking-[0.25em] uppercase mb-2">What&rsquo;s Happening</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800">Latest School Events</h2>
            </div>
            <NavLink to="/Calendar" className="text-[#800000] font-bold text-sm flex items-center gap-2 hover:opacity-70">
              View all events <span className="text-lg">→</span>
            </NavLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {events.map((ev) => (
              <button type="button" key={ev.id} onClick={() => navigate('/Calendar', { state: { eventId: ev.id } })} className="text-left w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                <div className="p-2 pb-0">
                  <ImageCarousel
                    images={ev.images}
                    alt={ev.title}
                    heightClass="h-44"
                    rounded="rounded-xl"
                    fallback={<LuCalendarDays className="w-12 h-12 text-white/85" strokeWidth={1.4} />}
                  />
                </div>
                <div className="p-6">
                  {ev.category && <p className="text-[10px] font-black uppercase tracking-widest text-[#800000] mb-1">{ev.category}</p>}
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">{ev.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{formatEventDate(ev.date)}{ev.location ? ' · ' + ev.location : ''}</p>
                  <p className="text-sm text-slate-500 mt-3" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </MainLayout>
  )
}

export default Home
