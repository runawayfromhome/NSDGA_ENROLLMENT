// src/components/ChangePassword.jsx
// Change Password with step-up re-authentication: requires the CURRENT password,
// and (if MFA is on) a fresh authenticator code, before setting the new one.
// Shared by Registrar, Admin and HeadAdmin settings.
import { useEffect, useState } from 'react';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { getMfaFactor, verifyCurrentPassword, verifyMfaChallenge, changePassword } from '../auth/authStore';

const rules = (pw) => ({
  'At least 12 characters': pw.length >= 12,
  'Upper & lower case letters': /[a-z]/.test(pw) && /[A-Z]/.test(pw),
  'At least one number': /\d/.test(pw),
  'At least one special character': /[^A-Za-z0-9]/.test(pw),
});

const ChangePassword = () => {
  const [factor, setFactor] = useState(null);
  const [form, setForm] = useState({ current: '', next: '', confirm: '', code: '' });
  const [show, setShow] = useState({ current: false, next: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { (async () => setFactor(await getMfaFactor()))(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const checks = rules(form.next);
  const allValid = Object.values(checks).every(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (!form.current) return setError('Enter your current password.');
    if (!allValid) return setError('Your new password does not meet the requirements below.');
    if (form.next !== form.confirm) return setError('New passwords do not match.');

    setBusy(true);
    // 1) current password
    const cp = await verifyCurrentPassword(form.current);
    if (!cp.ok) { setBusy(false); return setError(cp.error); }
    // 2) MFA code (if enabled)
    if (factor) {
      if (form.code.length < 6) { setBusy(false); return setError('Enter the 6-digit authenticator code.'); }
      const mv = await verifyMfaChallenge(factor.id, form.code);
      if (!mv.ok) { setBusy(false); return setError(mv.error); }
    }
    // 3) change it
    const res = await changePassword(form.next);
    setBusy(false);
    if (!res.ok) return setError(res.error || 'Could not update password.');
    setSuccess(true);
    setForm({ current: '', next: '', confirm: '', code: '' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-2xl">
      <h2 className="text-2xl font-extrabold text-[#800000] mb-1">Change Password</h2>
      <p className="text-sm text-slate-500 mb-6">
        Confirm your current password{factor ? ' and an authenticator code' : ''} to set a new one.
      </p>

      {success && <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-[#48A675]">Password updated ✓</div>}
      {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      {!factor && (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tip: enable MFA below so password changes also require an authenticator code.
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <Field label="CURRENT PASSWORD">
          <PwInput value={form.current} onChange={set('current')} show={show.current}
            toggle={() => setShow({ ...show, current: !show.current })} placeholder="••••••••••••" />
        </Field>

        <div>
          <Field label="NEW PASSWORD">
            <PwInput value={form.next} onChange={set('next')} show={show.next}
              toggle={() => setShow({ ...show, next: !show.next })} placeholder="Enter your new password" />
          </Field>
          <ul className="mt-3 space-y-1">
            {Object.entries(checks).map(([label, ok]) => (
              <li key={label} className={`flex items-center gap-2 text-[12px] font-medium ${ok ? 'text-[#48A675]' : 'text-slate-400'}`}>
                <span>{ok ? '✓' : '•'}</span> {label}
              </li>
            ))}
          </ul>
        </div>

        <Field label="CONFIRM NEW PASSWORD">
          <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat your new password" className="ipw" />
        </Field>

        {factor && (
          <Field label="AUTHENTICATOR CODE">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              inputMode="numeric" placeholder="123456"
              className="w-full max-w-[220px] h-12 border border-gray-200 rounded-xl text-center text-lg tracking-[0.4em] focus:border-[#800000] focus:outline-none" />
          </Field>
        )}

        <div className="pt-2">
          <button type="submit" disabled={busy}
            className="bg-[#800000] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#600000] transition-all disabled:opacity-60 text-sm cursor-pointer">
            {busy ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>

      <style>{`.ipw{width:100%;height:3rem;border:1px solid #E5E7EB;border-radius:0.75rem;padding:0 1rem;font-size:0.875rem;background:#fff;outline:none;} .ipw:focus{border-color:#800000;}`}</style>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">{label}</span>
    {children}
  </label>
);

const PwInput = ({ value, onChange, show, toggle, placeholder }) => (
  <div className="relative">
    <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full h-12 border border-gray-200 rounded-xl px-4 pr-12 text-sm bg-white focus:border-[#800000] focus:outline-none" />
    <button type="button" onClick={toggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
      {show ? <HiOutlineEye size={20} /> : <HiOutlineEyeOff size={20} />}
    </button>
  </div>
);

export default ChangePassword;
