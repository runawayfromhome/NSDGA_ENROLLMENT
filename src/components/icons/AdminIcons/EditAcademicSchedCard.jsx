import { IoTrashOutline, IoMenuOutline } from "react-icons/io5";
import Input from '../../form/Input'; // Adjust path as needed

const EditAcademicSchedCard = ({ eventName, dateRange }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center p-4 relative overflow-hidden group">
      {/* Left Accent Border */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#800000]" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow ml-4 mr-4">
        <Input 
          label="EVENT NAME" 
          type="text" 
          defaultValue={eventName} 
        />
        <Input 
          label="DATE RANGE" 
          type="text" 
          defaultValue={dateRange} 
        />
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-3 text-gray-400 ml-2">
        <IoTrashOutline size={20} className="cursor-pointer hover:text-[#800000] transition-colors" />
        <IoMenuOutline size={22} className="cursor-pointer hover:text-gray-600 transition-colors" />
      </div>
    </div>
  )
}

export default EditAcademicSchedCard