import { forwardRef } from 'react'
import { LuCalendarDays } from 'react-icons/lu'
import ImageCarousel from '../ImageCarousel'

const EventsCard = forwardRef(({ events, onCardClick }, ref) => {
  return (
    <div
      ref={ref}
      className="carousel carousel-end w-full rounded-box gap-6 scroll-smooth overflow-x-hidden no-scrollbar"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {events.map((event, index) => (
        <div
          key={event.id || index}
          className="carousel-item mb-2 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => onCardClick(event)}
        >
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-shadow flex flex-col w-[320px] md:w-[350px] h-[480px]">
            <div className="mb-4 flex-shrink-0">
              <ImageCarousel
                images={event.images}
                alt={event.title}
                heightClass="h-44"
                fallback={<LuCalendarDays className="w-12 h-12 text-white/85" strokeWidth={1.4} />}
              />
            </div>
            <p className="text-[11px] font-bold text-gray-400 mb-3 tracking-wide">{event.date}</p>
            <div className="w-full h-[1px] bg-gray-100 mb-4"></div>
            <h3 className="text-lg font-black text-slate-800 mb-3 leading-tight">{event.title}</h3>
            <p className="text-[12px] text-gray-500 leading-relaxed text-justify line-clamp-4">
              {event.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
})

export default EventsCard
