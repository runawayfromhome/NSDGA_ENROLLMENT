import React from 'react'
import { IoClose, IoSchool } from "react-icons/io5";
import { DEFAULT_CONTACT } from '../../lib/content';

const ContactUsModal = ({ isOpen, onClose, contact }) => {
  if (!isOpen) return null;
  const c = contact || DEFAULT_CONTACT;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row shadow-2xl relative animate-in fade-in zoom-in duration-300">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-100 p-2 rounded-xl hover:bg-gray-200 transition-colors z-10"
        >
          <IoClose size={24} className="text-gray-600" />
        </button>

        {/* Left Side: Dark Panel */}
        <div className="bg-[#802018] text-white p-8 md:p-12 md:w-1/3 flex flex-col">
          <IoSchool size={40} className="mb-6" />
          <h2 className="text-3xl font-bold mb-4">Contact Information</h2>
          <p className="text-sm opacity-80 mb-12 leading-relaxed">
            We are here to assist with your academic journey. Reach out to the specific department for your concerns.
          </p>

          <div className="mt-auto space-y-8">
            <div>
              <h6 className="text-[10px] font-black tracking-[0.2em] uppercase opacity-70 mb-3">Social Media</h6>
              <div className="text-[11px] space-y-2 opacity-90">
                {c.facebookUrl && <a href={c.facebookUrl} target="_blank" rel="noreferrer" className="underline break-all">{c.facebookUrl}</a>}
              </div>
            </div>

            <div>
              <h6 className="text-[10px] font-black tracking-[0.2em] uppercase opacity-70 mb-3">Office Hours</h6>
              <div className="text-[11px] space-y-1 opacity-90">
                {String(c.officeHours || '').split('\n').map((line, i) => <p key={i}>{line}</p>)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="p-8 md:p-12 md:w-2/3 space-y-10">
          <Dept title="Registrar’s Office" email={c.registrar?.email} mobile={c.registrar?.mobile} landline={c.registrar?.landline} />
          <Dept title="Finance & Accounting" email={c.finance?.email} mobile={c.finance?.mobile} landline={c.finance?.landline} />
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-[#802018]" />
              <h3 className="text-xl font-bold text-slate-800">Technical Support</h3>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</span>
              <p className="text-[#802018] font-semibold text-sm">{c.techSupport?.email}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

const Dept = ({ title, email, mobile, landline }) => (
  <section>
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-8 bg-[#802018]" />
      <h3 className="text-xl font-bold text-slate-800">{title}</h3>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
      <Info label="Email" value={email} highlight />
      <Info label="Mobile" value={mobile} />
      <Info label="Landline" value={landline} />
    </div>
  </section>
);

const Info = ({ label, value, highlight }) => (
  <div>
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <p className={`font-semibold text-sm ${highlight ? 'text-[#802018]' : 'text-slate-700'}`}>{value}</p>
  </div>
);

export default ContactUsModal
