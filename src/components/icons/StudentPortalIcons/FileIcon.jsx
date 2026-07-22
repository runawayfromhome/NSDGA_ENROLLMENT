import React from 'react'
import { FaFileAlt } from "react-icons/fa";

const FileIcon = ({ size = 32, color, ...props }) => {
  return (
    <FaFileAlt 
      size={size} 
      color={color} 
      {...props} 
    />
  )
}

export default FileIcon