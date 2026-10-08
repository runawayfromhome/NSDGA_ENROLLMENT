// A persistent nudge for staff to turn on Multi-Factor Authentication. Shows on
// staff dashboards until an authenticator is enrolled. MFA stays optional, but
// staff hold privileged access, so we keep reminding them.
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HiOutlineShieldCheck } from 'react-icons/hi';
import { getMfaFactor } from '../auth/authStore';

export default function MfaReminder({ settingsPath }) {
  const [factor, setFactor] = useState(undefined); // undefined = loading

  useEffect(() => { getMfaFactor().then(setFactor); }, []);

  if (factor === undefined || factor) return null; // still loading, or already on
  return (
    <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50 px-5 py-4 flex flex-wrap items-center gap-3">
      <HiOutlineShieldCheck className="text-amber-600 shrink-0" size={30} />
      <div className="flex-1 min-w-[220px]">
        <p className="font-bold text-amber-900">Protect your account — turn on Multi-Factor Authentication</p>
        <p className="text-sm text-amber-800 mt-0.5">Your account manages sensitive school data. Add an authenticator code for stronger security.</p>
      </div>
      <NavLink to={settingsPath} className="px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold whitespace-nowrap">Enable now →</NavLink>
    </div>
  );
}
