// Reusable loading skeletons (shimmer via Tailwind's animate-pulse).
// Use in place of "Loading…" text so pages feel instant and don't jump.
import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded ${className}`} />
);

// Skeleton rows for a <tbody>. Pass the same colSpan/cols the table uses.
export const TableSkeleton = ({ rows = 8, cols = 4 }) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r} className="border-b border-gray-50 last:border-0">
        {Array.from({ length: cols }).map((_, c) => (
          <td key={c} className="py-6 px-4">
            <div className="h-4 rounded animate-pulse bg-slate-200/80" style={{ width: c === 0 ? '65%' : '45%' }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// A row of stat-card skeletons.
export const StatCardsSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-xl animate-pulse bg-slate-200/80" />
        <div className="flex-1 space-y-2.5">
          <div className="h-6 w-16 rounded animate-pulse bg-slate-200/80" />
          <div className="h-3 w-28 rounded animate-pulse bg-slate-200/80" />
        </div>
      </div>
    ))}
  </div>
);

// A generic stack of card skeletons (for editors / detail pages).
export const CardSkeleton = ({ lines = 3, className = '' }) => (
  <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8 ${className}`}>
    <div className="h-5 w-40 rounded animate-pulse bg-slate-200/80 mb-6" />
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded animate-pulse bg-slate-200/80" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  </div>
);

export default Skeleton;
