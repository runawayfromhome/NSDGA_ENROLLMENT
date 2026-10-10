// src/components/StaffProfileView.jsx
// Shared "My Profile" content for Registrar & Admin. It reads the LOGGED-IN
// user's own account + profile from the store — no hardcoded data. The parent
// page supplies the surrounding sidebar/layout.
import { useState } from 'react';
import { useSession } from '../contexts/useSession';
import { updateProfile } from '../auth/authStore';
import { LuUser, LuBriefcase, LuContact, LuIdCard } from 'react-icons/lu';
import RegistrarProfileCard from './icons/RegistrarIcons/RegistrarProfileCard';
import RegistrarPersonInfoCard from './icons/RegistrarIcons/RegistrarPersonInfoCard';
import RegistrarProfDetailsCard from './icons/RegistrarIcons/RegistrarProfDetailsCard';
import RegistarContactInfoCard from './icons/RegistrarIcons/RegistarContactInfoCard';

const ROLE_LABEL = { registrar: 'Registrar', admin: 'Admin', headadmin: 'Head Administrator' };
const val = (v) => (v && String(v).trim() ? v : '—');
const fmtDate = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const StaffProfileView = () => {
  const { session, refresh } = useSession();
  const p = session.profile || {};

  const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ') || session.name;
  const roleLabel = ROLE_LABEL[session.role] || session.role;
  const email = session.email;
  // Profile photo = the 2x2 ID picture submitted during ProfileSetup (p.photo).
  // No photo → show initials (not a random generated avatar).
  const avatar = p.photo || null;
  const initials = (fullName || session.name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

  const [contact, setContact] = useState({
    mobile: p.mobile || '', address: p.address || '', secondaryEmail: p.secondaryEmail || '',
    emergencyName: p.emergencyName || '', emergencyNumber: p.emergencyNumber || '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await updateProfile(session.id, contact);
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <main className="p-6 md:p-12 max-w-[1200px] mx-auto w-full space-y-8">
      {/* Header card */}
      <RegistrarProfileCard>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-[#800000]/10 flex items-center justify-center shrink-0">
            {avatar ? <img src={avatar} alt="2x2 Photo" className="w-full h-full object-cover" /> : <span className="text-4xl font-black text-[#800000]">{initials}</span>}
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-4xl font-bold text-[#4A1010]">{fullName}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-slate-500 font-medium">
              <div className="flex items-center gap-1">
                <LuIdCard size={18} className="text-[#800000]" />
                <span>{roleLabel}</span>
              </div>
              <span className="text-slate-300">|</span>
              <span>EMPLOYEE ID NO. {val(p.employeeId)}</span>
            </div>
            <p className="text-sm text-slate-400">{email}</p>
          </div>
        </div>
      </RegistrarProfileCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Personal */}
        <div className="space-y-4">
          <SectionTitle icon={<LuUser size={20} />}>Personal Information</SectionTitle>
          <RegistrarPersonInfoCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-y-8 gap-x-4">
              <Field label="Full Name" value={fullName} />
              <Field label="Gender" value={val(p.sex)} />
              <Field label="Birthdate" value={fmtDate(p.dob)} />
              <Field label="Nationality" value={val(p.nationality)} />
              <Field label="Civil Status" value={val(p.civilStatus)} />
            </div>
          </RegistrarPersonInfoCard>
        </div>

        {/* Professional */}
        <div className="space-y-4">
          <SectionTitle icon={<LuBriefcase size={20} />}>Professional Details</SectionTitle>
          <RegistrarProfDetailsCard>
            <div className="space-y-6 md:space-y-8">
              <Field label="Position" value={val(p.position)} />
              <Field label="Department" value={val(p.department)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Date Hired" value={fmtDate(p.dateHired)} />
                <Field label="Employment Status" value={val(p.employmentType)} />
              </div>
              <Field label="Immediate Supervisor" value={val(p.supervisor)} />
            </div>
          </RegistrarProfDetailsCard>
        </div>
      </div>

      {/* Credentials & Qualifications */}
      <div className="space-y-4">
        <SectionTitle icon={<LuIdCard size={20} />}>Credentials &amp; Qualifications</SectionTitle>
        <RegistrarPersonInfoCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-4">
            <Field label="Highest Educational Attainment" value={val(p.education)} />
            <Field label="Course / Degree" value={val(p.course)} />
            <Field label="PRC License No." value={val(p.prcLicense)} />
            <Field label="Certifications" value={val(p.certifications)} />
          </div>
        </RegistrarPersonInfoCard>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 justify-between items-center px-2">
          <SectionTitle icon={<LuContact size={20} />}>Contact Information</SectionTitle>
          <div className="flex items-center gap-3">
            {saved && <span className="text-xs font-bold text-emerald-600">Saved ✓</span>}
            <button
              onClick={handleSave}
              className="bg-[#4A1010] text-white px-8 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#300a0a] transition-colors shadow-md cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
        <RegistarContactInfoCard>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <ReadonlyField label="Email Address" value={email} />
            <EditableField label="Phone Number" value={contact.mobile} onChange={(v) => setContact({ ...contact, mobile: v })} />
            <EditableField label="Secondary Email" value={contact.secondaryEmail} onChange={(v) => setContact({ ...contact, secondaryEmail: v })} />
            <EditableField label="Home Address" value={contact.address} onChange={(v) => setContact({ ...contact, address: v })} />
            <EditableField label="Emergency Contact Name" value={contact.emergencyName} onChange={(v) => setContact({ ...contact, emergencyName: v })} />
            <EditableField label="Emergency Contact Number" value={contact.emergencyNumber} onChange={(v) => setContact({ ...contact, emergencyNumber: v })} />
          </div>
        </RegistarContactInfoCard>
      </div>
    </main>
  );
};

const SectionTitle = ({ icon, children }) => (
  <div className="flex items-center gap-3">
    <div className="p-2 bg-slate-100 rounded-lg text-[#800000]">{icon}</div>
    <h2 className="text-xs font-black text-slate-700 uppercase tracking-widest">{children}</h2>
  </div>
);

const Field = ({ label, value }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
    <p className="text-sm font-bold text-slate-700">{value}</p>
  </div>
);

const ReadonlyField = ({ label, value }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="w-full bg-[#EDEFF2] rounded-lg p-3 text-sm text-slate-500 font-medium">{value}</div>
  </div>
);

const EditableField = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#E2E4E7] border-none rounded-lg p-3 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-[#800000]/20 outline-none"
    />
  </div>
);

export default StaffProfileView;
