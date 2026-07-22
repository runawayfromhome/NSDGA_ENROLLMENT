import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RegistrarSidebar from '../../RegistrarSidebar';
import Header from '../../Header';
import { IoChevronBack } from "react-icons/io5";
import { LuFileText, LuRotateCcw, LuCheck } from "react-icons/lu";

// Custom Card Imports
import PersonalInfoCard from '../../icons/PersonalInfoCard';
import AcadsBackgroundCard from '../../icons/AcadsBackgroundCard';
import UploadedDocsCard from '../../icons/RegistrarIcons/UploadedDocsCard';
import AdditionalNotesCard from '../../icons/AdditionalNotesCard';

// Modal Imports
import TwoxTwoModalCard from '../../icons/TwoxTwoModalCard';
import PSAModalCard from '../../icons/PSAModalCard';
import ReportCardModal from '../../icons/ReportCardModal';
import GoodMoralModal from '../../icons/GoodMoralModal';
import Form137Modal from '../../icons/Form137Modal';

const ApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <style>{`
        html { overflow-y: scroll; }
        .modal-open { padding-right: 0px !important; }
      `}</style>

      <RegistrarSidebar />
      
      <div className="flex-1 ml-0 lg:ml-64 flex flex-col">
        <Header showSearch={true} />

        <main className="p-12 max-w-[1200px] mx-auto w-full space-y-8">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <IoChevronBack size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Sean Andrei Amurao</h1>
                <p className="text-slate-500 font-medium">APP-2026-0002 • Incoming Grade 9</p>
              </div>
            </div>
            <button className="bg-[#800000] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#600000] transition-colors shadow-lg cursor-pointer">
              Approve Admission
            </button>
          </div>

          <PersonalInfoCard>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-6">Personal Information</h2>
            <div className="grid grid-cols-3 gap-6">
              <DetailField label="First Name" value="Sean Andrei" />
              <DetailField label="Middle Name" value="N/A" />
              <DetailField label="Last Name" value="Amurao" />
              <DetailField label="LRN (12-digit)" value="136678090147" />
              <DetailField label="Sex" value="Male" />
              <DetailField label="Age" value="15" />
              <DetailField label="Date of Birth" value="04/16/2002" />
              <DetailField label="Birthplace" value="Marikina City" />
            </div>
            <div className="mt-6">
              <DetailField label="Home Address" value="123 Juan Dela Cruz St., Sta Elena Marikina City" />
            </div>
            <div className="grid grid-cols-3 gap-6 mt-6">
              <DetailField label="Contact Number" value="0912 345 6789" />
              <DetailField label="Education Level" value="Junior High School" />
              <DetailField label="Grade Level Applying For" value="Grade 9" />
              <DetailField label="School Year" value="2024-2025" />
              <DetailField label="Student Type" value="New Student" />
            </div>
          </PersonalInfoCard>

          <AcadsBackgroundCard>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-6">Academic Background</h2>
            <div className="grid grid-cols-2 gap-6">
              <DetailField label="Previous School Attended" value="Biringan National High School" />
              <DetailField label="GWA (General Weighted Average)" value="92" />
              <DetailField label="Last Grade/Year Level Completed" value="Grade 8" />
            </div>
          </AcadsBackgroundCard>

          <UploadedDocsCard>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-6">Uploaded Documents</h2>
            <div className="space-y-3">
              <DocumentRow label="2x2 Picture" status="VERIFIED" modalId="two_by_two_modal" />
              <DocumentRow label="PSA Birth Certificate" status="ACTION NEEDED" modalId="psa_modal" />
              <DocumentRow label="Report Card/Form 138" status="VERIFIED" modalId="report_card_modal" />
              <DocumentRow label="Good Moral Certificate" status="PENDING" modalId="good_moral_modal" />
              <DocumentRow label="Form 137" status="PENDING" modalId="form_137_modal" />
            </div>
          </UploadedDocsCard>

          <AdditionalNotesCard>
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] mb-6">Additional Notes for Student</h2>
            <textarea 
              placeholder="Enter feedback or requested corrections here..."
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#800000]/10 text-sm italic"
            />
            <p className="text-[11px] text-slate-400 mt-2">ⓘ Student will be notified immediately upon submission.</p>
            <div className="flex justify-end mt-6">
              <button className="bg-[#800000] text-white px-10 py-4 rounded-xl font-bold hover:bg-[#600000] transition-colors shadow-md cursor-pointer">
                COMPLETE & NOTIFY STUDENT
              </button>
            </div>
          </AdditionalNotesCard>
        </main>
      </div>

      {/* Modals Container */}
      <TwoxTwoModalCard />
      <PSAModalCard />
      <ReportCardModal />
      <GoodMoralModal />
      <Form137Modal />
    </div>
  );
};

const DetailField = ({ label, value }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{label}</label>
    <div className="w-full p-3 bg-[#F1F5F9] border border-slate-200 rounded-lg text-slate-700 text-sm font-medium">{value}</div>
  </div>
);

const DocumentRow = ({ label, status, modalId }) => {
  const colors = {
    'VERIFIED': 'bg-emerald-50 text-emerald-600',
    'ACTION NEEDED': 'bg-red-50 text-red-600',
    'PENDING': 'bg-blue-50 text-blue-600'
  };

  const openModal = () => document.getElementById(modalId).showModal();

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">📄</div>
        <span className="text-sm font-bold text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black tracking-tight ${colors[status]}`}>{status}</span>
        <div className="flex gap-2">
          <button onClick={openModal} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black transition-colors cursor-pointer">VIEW</button>
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black transition-colors cursor-pointer">APPROVE</button>
          <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black transition-colors cursor-pointer">CORRECT</button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;