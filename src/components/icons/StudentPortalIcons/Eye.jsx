import { MdOutlineRemoveRedEye, MdOutlineVisibilityOff } from "react-icons/md";

const Eye = ({ visible }) => {
  return (
    visible 
      ? <MdOutlineRemoveRedEye size={24} className='text-gray-600' />
      : <MdOutlineVisibilityOff size={24} className='text-gray-600' />
  )
}

export default Eye