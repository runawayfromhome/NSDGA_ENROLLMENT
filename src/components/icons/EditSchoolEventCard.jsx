import React from 'react'
import { IoEyeOutline, IoTrashOutline, IoAddOutline } from "react-icons/io5";
import Input from '../form/Input'

const EditSchoolEventCard = ({ title, date, description }) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col h-full border border-gray-100">
      {/* Top Accent Bar */}
      <div className="h-2 w-full bg-[#802018]" />
      
      {/* Card Content with Gradient Background */}
      <div className="p-6 bg-gradient-to-b from-white to-[#F9ACA7]/30 flex-grow relative">
        {/* Action Icons */}
        <div className="absolute top-4 right-4 flex gap-3 text-gray-400 z-20">
          <IoEyeOutline size={20} className="cursor-pointer hover:text-gray-600" />
          <IoTrashOutline size={20} className="cursor-pointer hover:text-[#802018]" />
        </div>

        {/* Form Fields using your Input Component */}
        <div className="mt-4 space-y-4">
          <Input 
            label="EVENT TITLE" 
            type="text" 
            defaultValue={title} 
          />

          <Input 
            label="DATE" 
            type="text" 
            defaultValue={date} 
          />

          <div className="w-full">
            <label className="block font-semibold text-sm text-gray-700 mb-2 text-left uppercase">
              Description
            </label>
            <textarea 
              className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:border-[#800000] focus:outline-none transition-all bg-white min-h-[100px]"
              defaultValue={description}
            />
          </div>
        </div>

        {/* Add Photo Placeholder */}
        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-[240px] aspect-video border-2 border-dashed border-white bg-white/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/80 transition-all group">
            <div className="bg-blue-50 p-2 rounded-full mb-2 group-hover:bg-blue-100 transition-colors">
              <IoAddOutline size={24} className="text-blue-300" />
            </div>
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Add Photo</span>
            <span className="text-[8px] text-blue-200">Upload any supporting docs</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditSchoolEventCard