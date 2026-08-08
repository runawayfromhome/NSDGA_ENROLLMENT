// src/components/pages/HeadAdminPortal/Reports.jsx
// HeadAdmin feature #3: school-wide reports & analytics — FRONT-END ONLY.
// All numbers here are sample/mock data. No backend is connected; this page is
// the visual shell that a real analytics API would later feed.
import HeadAdminSidebar from '../../HeadAdminSidebar';
import {
  HiOutlineUserAdd,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineAcademicCap,
} from 'react-icons/hi';

// --- sample data (replace with real API results later) ---
const KPIS = [
  { label: 'Total Applications', value: '1,284', icon: HiOutlineUserAdd, tint: 'bg-red-50 text-[#800000]' },
  { label: 'Approved', value: '842', icon: HiOutlineCheckCircle, tint: 'bg-green-50 text-[#48A675]' },
  { label: 'Pending Review', value: '310', icon: HiOutlineClock, tint: 'bg-yellow-50 text-[#9A9E4C]' },
  { label: 'Enrolled', value: '798', icon: HiOutlineAcademicCap, tint: 'bg-blue-50 text-[#3B67B8]' },
];

const MONTHLY = [
  { m: 'Jan', v: 60 }, { m: 'Feb', v: 95 }, { m: 'Mar', v: 140 }, { m: 'Apr', v: 210 },
  { m: 'May', v: 180 }, { m: 'Jun', v: 120 }, { m: 'Jul', v: 240 }, { m: 'Aug', v: 90 },
];

const BY_LEVEL = [
  { label: 'Kindergarten', value: 12 },
  { label: 'Elementary', value: 34 },
  { label: 'Junior High', value: 31 },
  { label: 'Senior High', value: 23 },
];

const STATUS = [
  { label: 'Approved', value: 66, color: '#48A675' },
  { label: 'Pending', value: 24, color: '#9A9E4C' },
  { label: 'Needs Correction', value: 10, color: '#C55A5A' },
];

const Reports = () => {
  const maxMonthly = Math.max(...MONTHLY.map((d) => d.v));

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <HeadAdminSidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <main className="p-6 md:p-12 max-w-[1400px]">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">Reports &amp; Analytics</h1>
              <p className="text-slate-500 text-sm">School-wide enrollment overview — Academic Year 2026–2027.</p>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
              Sample data · backend not connected
            </span>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {KPIS.map((k) => (
              <div key={k.label} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${k.tint}`}>
                  <k.icon size={28} />
                </div>
                <div>
                  <p className="text-3xl font-black text-slate-800">{k.value}</p>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly bar chart (pure CSS, no chart library) */}
            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Applications per Month</h2>
              <div className="flex items-end justify-between gap-3 h-56">
                {MONTHLY.map((d) => (
                  <div key={d.m} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                    <div
                      className="w-full rounded-t-lg bg-[#800000]/85 hover:bg-[#800000] transition-all"
                      style={{ height: `${(d.v / maxMonthly) * 100}%` }}
                      title={`${d.v} applications`}
                    />
                    <span className="text-[11px] font-bold text-slate-400">{d.m}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status distribution */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Status Distribution</h2>
              <div className="space-y-5">
                {STATUS.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-[12px] font-semibold text-slate-600 mb-1.5">
                      <span>{s.label}</span><span>{s.value}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* By level */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8 mt-6">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Enrollment by Level (%)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {BY_LEVEL.map((b) => (
                <div key={b.label} className="text-center">
                  <p className="text-4xl font-black text-[#800000]">{b.value}%</p>
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mt-1">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
