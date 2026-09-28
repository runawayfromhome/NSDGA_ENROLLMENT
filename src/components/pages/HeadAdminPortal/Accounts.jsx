// src/components/pages/HeadAdminPortal/Accounts.jsx
// HeadAdmin: create staff, review onboarding, and MANAGE each account — view the
// full profile, verify/return, enable/disable, and change roles (registrar /
// admin / headadmin). Role changes require an OTP step-up: a 6-digit code is
// emailed to the acting HeadAdmin and must be verified before the change applies.
import { useMemo, useState, useEffect, useRef } from 'react';
import HeadAdminSidebar from '../../HeadAdminSidebar';
import MfaReminder from '../../MfaReminder';
import { useSession } from '../../../contexts/useSession';
import {
  getStaffAccounts, createAccount, setDisabled, verifyAccount, returnProfile,
  getPresence, requestAdminOtp, changeRoleWithOtp, requestSetPasswordOtp, setUserPassword, STATUS,
} from '../../../auth/authStore';
import { passwordChecks, isPasswordValid } from '../../../lib/password';

const ONLINE_MS = 5 * 60 * 1000;

function agoLabel(iso, now) {
  if (!iso) return 'Never signed in';
  const secs = Math.floor((now - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'moments ago';
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60), rm = m % 60;
  if (h < 24) return `${h}h ${rm}m ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PresenceCell = ({ iso, now }) => {
  const online = iso && (now - new Date(iso).getTime()) < ONLINE_MS;
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-[#48A675]' : 'bg-slate-300'}`} />
      {online ? <span className="text-[12px] font-bold text-[#48A675]">Online</span>
        : <span className="text-[12px] text-slate-400">{agoLabel(iso, now)}</span>}
    </div>
  );
};

const ROLE_BADGE = {
  registrar: 'bg-[#E7EEFC] text-[#3B67B8]',
  admin: 'bg-[#F3E8FB] text-[#8A4BAF]',
  headadmin: 'bg-[#F3D9D9] text-[#800000]',
};
const ROLE_LABEL = { registrar: 'Registrar', admin: 'Admin', headadmin: 'Head Admin' };

const STATUS_BADGE = {
  [STATUS.PENDING_PROFILE]: { label: 'AWAITING PROFILE', cls: 'bg-[#F2F1E6] text-[#8C8663]' },
  [STATUS.PENDING_VERIFICATION]: { label: 'PENDING VERIFICATION', cls: 'bg-[#FDF3D8] text-[#B58B1F]' },
  [STATUS.VERIFIED]: { label: 'VERIFIED', cls: 'bg-[#D1F7E2] text-[#48A675]' },
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New (Incomplete)' },
  { key: 'pending', label: 'Pending Verification' },
  { key: 'verified', label: 'Verified' },
  { key: 'disabled', label: 'Disabled' },
];
const matchesTab = (a, tab) => {
  if (tab === 'all') return true;
  if (tab === 'disabled') return a.disabled;
  if (a.disabled) return false;
  if (tab === 'new') return a.status === STATUS.PENDING_PROFILE;
  if (tab === 'pending') return a.status === STATUS.PENDING_VERIFICATION;
  if (tab === 'verified') return a.status === STATUS.VERIFIED;
  return true;
};

