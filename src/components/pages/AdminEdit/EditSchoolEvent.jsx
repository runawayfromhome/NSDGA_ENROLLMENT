import React from 'react'
import EditSchoolEventCard from '../../icons/EditSchoolEventCard'
const EditSchoolEvent = () => {
  const events = [
    {
      title: "STEM & Arts",
      date: "11/20/2024",
      description: "A fusion of technological innovation and creative expression featuring student robotics projects and a live orchestral performance."
    },
    {
      title: "STEM & Arts",
      date: "11/20/2024",
      description: "A fusion of technological innovation and creative expression featuring student robotics projects and a live orchestral performance."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] py-12 px-6 md:px-20">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-2 h-10 bg-[#802018]" />
              <h1 className="text-4xl font-bold text-gray-900">School Events</h1>
            </div>
            <p className="text-gray-500 text-sm max-w-md leading-relaxed">
              Manage the public calendar and promotional event cards displayed on the institution's homepage.
            </p>
          </div>

          <button className="bg-[#B22222] text-white px-8 py-2.5 rounded-lg font-bold hover:bg-[#8B0000] transition-colors shadow-md cursor-pointer self-start md:self-auto">
            Add New Event
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((event, index) => (
            <EditSchoolEventCard 
              key={index}
              title={event.title}
              date={event.date}
              description={event.description}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default EditSchoolEvent