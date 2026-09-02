import MainLayout from '../../layouts/Mainlayouts'
import RedLine from '../icons/RedLine'
import ProcedureCard from '../icons/StudentPortalIcons/ProcedureCard'
import OneIcon from '../icons/OneIcon'
import TwoIcon from '../icons/TwoIcon'
import ThreeIcon from '../icons/ThreeIcon'

const ElemOnCampus = () => {
  return (
    <MainLayout>
      <div className="max-w-full md:max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-12">
        {/* Header Section */}
        <div className="flex items-center gap-3 mb-4">
          <RedLine />
          <h1 className="text-lg md:text-2xl font-semibold text-gray-800">
            Pre-Admission Procedure: On-Campus
          </h1>
        </div>
        
        <p className="text-[13px] md:text-[15px] text-gray-800 mb-6 md:mb-10 leading-relaxed">
          We look forward to welcoming your family to the NSGA campus! To ensure a smooth and quick enrolment process for your child, please follow the steps below.
        </p>

        {/* Procedures List */}
        <div className="flex flex-col gap-4 md:gap-5">
          
          {/* Step 1 */}
          <ProcedureCard>
            <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
              <OneIcon className="w-7 md:w-8 h-7 md:h-8" />
              <h2 className="text-base md:text-lg font-bold text-black">Registrar Check In</h2>
            </div>
            <p className="text-[13px] md:text-[15px] text-gray-800 leading-relaxed ml-10 md:ml-12">
              Proceed to the School Registrar’s Office. Parents or guardians will be provided with an official Admission Form. Our staff will conduct a brief initial assessment to determine your child's grade level placement.
            </p>
          </ProcedureCard>

          {/* Step 2 */}
          <ProcedureCard>
            <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
              <TwoIcon className="w-7 md:w-8 h-7 md:h-8" />
              <h2 className="text-base md:text-lg font-bold text-black">Submission of Requirements</h2>
            </div>
            <div className="text-[13px] md:text-[15px] text-gray-800 leading-relaxed ml-10 md:ml-12">
              <p className="mb-2">
                Please present the original and photocopies of the following documents:
              </p>
              <ul className="list-disc ml-4 md:ml-5 space-y-1">
                <li>PSA Birth Certificate (Original for verification).</li>
                <li>Latest Report Card (SF9) with Learner Reference Number (LRN).</li>
                <li>2x2 ID Picture (2 copies, white background).</li>
                <li>Kindergarten Certificate of Completion (For incoming Grade 1 students).</li>
                <li>Certificate of Good Moral Character (For transferees).</li>

              </ul>
            </div>
          </ProcedureCard>

          {/* Step 3 */}
          <ProcedureCard>
            <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-3">
              <ThreeIcon className="w-7 md:w-8 h-7 md:h-8" />
              <h2 className="text-base md:text-lg font-bold text-black">Verification</h2>
            </div>
            <p className="text-[13px] md:text-[15px] text-gray-800 leading-relaxed ml-10 md:ml-12">
                Proceed to the School Registrar’s Office to secure your admission form. Alternatively, you may download and print the form in advance to speed up your onsite processing.
                </p>
          </ProcedureCard>

        </div>

        {/* Footer Button */}
        <div className="mt-6 md:mt-8">
          <button className="w-full sm:w-auto bg-[#a32a2a] text-white px-6 md:px-12 py-2 md:py-3.5 rounded-lg font-bold hover:bg-[#800000] transition-all shadow-md cursor-pointer text-sm md:text-base">
            Download Admission Form
          </button>
        </div>
      </div>
    </MainLayout>
  )
}

export default ElemOnCampus