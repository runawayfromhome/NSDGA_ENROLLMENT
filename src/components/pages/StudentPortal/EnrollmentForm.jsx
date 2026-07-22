import React, { useState } from 'react';
import Sidebar from '../../Sidebar';
import Input from '../../form/Input';

// Icons & Components
import UploadCard from "../../icons/StudentPortalIcons/UploadCard";
import PersonIcon from '../../icons/StudentPortalIcons/PersonIcon';
import FileIcon from '../../icons/StudentPortalIcons/FileIcon';
import { FaGraduationCap as AcadIcon } from "react-icons/fa"; 
import { PiCertificate as Certificate } from "react-icons/pi"; 
import { HiOutlineBadgeCheck as BadgeIcon } from "react-icons/hi"; 
import { IoMdAddCircleOutline as AddIcon } from "react-icons/io"; 
import { LuShieldCheck } from "react-icons/lu"; 

const EnrollmentForm = () => {
  const [educationLevel, setEducationLevel] = useState("");

  const getGradeOptions = () => {
    if (educationLevel === 'Senior High School') {
      return ['Grade 11', 'Grade 12'];
    }
    return ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      
      <div className="flex-1 ml-0 lg:ml-64 px-4 md:px-8 py-6 md:py-10 overflow-y-auto">
        <div className="max-w-full md:max-w-[1200px] mx-auto">
          
          <header className="mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-black text-[#2D3748] uppercase tracking-tight">Student Enrollment Form</h1>
            <p className="text-[13px] md:text-[15px] text-gray-500 mt-1">
              Please fill out all required fields marked with an asterisk (<span className="text-[#800000]">*</span>) to process your registration.
            </p>
          </header>

          <form className="space-y-8 md:space-y-10">
            {/* 1. Personal Information */}
            <section>
              <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-gray-200 pb-2">
                <PersonIcon size={16} className="text-[#800000]" />
                <h2 className="font-bold text-[#2D3748] text-xs md:text-sm uppercase tracking-wide">Personal Information <span className="text-[#800000]">*</span></h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-6 gap-y-4 md:gap-y-6">
                <Input label="FIRST NAME *" placeholder="Enter first name" />
                <Input label="MIDDLE NAME" placeholder="Enter middle name" />
                <Input label="LAST NAME *" placeholder="Enter last name" />
                <Input label="LRN (12-DIGIT) *" placeholder="000000000000" />
                <SelectGroup label="SEX *" options={['Male', 'Female']} placeholder="Select Sex" />
                <Input label="AGE *" placeholder="0" type="number" />
                <Input label="DATE OF BIRTH *" placeholder="mm/dd/yyyy" type="text" />
                <div className="col-span-1 sm:col-span-2">
                  <Input label="BIRTHPLACE *" placeholder="City, Province" />
                </div>
                <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                  <Input label="HOME ADDRESS *" placeholder="House No., Street, Brgy, City, Province" />
                </div>
                
                <Input label="CONTACT NUMBER *" placeholder="09XX-XXX-XXXX" />
                
                <SelectGroup 
                  label="EDUCATION LEVEL *" 
                  options={['Junior High School', 'Senior High School']} 
                  placeholder="Select Level" 
                  onChange={(val) => setEducationLevel(val)}
                />

                <SelectGroup 
                  label="GRADE LEVEL APPLYING FOR *" 
                  options={getGradeOptions()} 
                  placeholder="Select Grade" 
                />

                <Input label="SCHOOL YEAR *" placeholder="2024-2025" defaultValue="2024-2025" />
                <SelectGroup label="STUDENT TYPE *" options={['New Student', 'Transferee', 'Returnee']} placeholder="Select Type" />
                
                {educationLevel === 'Senior High School' && (
                  <SelectGroup 
                    label="PREFERRED STRAND *" 
                    options={['Business and Entrepreneurship', 'Science, Technology, Engineering, and Mathematics', 'Arts, Social Sciences, and Humanities', 'TECHPRO', 'Hospitality and Tourism', 'Industrial Technologies', 'Computer Programming']} 
                    placeholder="Select Strand" 
                  />
                )}
              </div>
            </section>

            {/* 2. Academic Background */}
            <section>
              <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-gray-200 pb-2">
                <AcadIcon size={16} className="text-[#800000]" />
                <h2 className="font-bold text-[#2D3748] text-xs md:text-sm uppercase tracking-wide">Academic Background <span className="text-[#800000]">*</span></h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 md:gap-x-6 gap-y-4 md:gap-y-6">
                <Input label="PREVIOUS SCHOOL ATTENDED *" placeholder="Enter school name" />
                <Input label="GWA (GENERAL WEIGHTED AVERAGE) *" placeholder="e.g. 92.5" />
                <div className="col-span-1">
                  <Input label="LAST GRADE/YEAR LEVEL COMPLETED *" placeholder="e.g. Grade 12" />
                </div>
              </div>
            </section>

            {/* 3. Document Requirements */}
            <section>
              <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-gray-200 pb-2">
                <FileIcon size={16} className="text-[#800000]" />
                <h2 className="font-bold text-[#2D3748] text-xs md:text-sm uppercase tracking-wide">Document Requirements <span className="text-[#800000]">*</span></h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                <UploadCard icon={<PersonIcon size={24} className="text-slate-400" />} title="2x2 Picture *" subtitle="High-quality, white background" />
                <UploadCard icon={<FileIcon size={24} className="text-slate-400" />} title="Report Card *" subtitle="Scanned copy of latest grades" />
                <UploadCard icon={<AcadIcon size={24} className="text-slate-400" />} title="Form 137" subtitle="Official Student Permanent Record" />
                <UploadCard icon={<Certificate size={24} className="text-slate-400" />} title="PSA Birth Certificate *" subtitle="Clear copy from PSA" />
                <UploadCard icon={<BadgeIcon size={24} className="text-slate-400" />} title="Good Moral Cert *" subtitle="From previous school principal" />
                <UploadCard icon={<AddIcon size={24} className="text-blue-400" />} title="Additional Documents" subtitle="Upload any supporting docs" isBlue />
              </div>
            </section>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4 pt-6 md:pt-8 border-t border-gray-100">
               <div className="flex items-center mr-0 sm:mr-auto gap-2 w-full sm:w-auto">
                  <input type="checkbox" id="terms" className="w-4 h-4 rounded border-gray-300 text-[#801a1a] focus:ring-[#801a1a] cursor-pointer" />
                  <label htmlFor="terms" className="text-[10px] md:text-[11px] text-gray-500 cursor-pointer">
                    I have read and agree to the <span onMouseDown={(e)=>e.preventDefault()} onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); document.getElementById('terms_modal').showModal(); }} className="text-red-700 underline font-semibold hover:text-red-900 transition-colors cursor-pointer">Terms of Service</span> and <span onMouseDown={(e)=>e.preventDefault()} onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); document.getElementById('privacy_modal').showModal(); }} className="text-red-700 underline font-semibold hover:text-red-900 transition-colors cursor-pointer">Privacy Policy</span> of NSDGA. <span className="text-[#800000]">*</span>
                  </label>
               </div>
               <button type="button" className="w-full sm:w-auto px-6 md:px-10 py-2 md:py-3 border border-gray-300 rounded-xl text-xs md:text-sm font-bold text-slate-700 hover:bg-gray-50 transition-all cursor-pointer">
                 Save Draft
               </button>
               <button type="submit" className="w-full sm:w-auto px-6 md:px-10 py-2 md:py-3 bg-[#801a1a] text-white rounded-xl shadow-lg shadow-red-900/20 text-xs md:text-sm font-bold hover:bg-[#601010] transition-all cursor-pointer">
                 Submit Enrollment
               </button>
            </div>
          </form>

          {/* TERMS OF SERVICE MODAL */}
          <dialog id="terms_modal" className="modal backdrop:backdrop-blur-sm">
            <div className="modal-box max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl p-0 overflow-hidden bg-white rounded-2xl shadow-2xl">
              <div className="p-4 md:p-6 border-b border-gray-100 relative">
                <form method="dialog">
                  <button className="absolute right-4 md:right-6 top-4 md:top-6 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-xl">✕</button>
                </form>
                <div className="flex items-center gap-2 mb-2">
                  <LuShieldCheck className="text-[#800000]" size={20} />
                  <span className="text-[10px] md:text-[12px] font-bold text-gray-400 uppercase tracking-widest">Legal Document</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-[#800000] uppercase tracking-tighter italic">Terms of Service</h3>
              </div>

              <div className="p-6 md:p-10 overflow-y-auto max-h-[60vh] md:max-h-[70vh] space-y-8 md:space-y-10">
                <ModalSection num="1" title="Binding Agreement" text="By using the NSDGA Online Enrollment System, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. These terms constitute a legally binding agreement between you and Nuestra Señora De Guia Academy of Marikina. Accessing or using our digital services signifies your full acceptance of these conditions." />
                <ModalSection num="2" title="Eligibility for Enrollment" text="Enrollment is subject to the submission of valid documentary requirements and the successful completion of the academy's assessment process. The institution reserves the right to deny admission based on internal academic and conduct standards. Applicants must provide accurate, current, and complete information as prompted by the enrollment forms." />
                <ModalSection num="3" title="Account Security" text="Users are responsible for maintaining the confidentiality of their portal credentials. Any activity occurring under your account is your sole responsibility. Notify the IT Department immediately of any unauthorized access or breach of security. The Academy will not be liable for any loss or damage arising from your failure to comply with this security obligation." />
                <ModalSection num="4" title="Fees and Payments" text="All tuition and miscellaneous fees must be settled according to the chosen payment plan. Enrollment is only considered official once the initial payment is verified. Refunds are governed by the DepEd guidelines and school policy. Late payments may result in the temporary suspension of access to student portals and digital academic resources." />
                <ModalSection num="5" title="Code of Conduct (Digital)" text="Users shall not use the online platform to upload malicious software, harvest data, or attempt to circumvent security protocols. Any violation may result in the suspension of access and disciplinary action. All digital communications within the platform should maintain a professional and respectful tone consistent with the Academy's core values." />
                <ModalSection num="6" title="Intellectual Property" text="All curriculum materials, logos, and digital assets found within the portal are the exclusive intellectual property of Nuestra Señora De Guia Academy. Unauthorized reproduction, distribution, or commercial exploitation is strictly prohibited and may be subject to legal action under copyright and intellectual property laws of the Philippines." />
                <ModalSection num="7" title="Data Privacy Integration" text="Our collection and use of personal data are governed by our Privacy Policy. By accepting these Terms, you also consent to our data processing practices as outlined in the Data Privacy Act of 2012. We take all reasonable measures to protect the integrity and confidentiality of the student and guardian information stored in our databases." />
                <ModalSection num="8" title="System Maintenance" text="The Academy reserves the right to perform scheduled and unscheduled maintenance on the enrollment portal. While we strive for 100% uptime, there may be periods where the service is unavailable. We are not liable for any delays in the enrollment process resulting from system downtime or internet connectivity issues on the user's end." />
                <ModalSection num="9" title="Governing Law" text="These terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any legal disputes arising from these terms or the use of the platform shall be settled exclusively within the jurisdiction of the competent courts of Marikina City." />
              </div>

              <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 pl-0 sm:pl-4">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] md:text-[12px] text-gray-500 font-semibold italic">Last Updated: October 2024</span>
                </div>
                <div className="modal-action m-0">
                  <form method="dialog">
                    <button className="px-6 md:px-10 py-2 md:py-3 bg-[#800000] text-white text-xs md:text-sm font-bold rounded-xl hover:bg-[#600000] transition-all tracking-tight cursor-pointer shadow-lg shadow-red-900/10">I Accept</button>
                  </form>
                </div>  
              </div>
            </div>
          </dialog>

          {/* PRIVACY POLICY MODAL */}
          <dialog id="privacy_modal" className="modal backdrop:backdrop-blur-sm">
            <div className="modal-box max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl p-0 overflow-hidden bg-white rounded-2xl shadow-2xl">
              <div className="p-4 md:p-6 border-b border-gray-100 relative">
                <form method="dialog">
                  <button className="absolute right-4 md:right-6 top-4 md:top-6 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer text-xl">✕</button>
                </form>
                <div className="flex items-center gap-2 mb-2">
                  <LuShieldCheck className="text-[#800000]" size={20} />
                  <span className="text-[10px] md:text-[12px] font-bold text-gray-400 uppercase tracking-widest">Legal Document</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-[#800000] uppercase tracking-tighter italic">Privacy Policy</h3>
              </div>

              <div className="p-6 md:p-10 overflow-y-auto max-h-[60vh] md:max-h-[70vh] space-y-6 md:space-y-8">
                <p className="text-sm text-slate-600 leading-relaxed italic border-l-4 border-slate-100 pl-4">
                  Nuestra Señora de Guia Academy of Marikina is committed to protecting the privacy rights of its students, parents, and personnel in accordance with Republic Act No. 10173, also known as the Data Privacy Act of 2012.
                </p>

                <ModalSection 
                  num="1" 
                  title="Information Collection" 
                  text="We collect personal and sensitive information during the enrollment process, including names, birthdates, addresses, academic history, and medical records. This data is essential for academic administration and student safety." 
                 
                />
                <ModalSection 
                  num="2" 
                  title="Use of Information" 
                  text="Collected data is used exclusively for legitimate educational purposes, processing of school fees, emergency notifications, and compliance with Department of Education (DepEd) requirements." 
                 
                />
                <ModalSection 
                  num="3" 
                  title="Data Sharing" 
                  text="We do not sell or trade your personal data. Sharing only occurs with authorized regulatory bodies or third-party service providers who assist in school operations, under strict confidentiality agreements." 
                 
                />
                <ModalSection 
                  num="4" 
                  title="Security Measures" 
                  text="We implement technical and organizational security measures to protect your information against unauthorized access, modification, or disclosure." 
                 
                />
                <ModalSection 
                  num="5" 
                  title="Retention and Disposal" 
                  text="Personal records are retained for the duration required by law. Once no longer needed, data is disposed of through secure methods that prevent reconstruction." 
                 
                />
                <ModalSection 
                  num="6" 
                  title="Your Rights" 
                  text="Data subjects have the right to access, correct, or object to the processing of their personal data. Requests can be submitted to our Data Protection Officer." 
                  
                />
              </div>

              <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2 pl-0 sm:pl-4">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] md:text-[12px] text-gray-500 font-semibold italic">Last Updated: October 2024</span>
                </div>
                <div className="modal-action m-0">
                  <form method="dialog">
                    <button className="px-6 md:px-10 py-2 md:py-3 bg-[#800000] text-white text-xs md:text-sm font-bold rounded-xl hover:bg-[#600000] transition-all tracking-tight cursor-pointer shadow-lg shadow-red-900/10">I Understand</button>
                  </form>
                </div>
              </div>
            </div>
          </dialog>
          
          <p className="text-center text-[10px] text-gray-400 mt-16 tracking-wide">
            © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

const ModalSection = ({ num, title, text }) => (
  <div className="flex gap-6">
    <div className="flex-shrink-0 w-10 h-10 bg-[#fdf2f2] text-[#800000] rounded-lg flex items-center justify-center font-bold text-lg border border-[#fee2e2]">
      {num}
    </div>
    <div className="space-y-2">
      <h4 className="font-bold text-slate-800 text-base tracking-tight">{title}</h4>
      <p className="text-sm text-slate-500 leading-relaxed text-justify">{text}</p>
    </div>
  </div>
);

const SelectGroup = ({ label, options, placeholder, onChange }) => {
  const [selected, setSelected] = React.useState("");
  return (
    <div className="w-full">
      {label && (
        <label className="block font-semibold text-sm text-gray-700 mb-2 text-left uppercase cursor-default">
          {label.includes('*') ? (<>{label.replace('*', '')}<span className="text-[#800000]">*</span></>) : label}
        </label>
      )}
      <div className="dropdown w-full">
        <div tabIndex={0} role="button" className="flex items-center justify-between w-full h-12 bg-white border border-gray-200 px-4 rounded-xl text-sm font-medium text-slate-600 hover:border-[#800000] transition-all cursor-pointer">
          {selected || placeholder}
          <span className="text-[10px] text-gray-400">▼</span>
        </div>
        <ul tabIndex={0} className="dropdown-content menu bg-white text-black rounded-xl z-[10] mt-1 w-full p-2 shadow-xl border border-gray-100">
          {options.map((opt) => (
            <li key={opt} className="hover:text-[#800000]">
              <button type="button" className="hover:bg-gray-50 active:bg-transparent text-sm py-2 px-4 w-full text-left rounded-lg transition-colors cursor-pointer"
                onClick={() => {
                  setSelected(opt);
                  if (onChange) onChange(opt);
                  document.activeElement.blur(); 
                }}>
                {opt}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EnrollmentForm;