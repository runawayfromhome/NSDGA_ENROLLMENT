// src/components/pages/HeadAdminPortal/Accounts.jsx
// HeadAdmin: create / disable staff, change roles, AND review the onboarding
// lifecycle — see who is new (profile incomplete), who is awaiting verification,
// and who is verified. Review a submitted profile, then Verify or Return it.
import { useMemo, useState, useEffect } from 'react';
import HeadAdminSidebar from '../../HeadAdminSidebar';
import {
  getStaffAccounts,
  createAccount,
  setDisabled,
  updateRole,
  verifyAccount,
  returnProfile,
  getPresence,
  STATUS,
} from '../../../auth/authStore';

const ONLINE_MS = 5 * 60 * 1000; // "online" if seen within the last 5 minutes.

// Human "last seen" label from an ISO timestamp.
function agoLabel(iso) {
  if (!iso) return 'Never signed in';
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'moments ago';
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60), rm = m % 60;
  if (h < 24) return `${h}h ${rm}m ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const PresenceCell = ({ iso }) => {
  const online = iso && (Date.now() - new Date(iso).getTime()) < ONLINE_MS;
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-[#48A675]' : 'bg-slate-300'}`} />
      {online
        ? <span className="text-[12px] font-bold text-[#48A675]">Online</span>
        : <span className="text-[12px] text-slate-400">{agoLabel(iso)}</span>}
    </div>
  );
};

const ROLE_BADGE = {
  registrar: 'bg-[#E7EEFC] text-[#3B67B8]',
  admin: 'bg-[#F3E8FB] text-[#8A4BAF]',
};

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

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [tab, setTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'registrar' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [review, setReview] = useState(null); // account being reviewed
  const [note, setNote] = useState('');
  const [presence, setPresence] = useState({}); // userId -> last_seen ISO

  const refresh = async () => setAccounts(await getStaffAccounts());
  useEffect(() => { refresh(); }, []);
  // Poll presence so the Online/last-seen column stays fresh while the page is open.
  useEffect(() => {
    const load = async () => setPresence(await getPresence());
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
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

  const doVerify = async (id) => { await verifyAccount(id); await refresh(); setReview(null); };
  const doReturn = async (id) => { await returnProfile(id, note); await refresh(); setReview(null); setNote(''); };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <HeadAdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="p-6 md:p-12 max-w-[1400px]">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Account Management</h1>
              <p className="text-slate-500 text-sm">Create staff, review onboarding profiles, and verify Registrar &amp; Admin accounts.</p>
            </div>
            <button onClick={() => { setShowForm((v) => !v); setError(''); }}
              className="px-6 py-3 bg-[#800000] hover:bg-[#600000] text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer">
              {showForm ? 'Close' : '+ New Account'}
            </button>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatTile label="Total Staff" value={counts.all} />
            <StatTile label="Awaiting Profile" value={counts.new} accent="text-[#8C8663]" />
            <StatTile label="Pending Verification" value={counts.pending} accent="text-[#B58B1F]" />
            <StatTile label="Verified" value={counts.verified} accent="text-[#48A675]" />
          </div>

          {/* Create form */}
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

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-5">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-full text-[12px] font-bold transition-colors cursor-pointer ${tab === t.key ? 'bg-[#800000] text-white' : 'bg-white border border-gray-200 text-slate-500 hover:bg-gray-50'}`}>
                {t.label} <span className={tab === t.key ? 'opacity-80' : 'text-slate-400'}>({counts[t.key]})</span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-6 overflow-x-auto">
            <table className="w-full text-left min-w-[820px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'Email', 'Role', 'Verification', 'Presence', 'Created', 'Action'].map((h) => (
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
                      <td className="py-4 text-[13px] font-bold text-slate-700">{acc.name}</td>
                      <td className="py-4 text-[12px] text-slate-500">{acc.email}</td>
                      <td className="py-4">
                        <select value={acc.role} onChange={async (e) => { await updateRole(acc.id, e.target.value); await refresh(); }}
                          className={`text-[11px] font-bold rounded-full px-3 py-1.5 border-none cursor-pointer ${ROLE_BADGE[acc.role] || 'bg-gray-100 text-gray-500'}`}>
                          <option value="registrar">Registrar</option><option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-4">
                        {acc.disabled
                          ? <span className="px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide bg-[#FCE4E4] text-[#C55A5A]">DISABLED</span>
                          : <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide ${badge.cls}`}>{badge.label}</span>}
                      </td>
                      <td className="py-4"><PresenceCell iso={presence[acc.id]} /></td>
                      <td className="py-4 text-[12px] text-slate-400">{new Date(acc.created_at).toLocaleDateString()}</td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          {acc.status === STATUS.PENDING_VERIFICATION && !acc.disabled && (
                            <button onClick={() => { setReview(acc); setNote(''); }}
                              className="px-4 py-2 rounded-lg text-[12px] font-bold bg-[#FDF3D8] text-[#B58B1F] hover:bg-[#f7e9bf] cursor-pointer">Review &amp; Verify</button>
                          )}
                          <button onClick={async () => { await setDisabled(acc.id, !acc.disabled); await refresh(); }}
                            className={`px-4 py-2 rounded-lg text-[12px] font-bold cursor-pointer ${acc.disabled ? 'bg-green-50 text-[#48A675] hover:bg-green-100' : 'bg-red-50 text-[#C55A5A] hover:bg-red-100'}`}>
                            {acc.disabled ? 'Enable' : 'Disable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Review modal */}
      {review && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setReview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800">{review.name}</h3>
                <p className="text-xs text-slate-400">{review.email} · {review.role}</p>
              </div>
              <button onClick={() => setReview(null)} className="text-gray-400 hover:text-gray-600 text-xl cursor-pointer">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {review.profile?.photo && <img src={review.profile.photo} alt="ID" className="w-24 h-24 rounded-xl object-cover border" />}
              <ProfileGrid profile={review.profile} />
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 space-y-3">
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note if returning for correction…"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#800000] focus:outline-none min-h-[70px]" />
              <div className="flex justify-end gap-3">
                <button onClick={() => doReturn(review.id)}
                  className="px-6 py-2.5 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl text-sm font-bold cursor-pointer">Return for Correction</button>
                <button onClick={() => doVerify(review.id)}
                  className="px-6 py-2.5 bg-[#48A675] hover:bg-[#3c8c63] text-white rounded-xl text-sm font-bold cursor-pointer">Verify Account ✓</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ip { width:100%; height:3rem; border:1px solid #E5E7EB; border-radius:0.75rem; padding:0 1rem; font-size:0.875rem; background:#fff; outline:none; }
        .ip:focus { border-color:#800000; }
      `}</style>
    </div>
  );
};

const ProfileGrid = ({ profile }) => {
  if (!profile) return <p className="text-sm text-slate-400">No profile data.</p>;
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
