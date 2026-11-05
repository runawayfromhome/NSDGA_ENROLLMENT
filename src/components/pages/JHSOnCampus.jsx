import MainLayout from '../../layouts/Mainlayouts'
import RedLine from '../icons/RedLine'
import ProcedureCard from '../icons/StudentPortalIcons/ProcedureCard'
import OneIcon from '../icons/OneIcon'
import TwoIcon from '../icons/TwoIcon'
import ThreeIcon from '../icons/ThreeIcon'

const JHSOnCampus = () => {
  return (
    <MainLayout>
      <div className="max-w-full md:max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-4">
          <RedLine />
          <h1 className="text-2xl font-semibold text-gray-800">
            Pre-Admission Procedure: On-Campus
          </h1>
        </div>
        
        <p className="text-[15px] text-gray-800 mb-10 leading-relaxed">
          Welcome to the NSGA admission process. Please follow these steps to begin your enrollment:
        </p>

        {/* Procedures List */}
        <div className="flex flex-col gap-5">
          
          {/* Step 1 */}
          <ProcedureCard>
            <div className="flex items-center gap-4 mb-3">
              <OneIcon className="w-8 h-8" />
              <h2 className="text-lg font-bold text-black">Registrar Check In</h2>
            </div>
            <p className="text-[15px] text-gray-800 leading-relaxed ml-12">
              Proceed to the School Registrar’s Office to secure your admission form. Alternatively, you may download and print the form in advance to speed up your onsite processing.
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
                Submit a 2x2 ID picture (white background) along with the following documents as applicable:
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
            Wait for the admission officer to verify your documents before proceeding to the next window.            </p>
          </ProcedureCard>

        </div>

        {/* Footer Button */}
        <div className="mt-8">
          <a href="/Enrolment-Application-Form.pdf" download="Enrolment-Application-Form.pdf" className="inline-block bg-[#a32a2a] text-white px-12 py-3.5 rounded-lg font-bold hover:bg-[#800000] transition-all shadow-md cursor-pointer">
            Download Admission Form
          </a>
        </div>
      </div>
    </MainLayout>
  )
}

export default JHSOnCampus