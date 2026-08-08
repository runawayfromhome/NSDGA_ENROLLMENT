import React from 'react'
import EditContactUsCard from '../../icons/AdminIcons/EditContactUsCard'
import Input from '../../form/Input'

const EditContactUs = () => {
  return (
    <div className="min-h-screen bg-[#E5E7EB] py-12 px-4 md:px-20">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Edit Contact Information</h1>
        <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
          Update the official contact details for various departments. These updates sync across the student and visitor portals.
        </p>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Row: Registrar and Finance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditContactCard>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-[#800000]" />
              <h3 className="text-xl font-bold text-gray-800">Registrar's Office</h3>
            </div>
            
            <div className="space-y-4">
              <Input 
                label="EMAIL" 
                type="email" 
                defaultValue="registrar@nsdgamarikina.edu.ph" 
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="MOBILE NUMBER" 
                  type="text" 
                  defaultValue="+63 912 345 6789" 
                />
                <Input 
                  label="LANDLINE" 
                  type="text" 
                  defaultValue="(02) 8123 4567" 
                />
              </div>
            </div>
          </EditContactCard>

          <EditContactCard>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-[#800000]" />
              <h3 className="text-xl font-bold text-gray-800">Finance & Accounting</h3>
            </div>
            
            <div className="space-y-4">
              <Input 
                label="EMAIL" 
                type="email" 
                defaultValue="registrar@nsdgamarikina.edu.ph" 
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="MOBILE NUMBER" 
                  type="text" 
                  defaultValue="+63 912 345 6789" 
                />
                <Input 
                  label="LANDLINE" 
                  type="text" 
                  defaultValue="(02) 8123 4567" 
                />
              </div>
            </div>
          </EditContactCard>
        </div>

        {/* Middle Row: Tech Support and Campus Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditContactCard>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-[#800000]" />
              <h3 className="text-xl font-bold text-gray-800">Technical Support</h3>
            </div>
            <Input 
              label="EMAIL" 
              type="email" 
              defaultValue="registrar@nsdgamarikina.edu.ph" 
            />
          </EditContactCard>

          <EditContactCard>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-6 bg-[#800000]" />
              <h3 className="text-xl font-bold text-gray-800">Campus Details</h3>
            </div>
            <label className="block font-semibold text-sm text-gray-700 mb-2">OFFICE HOURS</label>
            <textarea 
              className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:border-[#800000] focus:outline-none transition-all bg-white min-h-[100px]"
              defaultValue={`Mon - Fri: 8:00 AM - 5:00 PM\nSat: 8:00 AM - 12:00 PM`}
            />
          </EditContactCard>
        </div>

        {/* Bottom Row: Social Media */}
        <EditContactCard>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 bg-[#800000]" />
            <h3 className="text-xl font-bold text-gray-800">Social Media</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="space-y-4">
              <Input 
                label="PLATFORM" 
                type="text" 
                defaultValue="Nuestra Senora De Guia Academy of Marikina - Main" 
              />
              <Input 
                label="URL" 
                type="text" 
                defaultValue="https://facebook.com/nsdgamarikina.main" 
              />
            </div>
            <div className="space-y-4">
              <Input 
                label="PLATFORM" 
                type="text" 
                defaultValue="Nuestra Senora De Guia Academy of Marikina - SHS" 
              />
              <Input 
                label="URL" 
                type="text" 
                defaultValue="https://facebook.com/nsdgamarikina.shs" 
              />
            </div>
          </div>
        </EditContactCard>

        {/* Footer Action Buttons */}
        <div className="flex justify-center gap-4 pt-10">
          <button className="px-12 py-3 bg-[#6B7280] text-white rounded-xl font-bold hover:bg-gray-600 transition-all shadow-md cursor-pointer">
            Cancel
          </button>
          <button className="px-12 py-3 bg-[#802018] text-white rounded-xl font-bold hover:bg-[#601812] transition-all shadow-md cursor-pointer">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditContactUs