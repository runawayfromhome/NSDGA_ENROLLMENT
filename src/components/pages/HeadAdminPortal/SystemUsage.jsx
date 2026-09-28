// HeadAdmin → System Usage: at-a-glance view of all free-tier resources
// (storage, accounts, records) plus the email service + SMTP reference.
import { useEffect, useState } from 'react';
import HeadAdminSidebar from '../../HeadAdminSidebar';
import { getUsage } from '../../../lib/registrar';
import { CardSkeleton } from '../../Skeleton';
import {
  HiOutlineDatabase, HiOutlineUserGroup, HiOutlineDocumentText, HiOutlineMail, HiOutlineExternalLink,
} from 'react-icons/hi';

const FREE_STORAGE = 1024 * 1024 * 1024; // 1 GB
const FREE_MAU = 50000;
const bar = (pct, danger = 80) => (
  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
    <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: pct < danger ? '#800000' : '#C55A5A' }} />
  </div>
);

const SystemUsage = () => {
  const [u, setU] = useState(null);
  useEffect(() => { getUsage().then(setU); }, []);

  const usedMB = u ? u.storage.bytes / (1024 * 1024) : 0;
  const storagePct = u ? (u.storage.bytes / FREE_STORAGE) * 100 : 0;
  const accountsPct = u ? (u.accounts.total / FREE_MAU) * 100 : 0;

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <HeadAdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="px-6 pt-20 pb-8 md:p-12 max-w-[1100px]">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">System Usage</h1>
            <p className="text-slate-500 text-sm">Your free-tier resources at a glance. Everything here is on free plans.</p>
          </div>

          {!u && <div className="space-y-6"><CardSkeleton lines={2} /><CardSkeleton lines={2} /><CardSkeleton lines={2} /></div>}

          {u && (
            <div className="space-y-6">
              {/* Storage */}
              <Card icon={HiOutlineDatabase} title="Document Storage" tag="Supabase Storage · 1 GB free">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-2xl font-black text-slate-800">{usedMB.toFixed(1)} <span className="text-sm font-bold text-slate-400">MB used</span></span>
                  <span className="text-sm font-bold text-slate-500">{u.storage.files} file{u.storage.files === 1 ? '' : 's'} · {storagePct.toFixed(1)}% of 1 GB</span>
                </div>
                {bar(storagePct)}
                <p className="text-[12px] text-slate-400 mt-2">{storagePct >= 80 ? 'Approaching the limit — archive old files or upgrade.' : 'Plenty of room. This is usually the first limit a growing school reaches.'}</p>
              </Card>

              {/* Accounts */}
              <Card icon={HiOutlineUserGroup} title="Accounts" tag="Supabase Auth · 50,000 monthly users free">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-2xl font-black text-slate-800">{u.accounts.total} <span className="text-sm font-bold text-slate-400">accounts</span></span>
                  <span className="text-sm font-bold text-slate-500">{u.accounts.students} students · {u.accounts.staff} staff</span>
                </div>
                {bar(accountsPct)}
                <p className="text-[12px] text-slate-400 mt-2">Effectively unlimited for a school — you're at {accountsPct.toFixed(2)}% of the free monthly-active-users allowance.</p>
              </Card>

              {/* Records */}
              <Card icon={HiOutlineDocumentText} title="Records" tag="Supabase Database · 500 MB free">
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-black text-slate-800">{u.applications} <span className="text-sm font-bold text-slate-400">applications</span></span>
                  <span className="text-sm font-bold text-slate-500">rows are tiny (~1 KB each)</span>
                </div>
                <p className="text-[12px] text-slate-400 mt-2">Hundreds of thousands of records fit in the free 500 MB — not a concern.</p>
              </Card>

              {/* Email + SMTP */}
              <Card icon={HiOutlineMail} title="Email &amp; SMTP" tag="Brevo · 300 emails/day free">
                <p className="text-sm text-slate-600 mb-4">Enrollment / correction / rejection emails send through <b>Brevo</b> (free tier: <b>300 emails/day</b>, resets daily). Live send counts are on your Brevo dashboard.</p>
                <a href="https://app.brevo.com/statistics/email" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#800000] font-bold text-sm mb-5">
                  View Brevo email stats <HiOutlineExternalLink size={15} />
                </a>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">SMTP relay (for Supabase auth emails)</p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-sm">
                    <Row k="Host" v="smtp-relay.brevo.com" />
                    <Row k="Port" v="587 (TLS)" />
                    <Row k="Username" v="your Brevo SMTP login" />
                    <Row k="Password" v="your Brevo SMTP key" />
                  </dl>
                  <p className="text-[12px] text-slate-400 mt-3">Find your SMTP login/key in Brevo → <b>SMTP &amp; API → SMTP</b>. Paste these into <b>Supabase → Authentication → SMTP Settings</b> to route password-reset &amp; other auth emails through Brevo (no rate limit).</p>
                </div>
              </Card>

              <p className="text-[11px] text-slate-400 text-center pt-2">Also free: Vercel (hosting) · Supabase Edge Functions (500K calls/mo). Figures reflect current data; provider limits may change.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const Card = ({ icon: Icon, title, tag, children }) => (
  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center"><Icon className="text-[#800000]" size={22} /></div>
      <div>
        <h2 className="text-lg font-bold text-slate-800 leading-tight">{title}</h2>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{tag}</p>
      </div>
    </div>
    {children}
  </div>
);
const Row = ({ k, v }) => (
  <div className="flex gap-2"><dt className="text-slate-400 w-24 shrink-0">{k}:</dt><dd className="font-semibold text-slate-700 font-mono text-[13px]">{v}</dd></div>
);

export default SystemUsage;
