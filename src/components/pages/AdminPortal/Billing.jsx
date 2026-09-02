// src/components/pages/AdminPortal/Billing.jsx
// Admin → Billing. The bridge to Finance (the school's finance is handled
// off-system). Lists enrolled students, EXPORTS them to a CSV for Finance, and
// IMPORTS the returned CSV to update payment statuses automatically. Statuses
// can also be edited inline. Everything here is a record only — no money moves.
import { useEffect, useMemo, useRef, useState } from 'react';
import AdminSidebar from '../../AdminSidebar';
import { CardSkeleton } from '../../Skeleton';
import { useSession } from '../../../contexts/useSession';
import { applicantName } from '../../../lib/registrar';
import {
  listBillingRows, updateBilling, downloadBillingCsv, importBillingCsv,
  BILLING_STATUS, BILLING_ORDER, billingBalance,
} from '../../../lib/billing';

const peso = (v) => { const n = Number(v); return isNaN(n) || v === '' || v == null ? '—' : `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; };

const Billing = () => {
  const { session } = useSession();
  const [rows, setRows] = useState(null);
  const [year, setYear] = useState('All');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [edit, setEdit] = useState(null); // application being edited
  const [msg, setMsg] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const load = async () => setRows(await listBillingRows());
  useEffect(() => { load(); }, []);

  const years = useMemo(
    () => ['All', ...Array.from(new Set((rows || []).map((r) => r.school_year).filter(Boolean))).sort().reverse()],
    [rows]
  );

  const filtered = useMemo(() => (rows || []).filter((r) => {
    if (year !== 'All' && r.school_year !== year) return false;
    if (statusFilter !== 'all' && (r.billing?.status || 'not_assessed') !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return applicantName(r).toLowerCase().includes(q) || String(r.student_no || '').toLowerCase().includes(q);
  }), [rows, year, statusFilter, search]);

  const counts = useMemo(() => {
    const c = { total: (rows || []).length };
    BILLING_ORDER.forEach((k) => { c[k] = (rows || []).filter((r) => (r.billing?.status || 'not_assessed') === k).length; });
    return c;
  }, [rows]);

  const onExport = () => downloadBillingCsv(filtered, year);

  const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true); setMsg('');
    const text = await file.text();
    const res = await importBillingCsv(text, rows || [], session?.name || 'Admin');
    setImporting(false);
    if (!res.ok) { setMsg('⚠️ ' + res.error); return; }
    setMsg(`✓ Imported: ${res.updated} updated${res.skipped ? `, ${res.skipped} skipped` : ''}${res.misses?.length ? ` — no match for: ${res.misses.slice(0, 5).join(', ')}${res.misses.length > 5 ? '…' : ''}` : ''}.`);
    await load();
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="p-6 md:p-12 max-w-[1400px] w-full">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-2 h-10 bg-[#800000]" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Billing &amp; Finance</h1>
          </div>
          <p className="text-gray-500 text-sm ml-6 mb-8 max-w-3xl">
            Hand off enrolled students to Finance. <b>Export</b> the list, let Finance assess and collect
            payment offline, then <b>Import</b> their returned CSV to update payment statuses. Payments are
            recorded here — no money is processed in the system.
          </p>

          {msg && <div className={`mb-5 rounded-lg px-4 py-3 text-sm font-semibold ${msg.startsWith('⚠️') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}

          {/* Stat tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <Tile label="Enrolled" value={counts.total} />
            {BILLING_ORDER.map((k) => <Tile key={k} label={BILLING_STATUS[k].label} value={counts[k]} />)}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or student no…"
              className="flex-1 min-w-[220px] px-5 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm focus:outline-none focus:border-[#800000]" />
            <select value={year} onChange={(e) => setYear(e.target.value)} className="px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm text-slate-600 cursor-pointer">
              {years.map((y) => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm text-sm text-slate-600 cursor-pointer">
              <option value="all">All Statuses</option>
              {BILLING_ORDER.map((k) => <option key={k} value={k}>{BILLING_STATUS[k].label}</option>)}
            </select>
            <button onClick={onExport} disabled={!filtered.length} className="px-5 py-3 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold shadow disabled:opacity-50 cursor-pointer">📤 Export for Finance</button>
            <button onClick={() => fileRef.current?.click()} disabled={importing} className="px-5 py-3 bg-white border-2 border-[#800000] text-[#800000] hover:bg-[#800000]/5 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-50">{importing ? 'Importing…' : '📥 Import from Finance'}</button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onImportFile} className="hidden" />
          </div>

          {/* Table (desktop) + cards (mobile) */}
          {rows === null ? <CardSkeleton lines={6} /> : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-6">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left min-w-[880px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Student No', 'Name', 'Grade / Strand', 'Voucher', 'Status', 'Balance', 'OR No.', ''].map((h) => (
                        <th key={h} className="pb-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-slate-400 text-sm">No enrolled students match these filters.</td></tr>}
                    {filtered.map((r) => {
                      const b = r.billing || {}, st = BILLING_STATUS[b.status] || BILLING_STATUS.not_assessed;
                      const bal = billingBalance(b);
                      const voucher = r.form?.voucherApplicant === 'Yes';
                      return (
                        <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 text-[12px] font-mono text-slate-500">{r.student_no || '—'}</td>
                          <td className="py-3.5 text-[13px] font-bold text-slate-700">{applicantName(r)}</td>
                          <td className="py-3.5 text-[12px] text-slate-600">{r.form?.grade || r.grade_level}{r.form?.strand ? ` · ${r.form.strand}` : ''}</td>
                          <td className="py-3.5">{voucher ? <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-50 text-teal-600">{r.form?.voucherType || 'Voucher'}</span> : <span className="text-slate-300 text-xs">—</span>}</td>
                          <td className="py-3.5"><span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide ${st.cls}`}>{st.label.toUpperCase()}</span></td>
                          <td className="py-3.5 text-[12px] font-semibold text-slate-700">{bal == null ? '—' : peso(bal)}</td>
                          <td className="py-3.5 text-[12px] text-slate-500">{b.orNumber || '—'}</td>
                          <td className="py-3.5 text-right"><button onClick={() => setEdit(r)} className="px-4 py-2 rounded-lg text-[12px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">Edit</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.length === 0 && <p className="py-8 text-center text-slate-400 text-sm">No enrolled students match these filters.</p>}
                {filtered.map((r) => {
                  const b = r.billing || {}, st = BILLING_STATUS[b.status] || BILLING_STATUS.not_assessed;
                  const bal = billingBalance(b);
                  const voucher = r.form?.voucherApplicant === 'Yes';
                  return (
                    <div key={r.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-slate-700 truncate">{applicantName(r)}</p>
                          <p className="text-[11px] font-mono text-slate-400">{r.student_no || '—'} · {r.form?.grade || r.grade_level}{r.form?.strand ? ` · ${r.form.strand}` : ''}</p>
                        </div>
                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black tracking-wide ${st.cls}`}>{st.label.toUpperCase()}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[12px] text-slate-600">
                        <span>Balance: <b className="text-slate-800">{bal == null ? '—' : peso(bal)}</b></span>
                        <span>OR: {b.orNumber || '—'}</span>
                        {voucher && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-600">🎟️ {r.form?.voucherType || 'Voucher'}</span>}
                      </div>
                      <button onClick={() => setEdit(r)} className="mt-3 w-full py-2 rounded-lg text-[12px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer">Edit</button>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs font-semibold text-slate-400 pt-4">{filtered.length} of {counts.total} enrolled</p>
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-4">💡 Tip: Import matches rows to students by <b>Student No</b>. Keep that column intact in the file you send Finance.</p>
        </main>
      </div>

      {edit && <EditModal app={edit} staffName={session?.name || 'Admin'} onClose={() => setEdit(null)} onSaved={async () => { setEdit(null); await load(); }} />}
    </div>
  );
};

const EditModal = ({ app, staffName, onClose, onSaved }) => {
  const b = app.billing || {};
  const [status, setStatus] = useState(b.status || 'not_assessed');
  const [amountDue, setAmountDue] = useState(b.amountDue ?? '');
  const [amountPaid, setAmountPaid] = useState(b.amountPaid ?? '');
  const [orNumber, setOrNumber] = useState(b.orNumber || '');
  const [remarks, setRemarks] = useState(b.remarks || '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const res = await updateBilling(app.id, { status, amountDue, amountPaid, orNumber, remarks, updatedByName: staffName }, applicantName(app));
    setBusy(false);
    if (res.ok) onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-black text-slate-800">{applicantName(app)}</h3>
          <p className="text-xs text-slate-400">{app.student_no || '—'} · {app.form?.grade || app.grade_level}{app.form?.strand ? ` · ${app.form.strand}` : ''}
            {app.form?.voucherApplicant === 'Yes' ? ` · Voucher (${app.form?.voucherType || '—'})` : ''}</p>
        </div>
        <div className="p-6 space-y-4">
          <label className="block"><span className="block font-semibold text-xs text-gray-600 mb-1.5">Payment Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="ip">
              {BILLING_ORDER.map((k) => <option key={k} value={k}>{BILLING_STATUS[k].label}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block"><span className="block font-semibold text-xs text-gray-600 mb-1.5">Amount Due (₱)</span>
              <input className="ip" inputMode="decimal" value={amountDue} onChange={(e) => setAmountDue(e.target.value)} placeholder="0.00" /></label>
            <label className="block"><span className="block font-semibold text-xs text-gray-600 mb-1.5">Amount Paid (₱)</span>
              <input className="ip" inputMode="decimal" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0.00" /></label>
          </div>
          <label className="block"><span className="block font-semibold text-xs text-gray-600 mb-1.5">OR Number</span>
            <input className="ip" value={orNumber} onChange={(e) => setOrNumber(e.target.value)} placeholder="Official Receipt no." /></label>
          <label className="block"><span className="block font-semibold text-xs text-gray-600 mb-1.5">Remarks</span>
            <textarea className="ip" style={{ minHeight: 64 }} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional note (e.g. installment plan)" /></label>
        </div>
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-bold text-slate-600 hover:bg-gray-100 cursor-pointer">Cancel</button>
          <button onClick={save} disabled={busy} className="px-6 py-2.5 bg-[#800000] hover:bg-[#600000] text-white rounded-xl text-sm font-bold disabled:opacity-60 cursor-pointer">{busy ? 'Saving…' : 'Save'}</button>
        </div>
        <style>{`.ip{width:100%;border:1px solid #E5E7EB;border-radius:.6rem;padding:.6rem .8rem;font-size:.9rem;outline:none;background:#fff}.ip:focus{border-color:#800000}`}</style>
      </div>
    </div>
  );
};

const Tile = ({ label, value }) => (
  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
    <p className="text-2xl font-black text-slate-800">{value}</p>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
  </div>
);

export default Billing;
