import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import MainLayout from '../../layouts/Mainlayouts'
import { getPublishedEvents, formatEventDate, getSection } from '../../lib/content'
import SchoolEventCard from '../icons/SchoolEventCard'
import EventsCard from '../icons/EventsCard'
import AcadSchedEventCard from '../icons/AcadSchedEventCard'
import AcadSchedCard from '../icons/AcadSchedCard'
import { LuCalendar, LuMapPin, LuCalendarDays } from "react-icons/lu"
import ImageCarousel from '../ImageCarousel'

const Calendar = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [schoolEvents, setSchoolEvents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [activeLevel, setActiveLevel] = useState(0);
  const location = useLocation();

  // Load the Admin-published events + per-level academic schedule from Supabase.
  useEffect(() => {
    getPublishedEvents().then((items) => {
      const formatted = items.map((e) => ({ ...e, date: formatEventDate(e.date) }));
      setSchoolEvents(formatted);
      const selected = formatted.find((e) => e.id === location.state?.eventId);
      if (selected) {
        setSelectedEvent(selected);
        requestAnimationFrame(() => document.getElementById('event_modal')?.showModal());
      }
    });
    getSection('schedule').then((c) => setLevels(c.levels || []));
  }, [location.state]);

  const activeTerms = levels[activeLevel]?.terms || [];

  const handleCardClick = (event) => {
    setSelectedEvent(event);
    document.getElementById('event_modal').showModal();
  };

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto py-12 px-6 space-y-12">
        
        {/* HEADER SECTION */}
        <div className="space-y-4">
          <p className="text-[#800000] font-bold text-sm tracking-widest uppercase">
            Academic Year 2026-2027
          </p>
          <h1 className="text-5xl font-black text-slate-800 leading-tight">
            Charting the Path to <br />
            <span className="text-[#800000]">Excellence.</span>
          </h1>
          <p className="max-w-2xl text-gray-500 text-sm leading-relaxed">
            Stay informed with our comprehensive academic schedule and upcoming campus events. 
            Plan your journey at Nuestra Señora De Guia Academy with precision.
          </p>
        </div>

        {/* SCHOOL EVENTS CAROUSEL (managed by Admin) */}
        {schoolEvents.length > 0 ? (
          <SchoolEventCard>
            <EventsCard events={schoolEvents} onCardClick={handleCardClick} />
          </SchoolEventCard>
        ) : (
          <div className="text-center text-slate-400 text-sm py-12 border border-dashed border-slate-200 rounded-2xl">
            No upcoming events have been posted yet.
          </div>
        )}

        {/* EVENT MODAL (MATCHES SCREENSHOT) */}
        <dialog id="event_modal" className="modal backdrop:backdrop-blur-sm">
          <div className="modal-box max-w-2xl p-0 overflow-hidden bg-white rounded-xl shadow-2xl border-none">
            <div className="relative h-64 w-full">
              <ImageCarousel
                images={selectedEvent?.images}
                alt={selectedEvent?.title}
                heightClass="h-64"
                rounded="rounded-none"
                fallback={<LuCalendarDays className="w-16 h-16 text-white/70" strokeWidth={1.3} />}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 pointer-events-none">
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em] mb-1">
                  {selectedEvent?.category}
                </p>
                <h3 className="text-3xl font-bold text-white tracking-tight">{selectedEvent?.title}</h3>
              </div>
              <form method="dialog">
                <button className="absolute right-4 top-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 text-sm transition-colors">✕</button>
              </form>
            </div>

            <div className="p-8 space-y-8 bg-white">
              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100"><LuCalendar className="text-[#800000]" size={20} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                    <p className="text-sm font-bold text-slate-800">{selectedEvent?.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100"><LuMapPin className="text-[#800000]" size={20} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
                    <p className="text-sm font-bold text-slate-800">{selectedEvent?.location}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-[#800000] uppercase tracking-[0.15em]">Event Overview</h4>
                <div className="text-sm text-gray-500 leading-relaxed space-y-4 whitespace-pre-line text-justify">
                  {selectedEvent?.description}
                </div>
              </div>
            </div>
          </div>
        </dialog>

        {/* ACADEMIC SCHEDULE SECTION (per level, managed by Admin) */}
        {levels.length > 0 && (
          <AcadSchedEventCard>
            <div className="flex flex-wrap gap-2 mb-8">
              {levels.map((l, i) => (
                <button key={l.id} onClick={() => setActiveLevel(i)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${i === activeLevel ? 'bg-[#800000] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {l.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {activeTerms.map((term, i) => (
                <div key={term.id} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl font-black text-slate-100 italic">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="text-xl font-bold text-[#800000]">{term.name}</h3>
                      {term.range && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{term.range}</p>}
                    </div>
                  </div>
                  <AcadSchedCard>
                    <div className="space-y-4">
                      {term.items.length
                        ? term.items.map((it) => <ScheduleItem key={it.id} label={it.label} date={it.date} />)
                        : <p className="text-sm text-slate-400">No dates posted yet.</p>}
                    </div>
                  </AcadSchedCard>
                </div>
              ))}
            </div>
          </AcadSchedEventCard>
        )}
      </div>
    </MainLayout>
  )
}

const ScheduleItem = ({ label, date }) => (
  <div className="flex items-center justify-between py-1 border-l-4 border-[#800000] pl-4">
    <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{label}</span>
    <span className="text-sm font-black text-[#800000]">{date}</span>
  </div>
)

export default Calendar