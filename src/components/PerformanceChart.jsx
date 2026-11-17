import React from "react";
import { formatIDR } from "../utils/currencyFormatter";

export default function PerformanceChart({ financials, periodLabel = "Bulan Ini" }) {
  const {
    weeklyAverage = 0,
    netSurplus = 0,
    weeklyData = {
      M1: { income: 0, expense: 0 },
      M2: { income: 0, expense: 0 },
      M3: { income: 0, expense: 0 },
      M4: { income: 0, expense: 0 },
    },
  } = financials || {};

  // Find max value across weeks to normalize heights dynamically
  const allValues = [
    weeklyData?.M1?.income || 0,
    weeklyData?.M1?.expense || 0,
    weeklyData?.M2?.income || 0,
    weeklyData?.M2?.expense || 0,
    weeklyData?.M3?.income || 0,
    weeklyData?.M3?.expense || 0,
    weeklyData?.M4?.income || 0,
    weeklyData?.M4?.expense || 0,
  ];
  const maxValue = Math.max(...allValues, 1000000); // at least 1M ceiling

  const calcHeight = (val) => {
    if (!val || val <= 0) return "4px";
    const pct = Math.min(95, Math.max(8, Math.round((val / maxValue) * 100)));
    return `${pct}%`;
  };

  const weeks = [
    {
      label: "M1",
      income: weeklyData?.M1?.income || 0,
      expense: weeklyData?.M1?.expense || 0,
      inHeight: calcHeight(weeklyData?.M1?.income),
      outHeight: calcHeight(weeklyData?.M1?.expense),
    },
    {
      label: "M2",
      income: weeklyData?.M2?.income || 0,
      expense: weeklyData?.M2?.expense || 0,
      inHeight: calcHeight(weeklyData?.M2?.income),
      outHeight: calcHeight(weeklyData?.M2?.expense),
    },
    {
      label: "M3",
      income: weeklyData?.M3?.income || 0,
      expense: weeklyData?.M3?.expense || 0,
      inHeight: calcHeight(weeklyData?.M3?.income),
      outHeight: calcHeight(weeklyData?.M3?.expense),
    },
    {
      label: "M4",
      income: weeklyData?.M4?.income || 0,
      expense: weeklyData?.M4?.expense || 0,
      inHeight: calcHeight(weeklyData?.M4?.income),
      outHeight: calcHeight(weeklyData?.M4?.expense),
    },
  ];

  return (
    <div className="lg:col-span-2 bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-3.5 sm:p-4 md:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
        <div>
          <h3 className="text-sm sm:text-headline-sm font-headline-sm font-bold text-on-surface">
            Performa Bisnis (Income vs Expense)
          </h3>
          <p className="text-[11px] sm:text-body-sm font-body-sm text-secondary">
            Perbandingan periodik operasional {periodLabel}
          </p>
        </div>
        {/* Chart Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-tertiary"></span>
            <span className="text-label-sm font-label-sm text-secondary">Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-primary"></span>
            <span className="text-label-sm font-label-sm text-secondary">Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* Bar Visual Representation */}
      <div className="h-48 flex items-end justify-between gap-4 pt-6 pb-2 border-b border-surface-variant/30 px-2">
        {weeks.map((w) => (
          <div
            key={w.label}
            className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
          >
            <div className="w-full flex items-end justify-center gap-1.5 h-36">
              {/* Green Income Bar */}
              <div
                className="w-4 sm:w-6 bg-tertiary rounded-t-md hover:opacity-90 transition-all duration-300 relative group/in"
                style={{ height: w.inHeight }}
                title={`${w.label} In: ${formatIDR(w.income)}`}
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/in:flex bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10 pointer-events-none">
                  {formatIDR(w.income)}
                </div>
              </div>
              {/* Red Expense Bar */}
              <div
                className="w-4 sm:w-6 bg-primary rounded-t-md hover:opacity-90 transition-all duration-300 relative group/out"
                style={{ height: w.outHeight }}
                title={`${w.label} Out: ${formatIDR(w.expense)}`}
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover/out:flex bg-inverse-surface text-inverse-on-surface text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10 pointer-events-none">
                  {formatIDR(w.expense)}
                </div>
              </div>
            </div>
            <span className="text-label-sm font-label-sm text-secondary group-hover:text-on-surface font-medium transition-colors">
              {w.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 text-body-sm font-body-sm text-secondary flex-wrap gap-2">
        <span>
          Rata-rata Mingguan:{" "}
          <strong className="text-on-surface">{formatIDR(weeklyAverage)}</strong>
        </span>
        <span className="text-tertiary font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">verified</span> Net Surplus{" "}
          {netSurplus >= 0 ? `+${netSurplus}%` : `${netSurplus}%`}
        </span>
      </div>
    </div>
  );
}
