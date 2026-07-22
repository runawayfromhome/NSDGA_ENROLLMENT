import React from 'react'
import { MdOutlinePerson } from "react-icons/md";

const PersonIcon = ({ className, color, size = 32 }) => {
  return (
    <MdOutlinePerson 
      size={size} 
      color={color} // Removing the hardcoded default here allows className to work
      className={className}
    />
  )
}

export default PersonIcon