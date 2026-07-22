import React from 'react'
import { IoCameraOutline } from "react-icons/io5";
import Input from '../../form/Input'; // Adjust path as needed

const EditExecutiveBoardCard = ({ name, position }) => {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
      {/* Upload Photo Placeholder */}
      <div className="w-full aspect-[16/6] bg-gray-50 border-2 border-dashed border-[#F9ACA7] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors group">
        <IoCameraOutline size={32} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Upload Photo</span>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <Input 
          label="NAME" 
          type="text" 
          defaultValue={name} 
        />
        <Input 
          label="POSITION" 
          type="text" 
          defaultValue={position}
          // The screenshot shows position text in a dark red color
          className="text-[#802018]" 
        />
      </div>
    </div>
  )
}

export default EditExecutiveBoardCard