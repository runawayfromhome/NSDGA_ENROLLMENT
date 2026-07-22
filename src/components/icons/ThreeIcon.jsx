import React from 'react'
import { TbCircleNumber3Filled } from "react-icons/tb";

const ThreeIcon = ({ className }) => {
  return (
    <TbCircleNumber3Filled 
      className={`text-[#a32a2a] ${className}`} 
      size={32} 
    />
  )
}

export default ThreeIcon