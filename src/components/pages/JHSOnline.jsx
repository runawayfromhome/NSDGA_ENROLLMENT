import React from 'react'
import { NavLink } from 'react-router-dom'
import MainLayout from '../../layouts/Mainlayouts'
import RedLine from '../icons/RedLine'
import ProcedureCard from '../icons/StudentPortalIcons/ProcedureCard'
import OneIcon from '../icons/OneIcon'
import TwoIcon from '../icons/TwoIcon'
import ThreeIcon from '../icons/ThreeIcon'

const JHSOnline = () => {
  return (
    <MainLayout>
      <div className="max-w-full md:max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-4">
          <RedLine />
          <h1 className="text-2xl font-semibold text-gray-800">
            Online Pre-Admission Procedure
          </h1>
        </div>
        
        <p className="text-[15px] text-gray-800 mb-10 leading-relaxed">
          Skip the line and start your journey with NSDGA Marikina through our digital portal. 
          Please ensure you have digital copies (clear photos or PDF scans) of your documents 
          ready before beginning.
        </p>

        {/* Procedures List */}
        <div className="flex flex-col gap-5">
          
          {/* Step 1 */}
          <ProcedureCard>
            <div className="flex items-center gap-4 mb-3">
              <OneIcon className="w-8 h-8" />
              <h2 className="text-lg font-bold text-black">Account Creation</h2>
            </div>
            <p className="text-[15px] text-gray-800 leading-relaxed ml-12">
              Register an account on our Online Enrollment Portal. Ensure you use an active email 
              address, as your application status and login credentials will be sent there.
            </p>
          </ProcedureCard>

          {/* Step 2 */}
          <ProcedureCard>
            <div className="flex items-center gap-4 mb-3">
              <TwoIcon className="w-8 h-8" />
              <h2 className="text-lg font-bold text-black">Submission of Requirements</h2>
            </div>
            <div className="text-[15px] text-gray-800 leading-relaxed ml-12">
              <p className="mb-2">
                Upload a high-resolution 2×2 ID picture (taken against a white background) and the 
                specific academic requirements for your level:
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Incoming Grade 7 students: Clear Copy of PSA, Original Grade 6 Report Card and Good Moral</li>
                <li>Transferees: Clear Copy of PSA, Original Report Card and Good Moral</li>
              </ul>
            </div>
          </ProcedureCard>

          {/* Step 3 */}
          <ProcedureCard>
            <div className="flex items-center gap-4 mb-3">
              <ThreeIcon className="w-8 h-8" />
              <h2 className="text-lg font-bold text-black">Verification</h2>
            </div>
            <p className="text-[15px] text-gray-800 leading-relaxed ml-12">
              Once submitted, our Admissions Team will review your documents. You will receive a 
              notification via email or through your portal dashboard within 2-3 working days 
              regarding your qualification and the next steps for payment.
            </p>
          </ProcedureCard>

        </div>

        {/* Footer Button */}
        <div className="mt-8">
          <NavLink to={`/StudentPortal/Apply?level=${encodeURIComponent('Junior High School')}`} className="inline-block bg-[#a32a2a] text-white px-12 py-3.5 rounded-lg font-bold hover:bg-[#800000] transition-all shadow-md cursor-pointer">
            Apply Now!
          </NavLink>
        </div>
      </div>
    </MainLayout>
  )
}

export default JHSOnline