const RoleBadge = ({ role }) => (
  <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide ${ROLE_BADGE[role] || 'bg-gray-100 text-gray-500'}`}>
    {(ROLE_LABEL[role] || role).toUpperCase()}
  </span>
);

const Accounts = () => {
  const { session } = useSession();
  const [accounts, setAccounts] = useState([]);
  const [tab, setTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'registrar' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [manage, setManage] = useState(null); // account being managed
  const [presence, setPresence] = useState({});
  const [now, setNow] = useState(() => Date.now());

  const refresh = async () => setAccounts(await getStaffAccounts());
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    const load = async () => { setPresence(await getPresence()); setNow(Date.now()); };
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!isPasswordValid(form.password, form.role)) {
      return setError('Temporary password must be at least 12 characters with upper & lower case, a number, and a special character.');
    }
    setCreating(true);
    const result = await createAccount(form);
    setCreating(false);
    if (!result.ok) return setError(result.error);
    await refresh();
    setForm({ name: '', email: '', password: '', role: 'registrar' });
    setShowForm(false);
  };

  const counts = useMemo(() => ({
    all: accounts.length,
    new: accounts.filter((a) => !a.disabled && a.status === STATUS.PENDING_PROFILE).length,
    pending: accounts.filter((a) => !a.disabled && a.status === STATUS.PENDING_VERIFICATION).length,
    verified: accounts.filter((a) => !a.disabled && a.status === STATUS.VERIFIED).length,
    disabled: accounts.filter((a) => a.disabled).length,
  }), [accounts]);

  const rows = accounts.filter((a) => matchesTab(a, tab));
  const afterAction = async () => { await refresh(); setManage(null); };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <HeadAdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="px-6 pt-20 pb-8 md:p-12 max-w-[1400px]">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Account Management</h1>
              <p className="text-slate-500 text-sm">Create staff, review profiles, and manage roles. Role changes require an emailed code.</p>
            </div>
            <button onClick={() => { setShowForm((v) => !v); setError(''); }}
              className="px-6 py-3 bg-[#800000] hover:bg-[#600000] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer">
              {showForm ? 'Close' : '+ New Account'}
            </button>
          </div>

          <MfaReminder settingsPath="/HeadAdminPortal/Settings" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatTile label="Total Staff" value={counts.all} />
            <StatTile label="Awaiting Profile" value={counts.new} accent="text-[#8C8663]" />
            <StatTile label="Pending Verification" value={counts.pending} accent="text-[#B58B1F]" />
            <StatTile label="Verified" value={counts.verified} accent="text-[#48A675]" />
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8 mb-8">
              <h2 className="text-lg font-bold text-slate-800 mb-1">Create Staff Account</h2>
              <p className="text-xs text-slate-400 mb-6">The password below is temporary — the employee sets their own during profile setup.</p>
              {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Full Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="ip" placeholder="e.g. Ana Reyes" /></Field>
                <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="ip" placeholder="name@nsdgamarikina.edu.ph" /></Field>
                <Field label="Temporary Password"><input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="ip" placeholder="Set an initial password" /></Field>
                <Field label="Role">
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="ip"><option value="registrar">Registrar</option><option value="admin">Admin</option></select>
                </Field>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={creating} className="px-6 py-2.5 bg-[#800000] hover:bg-[#600000] disabled:opacity-60 text-white rounded-xl text-sm font-bold cursor-pointer">{creating ? 'Creating…' : 'Create Account'}</button>
              </div>
            </form>
          )}

          <div className="flex flex-wrap gap-2 mb-5">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-full text-[12px] font-bold transition-colors cursor-pointer ${tab === t.key ? 'bg-[#800000] text-white' : 'bg-white border border-gray-200 text-slate-500 hover:bg-gray-50'}`}>
                {t.label} <span className={tab === t.key ? 'opacity-80' : 'text-slate-400'}>({counts[t.key]})</span>
              </button>
            ))}
          </div>

          {/* Table (desktop) + cards (mobile) */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-6">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[820px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Name', 'Email', 'Role', 'Verification', 'Presence', 'Created', ''].map((h) => (
                      <th key={h} className="pb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm">No accounts in this view.</td></tr>}
                  {rows.map((acc) => {
                    const badge = STATUS_BADGE[acc.status] || STATUS_BADGE[STATUS.PENDING_PROFILE];
                    return (
                      <tr key={acc.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-4 text-[13px] font-bold text-slate-700">{acc.name}{acc.id === session?.id && <span className="ml-2 text-[10px] font-bold text-slate-400">(you)</span>}</td>
                        <td className="py-4 text-[12px] text-slate-500">{acc.email}</td>
                        <td className="py-4"><RoleBadge role={acc.role} /></td>
                        <td className="py-4">
                          {acc.disabled
                            ? <span className="px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide bg-[#FCE4E4] text-[#C55A5A]">DISABLED</span>
                            : <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide ${badge.cls}`}>{badge.label}</span>}
                        </td>
                        <td className="py-4"><PresenceCell iso={presence[acc.id]} now={now} /></td>
                        <td className="py-4 text-[12px] text-slate-400">{new Date(acc.created_at).toLocaleDateString()}</td>
                        <td className="py-4 text-right">
                          <button onClick={() => setManage(acc)} className="px-4 py-2 rounded-lg text-[12px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">Manage</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {rows.length === 0 && <p className="py-8 text-center text-slate-400 text-sm">No accounts in this view.</p>}
              {rows.map((acc) => {
                const badge = STATUS_BADGE[acc.status] || STATUS_BADGE[STATUS.PENDING_PROFILE];
                return (
                  <div key={acc.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-slate-700 truncate">{acc.name}{acc.id === session?.id && <span className="ml-1 text-[10px] font-bold text-slate-400">(you)</span>}</p>
                        <p className="text-[12px] text-slate-500 truncate">{acc.email}</p>
                      </div>
                      {acc.disabled
                        ? <span className="shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide bg-[#FCE4E4] text-[#C55A5A]">DISABLED</span>
                        : <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide ${badge.cls}`}>{badge.label}</span>}
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <RoleBadge role={acc.role} />
                      <div className="text-[11px]"><PresenceCell iso={presence[acc.id]} now={now} /></div>
                    </div>
                    <button onClick={() => setManage(acc)} className="mt-3 w-full py-2 rounded-lg text-[12px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">Manage</button>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {manage && (
        <ManageModal account={manage} isSelf={manage.id === session?.id} onClose={() => setManage(null)} onRefresh={refresh} onDone={afterAction} />
      )}

      <style>{`
        .ip { width:100%; height:3rem; border:1px solid #E5E7EB; border-radius:0.75rem; padding:0 1rem; font-size:0.875rem; background:#fff; outline:none; }
        .ip:focus { border-color:#800000; }
      `}</style>
    </div>
  );
};

// ---- Reset-password section (HeadAdmin sets a staff password, with OTP) -----
const ResetPasswordSection = ({ account }) => {
  const [pw, setPw] = useState('');
  const [step, setStep] = useState('idle'); // idle | sent
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const refs = useRef([]);
  const valid = isPasswordValid(pw, account.role);

  useEffect(() => { if (cooldown > 0) { const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); } }, [cooldown]);

  const setDigit = (i, v) => {
    const c = v.replace(/\D/g, '').slice(-1);
    setDigits((p) => { const n = [...p]; n[i] = c; return n; });
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); };

  const send = async () => {
    if (!valid) return setMsg('⚠️ Set a valid new password first (see the requirements).');
    setBusy('otp'); setMsg('');
    const res = await requestSetPasswordOtp();
    setBusy('');
    if (!res.ok) return setMsg('⚠️ ' + res.error);
    setStep('sent'); setCooldown(30);
    setMsg(`✓ We emailed a 6-digit code to your email (${res.sentTo || 'your account'}). Enter it below to confirm.`);
  };
  const confirm = async () => {
    const code = digits.join('');
    if (code.length !== 6) return setMsg('⚠️ Enter the 6-digit code.');
    setBusy('confirm'); setMsg('');
    const res = await setUserPassword(account.id, pw, code, account.name);
    setBusy('');
    if (!res.ok) return setMsg('⚠️ ' + res.error);
    setStep('idle'); setDigits(['', '', '', '', '', '']); setPw('');
    setMsg('✓ Password reset. Share the new temporary password with the staff member securely.');
  };

  return (
    <div className="space-y-3">
      {msg && <div className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}
      <input type="text" value={pw} onChange={(e) => { setPw(e.target.value); setStep('idle'); setMsg(''); }} placeholder="New temporary password" className="ip" disabled={step === 'sent'} />
      <ul className="space-y-1">
        {Object.entries(passwordChecks(pw, account.role)).map(([label, ok]) => (
          <li key={label} className={`flex items-center gap-2 text-[12px] font-medium ${ok ? 'text-[#48A675]' : 'text-slate-400'}`}><span>{ok ? '✓' : '•'}</span> {label}</li>
        ))}
      </ul>
      {step === 'idle' ? (
        <button onClick={send} disabled={!valid || !!busy} className="px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold disabled:opacity-50 cursor-pointer">{busy === 'otp' ? 'Sending…' : 'Reset password'}</button>
      ) : (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <p className="text-[12px] font-bold text-slate-600">Enter the code emailed to you to confirm the reset.</p>
          <div className="flex gap-2">
            {digits.map((d, i) => (
              <input key={i} ref={(el) => (refs.current[i] = el)} value={d} onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} inputMode="numeric" maxLength={1}
                className="w-11 h-14 text-center text-xl font-bold border border-gray-200 rounded-lg bg-white focus:border-[#800000] focus:outline-none" />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={confirm} disabled={busy === 'confirm'} className="px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold disabled:opacity-60 cursor-pointer">{busy === 'confirm' ? 'Confirming…' : 'Confirm reset'}</button>
            {cooldown > 0 ? <span className="text-[12px] text-slate-400">Resend in {cooldown}s</span> : <button onClick={send} disabled={!!busy} className="text-[12px] font-bold text-[#800000] hover:underline">Resend code</button>}
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Manage modal ----------------------------------------------------------
const ManageModal = ({ account, isSelf, onClose, onRefresh, onDone }) => {
  const [newRole, setNewRole] = useState(account.role);
  const [otpStep, setOtpStep] = useState('idle'); // idle | sent
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState('');
  const refs = useRef([]);
  const pending = account.status === STATUS.PENDING_VERIFICATION && !account.disabled;
  const roleChanged = newRole !== account.role;

  useEffect(() => { if (cooldown > 0) { const t = setTimeout(() => setCooldown((c) => c - 1), 1000); return () => clearTimeout(t); } }, [cooldown]);

  const setDigit = (i, v) => {
    const c = v.replace(/\D/g, '').slice(-1);
    setDigits((p) => { const n = [...p]; n[i] = c; return n; });
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i, e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); };

  const sendCode = async () => {
    setBusy('otp'); setMsg('');
    const res = await requestAdminOtp();
    setBusy('');
    if (!res.ok) return setMsg('⚠️ ' + res.error);
    setOtpStep('sent'); setCooldown(30);
    setMsg(`✓ We emailed a 6-digit code to your email (${res.sentTo || 'your account'}). Enter it below to confirm.`);
  };
  const confirmChange = async () => {
    const code = digits.join('');
    if (code.length !== 6) return setMsg('⚠️ Enter the 6-digit code.');
    setBusy('confirm'); setMsg('');
    const res = await changeRoleWithOtp(account.id, newRole, code, account.name);
    setBusy('');
    if (!res.ok) return setMsg('⚠️ ' + res.error);
    onDone();
  };

  const doVerify = async () => { setBusy('verify'); await verifyAccount(account.id); setBusy(''); onDone(); };
  const doReturn = async () => { setBusy('return'); await returnProfile(account.id, note); setBusy(''); onDone(); };
  const doDisable = async () => { setBusy('disable'); await setDisabled(account.id, !account.disabled); setBusy(''); onDone(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-800">{account.name}</h3>
            <p className="text-xs text-slate-400">{account.email} · <RoleBadge role={account.role} /></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {msg && <div className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}

          {/* Profile */}
          <div>
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Profile</h4>
            {account.profile?.photo && <img src={account.profile.photo} alt="ID" className="w-24 h-24 rounded-xl object-cover border mb-4" />}
            <ProfileGrid profile={account.profile} />
          </div>

          {/* Role & access */}
          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Role &amp; Access</h4>
            {isSelf ? (
              <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-3">You can't change your own role. Another Head Admin must do it.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <select value={newRole} onChange={(e) => { setNewRole(e.target.value); setOtpStep('idle'); setDigits(['', '', '', '', '', '']); setMsg(''); }} className="ip w-auto" disabled={otpStep === 'sent'}>
                    <option value="registrar">Registrar</option>
                    <option value="admin">Admin</option>
                    <option value="headadmin">Head Admin</option>
                  </select>
                  {otpStep === 'idle' && (
                    <button onClick={sendCode} disabled={!roleChanged || !!busy}
                      className="px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold disabled:opacity-50 cursor-pointer">
                      {busy === 'otp' ? 'Sending…' : newRole === 'headadmin' ? 'Promote to Head Admin' : 'Change role'}
                    </button>
                  )}
                </div>
                {!roleChanged && otpStep === 'idle' && <p className="text-[12px] text-slate-400">Pick a different role to change it. A 6-digit code will be emailed to you for confirmation.</p>}

                {otpStep === 'sent' && (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <p className="text-[12px] font-bold text-slate-600">Enter the code to confirm: {ROLE_LABEL[account.role]} → <span className="text-[#800000]">{ROLE_LABEL[newRole]}</span></p>
                    <div className="flex gap-2">
                      {digits.map((d, i) => (
                        <input key={i} ref={(el) => (refs.current[i] = el)} value={d}
                          onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => onKey(i, e)} inputMode="numeric" maxLength={1}
                          className="w-11 h-14 text-center text-xl font-bold border border-gray-200 rounded-lg bg-white focus:border-[#800000] focus:outline-none" />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={confirmChange} disabled={busy === 'confirm'} className="px-5 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold disabled:opacity-60 cursor-pointer">{busy === 'confirm' ? 'Confirming…' : 'Confirm change'}</button>
                      {cooldown > 0
                        ? <span className="text-[12px] text-slate-400">Resend in {cooldown}s</span>
                        : <button onClick={sendCode} disabled={!!busy} className="text-[12px] font-bold text-[#800000] hover:underline">Resend code</button>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reset password */}
          {!isSelf && (
            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Reset Password</h4>
              <ResetPasswordSection account={account} />
            </div>
          )}

          {/* Verification (pending only) */}
          {pending && (
            <div className="border-t border-gray-100 pt-5">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Verification</h4>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note if returning for correction…"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#800000] focus:outline-none min-h-[64px] mb-3" />
              <div className="flex flex-wrap justify-end gap-3">
                <button onClick={doReturn} disabled={!!busy} className="px-6 py-2.5 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl text-sm font-bold cursor-pointer">Return for Correction</button>
                <button onClick={doVerify} disabled={!!busy} className="px-6 py-2.5 bg-[#48A675] hover:bg-[#3c8c63] text-white rounded-xl text-sm font-bold cursor-pointer">Verify Account ✓</button>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <button onClick={doDisable} disabled={isSelf || !!busy}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 cursor-pointer ${account.disabled ? 'bg-green-50 text-[#48A675] hover:bg-green-100' : 'bg-red-50 text-[#C55A5A] hover:bg-red-100'}`}>
            {account.disabled ? 'Enable account' : 'Disable account'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-100 cursor-pointer">Close</button>
        </div>
      </div>
    </div>
  );
};

const ProfileGrid = ({ profile }) => {
  if (!profile) return <p className="text-sm text-slate-400">No profile submitted yet.</p>;
  const rows = [
    ['Full Name', [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ')],
    ['Sex', profile.sex], ['Date of Birth', profile.dob], ['Civil Status', profile.civilStatus],
    ['Mobile', profile.mobile], ['Address', profile.address],
    ['Emergency Contact', [profile.emergencyName, profile.emergencyNumber].filter(Boolean).join(' · ')],
    ['Employee ID', profile.employeeId], ['Position', profile.position], ['Department', profile.department],
    ['Date Hired', profile.dateHired], ['Employment Type', profile.employmentType], ['Supervisor', profile.supervisor],
    ['Education', profile.education], ['Course', profile.course], ['PRC License', profile.prcLicense],
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-sm text-slate-700">{value || '—'}</p>
        </div>
      ))}
    </div>
  );
};

const StatTile = ({ label, value, accent = 'text-slate-800' }) => (
  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
    <p className={`text-3xl font-black ${accent}`}>{value}</p>
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block font-semibold text-xs text-gray-600 uppercase tracking-wide mb-2">{label}</span>
    {children}
  </label>
);

export default Accounts;
