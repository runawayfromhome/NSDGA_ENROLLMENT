import React, { useState } from 'react'
import MainLayout from '../../layouts/Mainlayouts'
import SchoolEventCard from '../icons/SchoolEventCard'
import EventsCard from '../icons/EventsCard'
import AcadSchedEventCard from '../icons/AcadSchedEventCard'
import AcadSchedCard from '../icons/AcadSchedCard'
import { LuCalendar, LuMapPin } from "react-icons/lu"

const Calendar = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const schoolEvents = [
    {
      date: "March 14, 2026",
      title: "Mariprisa Rising League",
      category: "ATHLETIC EXCELLENCE",
      location: "Marist School Gymnasium",
      image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=400",
      description: "In a stunning display of grit and teamwork, the Nuestra Señora De Guia Academy elementary basketball team clinched the silver medal at the prestigious Mariprisa Rising League. Competing against the region's top athletic programs, our young athletes showcased exceptional sportsmanship and tactical brilliance.\n\nThe final match at the Marist School Gymnasium was a testament to their hard work throughout the semester. We invite all faculty and students to join the victory rally scheduled for the following Monday to celebrate this monumental achievement in school history."
    },
    {
      date: "March 2, 2026",
      title: "Seniors' Ball 2026",
      category: "STUDENT LIFE",
      location: "Marikina Convention Center",
      image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400",
      description: "Seniors' Ball 2026 with the theme: \"MAHARLIKA: A Grand Evening of Timeless Filipino Grace and Heritage\" held at Marikina Convention Center."
    },
    {
      date: "March 9, 2026",
      title: "Deguian Meet 2026",
      category: "CAMPUS EVENTS",
      location: "NSDGA Main Campus",
      image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=400",
      description: "The impact of Deguian Meet 2026 is still being felt, and we are all still grinning from ear to ear. From the epic performances to heartwarming moments of winning, it was truly an event to remember for the Deguian community."
    },
    {
      date: "April 15, 2026",
      title: "Senior High STEM Exhibit",
      category: "ACADEMIC SHOWCASE",
      location: "STEM Laboratory Hall",
      image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=400",
      description: "Showcasing innovative projects from our STEM track students. This exhibit highlights technical skills in robotics and scientific research at the Marikina campus."
    }
  ];

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

        {/* SCHOOL EVENTS CAROUSEL */}
        <SchoolEventCard>
          <EventsCard events={schoolEvents} onCardClick={handleCardClick} />
        </SchoolEventCard>

        {/* EVENT MODAL (MATCHES SCREENSHOT) */}
        <dialog id="event_modal" className="modal backdrop:backdrop-blur-sm">
          <div className="modal-box max-w-2xl p-0 overflow-hidden bg-white rounded-xl shadow-2xl border-none">
            <div className="relative h-64 w-full">
              <img src={selectedEvent?.image} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-[0.2em] mb-1">
                  {selectedEvent?.category}
                </p>
                <h3 className="text-3xl font-bold text-white tracking-tight">{selectedEvent?.title}</h3>
              </div>
              <form method="dialog">
                <button className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 text-sm transition-colors">✕</button>
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

        {/* ACADEMIC SCHEDULE SECTION */}
        <AcadSchedEventCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-5xl font-black text-slate-100 italic">01</span>
                <div>
                  <h3 className="text-xl font-bold text-[#800000]">1st Semester</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">August 2024 — December 2024</p>
                </div>
              </div>
              <AcadSchedCard>
                <div className="space-y-4">
                  <ScheduleItem label="Start of Classes" date="Aug 14" />
                  <ScheduleItem label="Mid-term Exams" date="Oct 16-18" />
                  <ScheduleItem label="Final Exams" date="Dec 11-13" />
                  <ScheduleItem label="Semestrial Break" date="Dec 16 - Jan 5" />
                </div>
              </AcadSchedCard>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-5xl font-black text-slate-100 italic">02</span>
                <div>
                  <h3 className="text-xl font-bold text-[#800000]">2nd Semester</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">January 2025 — June 2025</p>
                </div>
              </div>
              <AcadSchedCard>
                <div className="space-y-4">
                  <ScheduleItem label="Resumption of Classes" date="Jan 6" />
                  <ScheduleItem label="Mid-term Exams" date="Mar 12-14" />
                  <ScheduleItem label="Final Exams" date="May 21-23" />
                  <ScheduleItem label="Commencement Exercises" date="June 4-6" />
                </div>
              </AcadSchedCard>
            </div>
          </div>
        </AcadSchedEventCard>
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