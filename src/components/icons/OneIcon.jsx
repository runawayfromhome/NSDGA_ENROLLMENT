import React from 'react'
import { TbCircleNumber1Filled } from "react-icons/tb";

const OneIcon = ({ className }) => {
  return (
    <TbCircleNumber1Filled 
      className={`text-[#a32a2a] ${className}`} 
      size={32} 
    />
  )
}

export default OneIcon