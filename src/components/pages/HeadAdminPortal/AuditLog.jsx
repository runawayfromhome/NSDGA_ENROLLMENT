// src/components/pages/HeadAdminPortal/AuditLog.jsx
// HeadAdmin: the audit & activity log. Reads every login/logout event AND every
// staff action (enroll, reject, lifecycle, section approvals, account changes,
// content edits), with search, role/result filters, an activity-type filter, a
// time-period filter (day/week/month/year), and paginated "Load more".
import { useMemo, useState, useEffect } from 'react';
import HeadAdminSidebar from '../../HeadAdminSidebar';
import { getAuditLog, mfaAlerts } from '../../../auth/authStore';

const ACTION_LABEL = {
  LOGIN: 'Login', LOGOUT: 'Logout', MFA_FAIL: 'MFA failed',
  ENROLL: 'Enroll', REJECT: 'Reject', RETURN: 'Return for correction',
  COMPLETE: 'Mark completed', GRADUATED: 'Graduate', WITHDRAWN: 'Withdraw', ARCHIVED: 'Archive',
  REACTIVATE: 'Reactivate', READMIT: 'Re-admit',
  SECTION_APPROVE: 'Approve section', SECTION_UNAPPROVE: 'Un-approve section',
  ACCOUNT_CREATE: 'Create account', ACCOUNT_DISABLE: 'Disable account', ACCOUNT_ENABLE: 'Enable account',
  ROLE_CHANGE: 'Change role', HEADADMIN_PROMOTE: 'Promote to HeadAdmin', ACCOUNT_VERIFY: 'Verify account', PROFILE_RETURN: 'Return profile',
  CONTENT_EDIT: 'Edit content',
  BILLING_UPDATE: 'Update billing',
};

// Which actions belong to each activity group (for the Activity-type filter).
const CATEGORY_OF = {};
const CATEGORIES = {
  auth: ['LOGIN', 'LOGOUT', 'MFA_FAIL'],
  enrollment: ['ENROLL', 'REJECT', 'RETURN'],
  lifecycle: ['COMPLETE', 'GRADUATED', 'WITHDRAWN', 'ARCHIVED', 'REACTIVATE', 'READMIT'],
  sections: ['SECTION_APPROVE', 'SECTION_UNAPPROVE'],
  accounts: ['ACCOUNT_CREATE', 'ACCOUNT_DISABLE', 'ACCOUNT_ENABLE', 'ROLE_CHANGE', 'HEADADMIN_PROMOTE', 'ACCOUNT_VERIFY', 'PROFILE_RETURN'],
  content: ['CONTENT_EDIT'],
  billing: ['BILLING_UPDATE'],
};
Object.entries(CATEGORIES).forEach(([cat, actions]) => actions.forEach((a) => { CATEGORY_OF[a] = cat; }));

const ACTIVITY = [
  { value: 'all', label: 'All Activity' },
  { value: 'auth', label: 'Logins' },
  { value: 'enrollment', label: 'Enrollment' },
  { value: 'lifecycle', label: 'Lifecycle' },
  { value: 'sections', label: 'Sections' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'content', label: 'Content' },
  { value: 'billing', label: 'Billing' },
];

// Small colour accent per activity group for the Action cell.
const ACTION_TINT = {
  auth: 'bg-slate-100 text-slate-600',
  enrollment: 'bg-[#D1F7E2] text-[#48A675]',
  lifecycle: 'bg-indigo-50 text-indigo-600',
  sections: 'bg-blue-50 text-blue-600',
  accounts: 'bg-[#F2F6D0] text-[#9A9E4C]',
  content: 'bg-orange-50 text-orange-600',
  billing: 'bg-teal-50 text-teal-600',
};

const PAGE = 25;
const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
];

