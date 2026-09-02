import MainLayout from '../../layouts/Mainlayouts'
import RedLine from '../icons/RedLine'
import ProcedureCard from '../icons/StudentPortalIcons/ProcedureCard'
import OneIcon from '../icons/OneIcon'
import TwoIcon from '../icons/TwoIcon'
import ThreeIcon from '../icons/ThreeIcon'

const Kindergarten = () => {
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
         We look forward to welcoming your family to the NSGA campus! To ensure a smooth and quick enrolment process for your child, please follow the steps below.
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
              Proceed to the School Registrar’s Office. Parents or guardians will be provided with an official Admission Form. Our staff will conduct a brief initial assessment to determine your child's grade level placement.
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
                Please present the original and photocopies of the following documents:
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>2x2 ID Picture (2 copies, white background).</li>
                <li>PSA Birth Certificate (Original for verification).</li>
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
             Once your documents are verified, the Admission Officer will issue an Enrollment Slip. You may then proceed to the Cashier’s Window for the settlement of fees to officially secure your child’s slot.
            </p>
          </ProcedureCard>

        </div>

        {/* Footer Button */}
        <div className="mt-8">
          <button className="bg-[#a32a2a] text-white px-12 py-3.5 rounded-lg font-bold hover:bg-[#800000] transition-all shadow-md cursor-pointer">
            Download Admission Form
          </button>
        </div>
      </div>
    </MainLayout>
  )
}

export default Kindergarten