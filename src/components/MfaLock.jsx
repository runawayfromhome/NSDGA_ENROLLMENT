// src/components/MfaLock.jsx
// Reusable "changes locked until MFA is on" gate for staff pages. Returns a
// `locked` flag (true when the signed-in user has NO verified authenticator) and
// a ready-to-render warning `banner`. Pages render {banner} and add `|| locked`
// to their action buttons' disabled props.
//
// NOTE: this is a client-side UX gate. The most sensitive operations (HeadAdmin
// account changes) are additionally enforced server-side in their Edge Functions.
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HiOutlineLockClosed } from 'react-icons/hi';
import { getMfaFactor } from '../auth/authStore';

export function useMfaLock(settingsPath) {
  const [locked, setLocked] = useState(false); // optimistic: unlocked until checked

  useEffect(() => { getMfaFactor().then((f) => setLocked(!f)); }, []);

  const banner = locked ? (
    <div className="mb-6 rounded-2xl border-2 border-red-300 bg-red-50 px-5 py-4 flex flex-wrap items-center gap-3">
      <HiOutlineLockClosed className="text-red-600 shrink-0" size={28} />
      <div className="flex-1 min-w-[220px]">
        <p className="font-bold text-red-800">Changes are locked</p>
        <p className="text-sm text-red-700 mt-0.5">For security, enable Multi-Factor Authentication (MFA) before making changes to the system.</p>
      </div>
      <NavLink to={settingsPath} className="px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold whitespace-nowrap">Enable MFA →</NavLink>
    </div>
  ) : null;

  return { locked, banner };
}