function inPeriod(dateStr, period) {
  if (period === 'all') return true;
  const d = new Date(dateStr), now = new Date();
  if (period === 'today') return d.toDateString() === now.toDateString();
  if (period === 'week') { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
  if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  if (period === 'year') return d.getFullYear() === now.getFullYear();
  return true;
}

const isAuthEvent = (r) => r.action === 'LOGIN' || r.action === 'LOGOUT';

const AuditLog = () => {
  const [log, setLog] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activity, setActivity] = useState('all');
  const [period, setPeriod] = useState('today');
  const [visible, setVisible] = useState(PAGE);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => { (async () => setLog(await getAuditLog()))(); }, []);
  useEffect(() => { mfaAlerts().then(setAlerts); }, []);
  useEffect(() => { setVisible(PAGE); }, [search, roleFilter, statusFilter, activity, period]);

  const rows = useMemo(() => log.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.reason?.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || r.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesActivity = activity === 'all' || CATEGORY_OF[r.action] === activity;
    return matchesSearch && matchesRole && matchesStatus && matchesActivity && inPeriod(r.created_at, period);
  }), [log, search, roleFilter, statusFilter, activity, period]);

  const shown = rows.slice(0, visible);

  const today = new Date().toDateString();
  const todays = log.filter((r) => new Date(r.created_at).toDateString() === today);
  const loginsToday = todays.filter((r) => r.action === 'LOGIN' && r.status === 'SUCCESS').length;
  const failedToday = todays.filter((r) => r.status === 'FAILED').length;
  const actionsToday = todays.filter((r) => !isAuthEvent(r)).length;

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <HeadAdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="px-6 pt-20 pb-8 md:p-12 max-w-[1400px]">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Audit &amp; Activity Log</h1>
            <p className="text-slate-500 text-sm">Every sign-in and every action staff take across the system.</p>
          </div>

          {alerts.length > 0 && (
            <div className="mb-8 rounded-2xl border-2 border-red-300 bg-red-50 p-5">
              <p className="font-black text-red-700 flex items-center gap-2 mb-2">⚠️ Possible MFA brute-force</p>
              <ul className="space-y-1 text-sm text-red-700">
                {alerts.map((a) => (
                  <li key={a.email}><b>{a.name || a.email}</b> — {a.fiveMin >= 5 ? `${a.fiveMin} failed MFA codes in the last 5 minutes` : `${a.hour} failed MFA codes in the last hour`}. Consider disabling the account or resetting its MFA.</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 max-w-3xl">
            <StatTile label="Logins Today" value={loginsToday} />
            <StatTile label="Failed Today" value={failedToday} accent="text-[#C55A5A]" />
            <StatTile label="Staff Actions Today" value={actionsToday} accent="text-[#48A675]" />
            <StatTile label="Total Events" value={log.length} />
          </div>

          {/* Period tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PERIODS.map((p) => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${period === p.value ? 'bg-[#800000] text-white' : 'bg-white text-slate-600 border border-gray-100 hover:bg-gray-50'}`}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Activity-type chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {ACTIVITY.map((a) => (
              <button key={a.value} onClick={() => setActivity(a.value)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition ${activity === a.value ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-gray-100 hover:bg-gray-50'}`}>
                {a.label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or detail…"
              className="flex-1 min-w-[220px] px-5 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm focus:outline-none focus:border-[#800000]" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm text-slate-600 cursor-pointer">
              <option value="all">All Roles</option><option value="registrar">Registrar</option><option value="admin">Admin</option><option value="headadmin">HeadAdmin</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm text-slate-600 cursor-pointer">
              <option value="all">All Results</option><option value="SUCCESS">Success</option><option value="FAILED">Failed</option>
            </select>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-6">
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left min-w-[920px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Timestamp', 'Name', 'Email', 'Role', 'Action', 'Details', 'Result', 'Device'].map((h) => (
                    <th key={h} className="pb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-slate-400 text-sm">No events for these filters.</td></tr>}
                {shown.map((r) => (
                  <tr key={r.id} className={`transition-colors ${r.status === 'FAILED' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-gray-50/60'}`}>
                    <td className="py-3.5 text-[12px] text-slate-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3.5 text-[13px] font-bold text-slate-700">{r.name}</td>
                    <td className="py-3.5 text-[12px] text-slate-500">{r.email}</td>
                    <td className="py-3.5 text-[12px] font-medium text-slate-600 capitalize">{r.role}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${ACTION_TINT[CATEGORY_OF[r.action]] || 'bg-slate-100 text-slate-600'}`}>
                        {ACTION_LABEL[r.action] || r.action}
                      </span>
                    </td>
                    <td className="py-3.5 text-[12px] text-slate-500 max-w-[280px]">{isAuthEvent(r) ? '' : (r.reason || '')}</td>
                    <td className="py-3.5"><span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide ${r.status === 'SUCCESS' ? 'bg-[#D1F7E2] text-[#48A675]' : 'bg-[#FCE4E4] text-[#C55A5A]'}`}>{r.status}</span></td>
                    <td className="py-3.5 text-[12px] text-slate-400">{r.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {rows.length === 0 && <p className="py-8 text-center text-slate-400 text-sm">No events for these filters.</p>}
              {shown.map((r) => (
                <div key={r.id} className={`border rounded-xl p-4 ${r.status === 'FAILED' ? 'border-red-100 bg-red-50/40' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-700 truncate">{r.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{r.email}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide ${r.status === 'SUCCESS' ? 'bg-[#D1F7E2] text-[#48A675]' : 'bg-[#FCE4E4] text-[#C55A5A]'}`}>{r.status}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${ACTION_TINT[CATEGORY_OF[r.action]] || 'bg-slate-100 text-slate-600'}`}>{ACTION_LABEL[r.action] || r.action}</span>
                    <span className="text-[11px] text-slate-400 capitalize">{r.role}</span>
                  </div>
                  {!isAuthEvent(r) && r.reason && <p className="text-[12px] text-slate-500 mt-2">{r.reason}</p>}
                  <p className="text-[11px] text-slate-400 mt-2">{new Date(r.created_at).toLocaleString()} · {r.device}</p>
                </div>
              ))}
            </div>

            {rows.length > 0 && (
              <div className="flex items-center justify-between pt-5 mt-2 border-t border-gray-50">
                <span className="text-xs font-semibold text-slate-400">Showing {shown.length} of {rows.length}</span>
                {visible < rows.length && (
                  <button onClick={() => setVisible((v) => v + PAGE)} className="px-6 py-2.5 bg-[#800000] text-white rounded-lg font-bold text-sm hover:bg-[#600000] cursor-pointer">Load More</button>
                )}
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-4">Login IP is simulated in this prototype. Staff actions are recorded from the app; in production this would also be enforced server-side.</p>
        </main>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, accent = 'text-slate-800' }) => (
  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
    <p className={`text-3xl font-black ${accent}`}>{value}</p>
    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
  </div>
);

export default AuditLog;
