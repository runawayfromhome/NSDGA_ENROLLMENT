// src/components/pages/HeadAdminPortal/AuditLog.jsx
// HeadAdmin feature #2: the LOGIN audit log for Registrar & Admin (and HeadAdmin).
// Reads every login/logout event recorded by authStore and lets HeadAdmin
// search + filter it. Failed attempts are highlighted so break-in attempts stand out.
import { useMemo, useState, useEffect } from 'react';
import HeadAdminSidebar from '../../HeadAdminSidebar';
import { getAuditLog } from '../../../auth/authStore';

const ACTION_LABEL = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
};

const AuditLog = () => {
  const [log, setLog] = useState([]);
  useEffect(() => { (async () => setLog(await getAuditLog()))(); }, []);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const rows = useMemo(() => {
    return log.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'all' || r.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [log, search, roleFilter, statusFilter]);

  const today = new Date().toDateString();
  const loginsToday = log.filter((r) => r.action === 'LOGIN' && r.status === 'SUCCESS' && new Date(r.created_at).toDateString() === today).length;
  const failedToday = log.filter((r) => r.status === 'FAILED' && new Date(r.created_at).toDateString() === today).length;

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <HeadAdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="p-6 md:p-12 max-w-[1400px]">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Login Audit Log</h1>
            <p className="text-slate-500 text-sm">Every sign-in and sign-out for Registrar &amp; Admin accounts.</p>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl">
            <StatTile label="Logins Today" value={loginsToday} />
            <StatTile label="Failed Today" value={failedToday} accent="text-[#C55A5A]" />
            <StatTile label="Total Events" value={log.length} />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="flex-1 min-w-[220px] px-5 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm focus:outline-none focus:border-[#800000]"
            />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm text-slate-600 cursor-pointer">
              <option value="all">All Roles</option>
              <option value="registrar">Registrar</option>
              <option value="admin">Admin</option>
              <option value="headadmin">HeadAdmin</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm text-slate-600 cursor-pointer">
              <option value="all">All Results</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-6 overflow-x-auto">
            <table className="w-full text-left min-w-[860px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Timestamp', 'Name', 'Email', 'Role', 'Action', 'Result', 'IP Address', 'Device'].map((h) => (
                    <th key={h} className="pb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="py-10 text-center text-slate-400 text-sm">No matching events.</td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className={`transition-colors ${r.status === 'FAILED' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-gray-50/60'}`}>
                    <td className="py-3.5 text-[12px] text-slate-500 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3.5 text-[13px] font-bold text-slate-700">{r.name}</td>
                    <td className="py-3.5 text-[12px] text-slate-500">{r.email}</td>
                    <td className="py-3.5 text-[12px] font-medium text-slate-600 capitalize">{r.role}</td>
                    <td className="py-3.5 text-[12px] text-slate-600">{ACTION_LABEL[r.action] || r.action}</td>
                    <td className="py-3.5">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide ${r.status === 'SUCCESS' ? 'bg-[#D1F7E2] text-[#48A675]' : 'bg-[#FCE4E4] text-[#C55A5A]'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-[12px] text-slate-400 font-mono">{r.ip}</td>
                    <td className="py-3.5 text-[12px] text-slate-400">{r.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 mt-4">
            IP address is simulated in this prototype. In production it would be captured server-side.
          </p>
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
