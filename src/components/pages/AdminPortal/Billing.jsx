// src/components/pages/AdminPortal/Billing.jsx
// Admin → Finance Export. Finance is OUT of this system's scope — the school
// does NOT assess, collect, or track payment here. This page only HANDS OFF the
// enrolled list for the active school year to the Finance office as a CSV; all
// assessment and collection happen in Finance's own system. Read-only: no status
// is stored or edited, and it follows the Admin's active school year, so each new
// year starts clean (only that year's enrolled students are shown).
import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../AdminSidebar';
import { CardSkeleton } from '../../Skeleton';
import { applicantName } from '../../../lib/registrar';
import { listBillingRows, downloadBillingCsv } from '../../../lib/billing';
import { getActiveSchoolYear } from '../../../lib/content';
import { HiOutlineDownload, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';

const PAGE_SIZE = 20;

const Billing = () => {
  const [rows, setRows] = useState(null);
  const [activeYear, setActiveYear] = useState(''); // admin-set school year — only this year's records show
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { listBillingRows().then(setRows); }, []);
  useEffect(() => { getActiveSchoolYear().then(setActiveYear); }, []);

  const filtered = useMemo(() => (rows || []).filter((r) => {
    if (activeYear && r.school_year !== activeYear) return false; // active year only
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return applicantName(r).toLowerCase().includes(q) || String(r.student_no || '').toLowerCase().includes(q);
  }), [rows, activeYear, search]);

  useEffect(() => { setPage(1); }, [search, activeYear]); // reset to first page when the result set changes

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const onExport = () => downloadBillingCsv(filtered, activeYear); // exports the whole filtered set, not just this page

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="p-6 md:p-12 max-w-[1200px] w-full">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-2 h-10 bg-[#800000]" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Finance Export</h1>
          </div>
          <p className="text-gray-500 text-sm ml-6 mb-6 max-w-3xl">
            Finance is handled by the <b>Finance office</b>, not this system. This page only exports the
            enrolled list for the active school year so Finance can assess and collect payments in their own
            records. <b>Nothing is stored or edited here</b> — no amounts, no payment status.
          </p>

          {/* Active school year — follows the Admin setting, read-only */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Year</p>
              <p className="text-lg font-bold text-slate-800">{activeYear || '…'} <span className="text-[11px] font-semibold text-slate-400">(set by Admin · Enrollment)</span></p>
            </div>
            <button onClick={onExport} disabled={!filtered.length}
              className="flex items-center gap-2 px-6 py-3 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold shadow disabled:opacity-50 cursor-pointer">
              <HiOutlineDownload size={18} /> Export enrolled list for Finance
            </button>
          </div>

          {/* Search */}
          <div className="mb-5">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or student no…"
              className="w-full max-w-md px-5 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm focus:outline-none focus:border-[#800000]" />
          </div>

          {rows === null ? <CardSkeleton lines={6} /> : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-6">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left min-w-[640px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Student No', 'Name', 'Grade / Strand', 'Voucher'].map((h) => (
                        <th key={h} className="pb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 && <tr><td colSpan={4} className="py-10 text-center text-slate-400 text-sm">No enrolled students for this school year.</td></tr>}
                    {paged.map((r) => {
                      const voucher = r.form?.voucherApplicant === 'Yes';
                      return (
                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 text-[12px] font-mono text-slate-500">{r.student_no || '—'}</td>
                          <td className="py-3.5 text-[13px] font-bold text-slate-700">{applicantName(r)}</td>
                          <td className="py-3.5 text-[12px] text-slate-600">{r.form?.grade || r.grade_level}{r.form?.strand ? ` · ${r.form.strand}` : ''}</td>
                          <td className="py-3.5">{voucher ? <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-50 text-teal-600">{r.form?.voucherType || 'Voucher'}</span> : <span className="text-slate-300 text-xs">—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.length === 0 && <p className="py-8 text-center text-slate-400 text-sm">No enrolled students for this school year.</p>}
                {paged.map((r) => {
                  const voucher = r.form?.voucherApplicant === 'Yes';
                  return (
                    <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-slate-700 truncate">{applicantName(r)}</p>
                          <p className="text-[11px] font-mono text-slate-400">{r.student_no || '—'} · {r.form?.grade || r.grade_level}{r.form?.strand ? ` · ${r.form.strand}` : ''}</p>
                        </div>
                        {voucher && <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-600">🎟️ {r.form?.voucherType || 'Voucher'}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                <p className="text-xs font-semibold text-slate-400">{filtered.length} enrolled · S.Y. {activeYear || '—'}</p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                      <HiOutlineChevronLeft size={14} /> Prev
                    </button>
                    <span className="text-xs font-semibold text-slate-500">Page {safePage} of {totalPages}</span>
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-slate-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                      Next <HiOutlineChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-4">💡 The export lists this year's enrolled students (name, student no., grade, voucher tag) for the Finance office to assess and collect on their side.</p>
        </main>
      </div>
    </div>
  );
};

export default Billing;
