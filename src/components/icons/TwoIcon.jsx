import React from 'react'
import { TbCircleNumber2Filled } from "react-icons/tb";

const TwoIcon = ({ className }) => {
  return (
    <TbCircleNumber2Filled 
      className={`text-[#a32a2a] ${className}`} 
      size={32} 
    />
  )
}

export default TwoIcon