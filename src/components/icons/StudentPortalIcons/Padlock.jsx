import React from 'react'
import { TbLockPassword } from "react-icons/tb";

const Padlock = ({ className }) => {
  return (
    <TbLockPassword size={32} className={"text-[#a32a2a] " + className} />
  )
}

export default Padlock