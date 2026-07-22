import React, { useRef } from 'react'

const SchoolEventCard = ({ children }) => {
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      // Calculate scroll based on the visible width of the container
      const scrollAmount = carouselRef.current.offsetWidth; 
      const { scrollLeft } = carouselRef.current;
      
      const scrollTo = direction === 'left' 
        ? scrollLeft - scrollAmount 
        : scrollLeft + scrollAmount;
      
      carouselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#F9F9F9] border border-gray-200 rounded-2xl p-8 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <div className="relative">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">School Events</h2>
          <div className="absolute -bottom-2 left-0 w-12 h-1 bg-[#800000]"></div>
        </div>
        
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => scroll('left')}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 bg-white hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-sm">❮</span>
          </button>
          <button 
            type="button"
            onClick={() => scroll('right')}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 bg-white hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <span className="text-sm">❯</span>
          </button>
        </div>
      </div>
      
      {/* The carousel child */}
      <div className="relative w-full">
        {React.cloneElement(children, { ref: carouselRef })}
      </div>
    </div>
  )
}

export default SchoolEventCard