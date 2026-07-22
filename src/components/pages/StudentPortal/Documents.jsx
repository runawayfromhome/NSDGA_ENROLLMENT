import React from 'react';
import Sidebar from '../../Sidebar';
import Header from '../../Header';
import DocCard from '../../icons/StudentPortalIcons/DocCard';
import NotesCard from '../../icons/StudentPortalIcons/NotesCard';

// Icons
import { 
  HiOutlinePhotograph, 
  HiOutlineDocumentText, 
  HiOutlineIdentification, 
  HiOutlineShieldCheck, 
  HiOutlineInformationCircle, 
  HiOutlineQuestionMarkCircle, 
  HiOutlineMail, 
  HiOutlinePhone 
} from "react-icons/hi";

const Documents = () => {
  const docs = [
    { name: "2x2 Picture", icon: <HiOutlinePhotograph />, status: "Verified", date: "Oct 12, 2023", color: "text-green-600 bg-green-50" },
    { name: "Report Card (Form 138)", icon: <HiOutlineDocumentText />, status: "Under Review", date: "Jan 15, 2024", color: "text-blue-600 bg-blue-50" },
    { name: "Form 137", icon: <HiOutlineDocumentText />, status: "Not Uploaded", date: "—", color: "text-slate-400 bg-slate-50" },
    { name: "PSA Birth Certificate", icon: <HiOutlineIdentification />, status: "Verified", date: "Oct 12, 2023", color: "text-green-600 bg-green-50" },
    { name: "Good Moral Certificate", icon: <HiOutlineShieldCheck />, status: "Action Needed", date: "Feb 01, 2024", color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header title="My Documents" showSearch={false} />

        <main className="flex-1 overflow-y-auto bg-slate-50/30 p-12">
          <div className="max-w-6xl mx-auto">
            
            <div className="mb-8">
              <p className="text-slate-500 text-[15px]">
                Please upload clear scanned copies of the required documents for verification. Ensure files are in PDF or JPEG format.
              </p>
            </div>

            {/* Document Status Table */}
            <DocCard>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="text-left pb-6 px-4">Document Name</th>
                      <th className="text-center pb-6 px-4">Status</th>
                      <th className="text-center pb-6 px-4">Last Updated</th>
                      <th className="text-right pb-6 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {docs.map((doc, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-4">
                            <span className="text-slate-400 text-xl">{doc.icon}</span>
                            <span className="font-bold text-slate-800 text-[15px]">{doc.name}</span>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-center">
                          <span className={`inline-flex px-4 py-1.5 rounded-full text-[11px] font-bold items-center gap-1.5 ${doc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${doc.color.replace('text-', 'bg-').split(' ')[0]}`}></span>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-6 px-4 text-center">
                          <span className="text-[13px] text-slate-500 font-medium">{doc.date}</span>
                        </td>
                        <td className="py-6 px-4 text-right">
                          {doc.status === "Not Uploaded" || doc.status === "Action Needed" ? (
                            <button className="bg-[#800000] text-white px-7 py-2 rounded-lg text-[13px] font-bold hover:bg-[#600000] transition-all cursor-pointer shadow-lg shadow-red-900/10">
                              Upload
                            </button>
                          ) : (
                            <button className="text-[#800000] font-bold text-[13px] hover:underline cursor-pointer">
                              Update
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DocCard>

            {/* Guidelines & Help Section - Adjusted for Full Color */}
            <div className="grid grid-cols-2 gap-8 mt-10">
              <div className="bg-[#fdf2f2] rounded-2xl border border-red-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 text-[#800000] mb-6">
                  <HiOutlineInformationCircle size={24} />
                  <h3 className="font-bold text-[16px]">Submission Guidelines</h3>
                </div>
                <ul className="space-y-4 text-[13px] text-slate-600">
                  <li className="flex gap-3">
                    <span className="text-[#800000] font-bold">•</span>
                    <span>All scanned documents must be legible and in high resolution.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#800000] font-bold">•</span>
                    <span>Maximum file size for each document is 5MB.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#800000] font-bold">•</span>
                    <span>The Registrar's Office typically reviews documents within 3-5 working days.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#800000] font-bold">•</span>
                    <span>Ensure that PSA Birth Certificates show the registry number clearly.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#f0f7ff] rounded-2xl border border-blue-100 p-8 shadow-sm">
                <div className="flex items-center gap-3 text-[#004a99] mb-6">
                  <HiOutlineQuestionMarkCircle size={24} />
                  <h3 className="font-bold text-[16px]">Need Help?</h3>
                </div>
                <p className="text-[14px] text-slate-600 mb-8 leading-relaxed">
                  If you are experiencing issues with uploading your documents or have questions about the requirements, please contact the Registrar's Office.
                </p>
                <div className="space-y-4 text-[13px] text-slate-700">
                  <div className="flex items-center gap-3">
                    <HiOutlineMail className="text-blue-500" size={18} />
                    <span className="font-medium">registrar@nsdga.edu.ph</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HiOutlinePhone className="text-blue-500" size={18} />
                    <span className="font-medium">+63 (2) 8123-4567</span>
                  </div>
                </div>
              </div>
            </div>

            <footer className="mt-20 text-center">
              <p className="text-[11px] text-slate-400 font-medium">
                © 2024 Nuestra Señora de Guia Academy of Marikina. All rights reserved.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Documents;