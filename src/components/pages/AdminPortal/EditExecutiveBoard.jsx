import React from 'react'
import EditExecutiveBoardCard from '../../icons/AdminIcons/EditExecutiveBoardCard'

const EditExecutiveBoard = () => {
  const boardMembers = [
    { name: "Engr. Felipe C. Urrutia", position: "School President" },
    { name: "Guia B. Urrutia", position: "Executive Vice President" },
    { name: "Philip James B. Urrutia", position: "V.P. For Building Administration" },
    { name: "Engr. Patrick Gene B. Urrutia", position: "V.P. For External Affairs" },
    { name: "Phia Mae U. Grivas", position: "V.P. For Finance" },
    { name: "Engr. Paul Gian B. Urrutia", position: "V.P. For Academics" },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] py-12 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Executive Board</h1>
          <p className="text-gray-500 text-sm">
            Update profile information and administrative hierarchy roles.
          </p>
        </div>

        {/* Board Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {boardMembers.map((member, index) => (
            <EditExecutiveBoardCard 
              key={index}
              name={member.name}
              position={member.position}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 border-t border-gray-200 pt-10">
          <button className="px-12 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
            Discard Changes
          </button>
          <button className="px-12 py-3 bg-[#802018] text-white rounded-xl font-bold hover:bg-[#601812] transition-all cursor-pointer shadow-lg">
            Publish Updates
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditExecutiveBoard