import React from 'react'
import { FiRotateCcw } from "react-icons/fi";

const Rotate = ({ className }) => {
  return (
    <FiRotateCcw size={32} className={"text-[#a32a2a] " + className} />
  )
}

export default Rotate