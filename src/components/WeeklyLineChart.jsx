import React, { useState } from "react";
import { formatIDR } from "../utils/currencyFormatter";

/**
 * Generate smooth cubic bezier SVG path between points
 * @param {Array<{x: number, y: number}>} points
 * @returns {string}
 */
function createSmoothPath(points) {
  if (!points || points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

/**
 * Generate closed area path for gradient filling
 * @param {Array<{x: number, y: number}>} points
 * @param {number} bottomY
 * @returns {string}
 */
function createAreaPath(points, bottomY = 140) {
  if (!points || points.length === 0) return "";
  const linePath = createSmoothPath(points);
  const firstX = points[0].x;
  const lastX = points[points.length - 1].x;
  return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
}

export default function WeeklyLineChart({ financials, periodLabel = "Bulan Ini" }) {
  const [activePointIndex, setActivePointIndex] = useState(null);

  const {
    weeklyData = {
      M1: { income: 0, expense: 0 },
      M2: { income: 0, expense: 0 },
      M3: { income: 0, expense: 0 },
      M4: { income: 0, expense: 0 },
    },
  } = financials || {};

  const weekKeys = [
    { key: "M1", label: "M1", dates: "1 - 7" },
    { key: "M2", label: "M2", dates: "8 - 14" },
    { key: "M3", label: "M3", dates: "15 - 21" },
    { key: "M4", label: "M4", dates: "22+" },
  ];

  // Extract raw values
  const rawValues = weekKeys.flatMap((w) => [
    weeklyData?.[w.key]?.income || 0,
    weeklyData?.[w.key]?.expense || 0,
  ]);
  const maxValue = Math.max(...rawValues, 500000); // minimum ceiling 500k

  // Chart layout dimensions
  const svgWidth = 500;
  const svgHeight = 160;
  const topY = 24;
  const bottomY = 136;
  const usableHeight = bottomY - topY;

  // Calculate coordinates for 4 points (M1, M2, M3, M4)
  // X coordinates: 50, 180, 310, 440
  const xCoords = [55, 185, 315, 445];

  const getY = (val) => {
    if (!val || val <= 0) return bottomY;
    const ratio = Math.min(1, Math.max(0, val / maxValue));
    return bottomY - ratio * usableHeight;
  };

  const incomePoints = weekKeys.map((w, idx) => ({
    x: xCoords[idx],
    y: getY(weeklyData?.[w.key]?.income || 0),
    value: weeklyData?.[w.key]?.income || 0,
    label: w.label,
    dates: w.dates,
  }));

  const expensePoints = weekKeys.map((w, idx) => ({
    x: xCoords[idx],
    y: getY(weeklyData?.[w.key]?.expense || 0),
    value: weeklyData?.[w.key]?.expense || 0,
    label: w.label,
    dates: w.dates,
  }));

  const incomeLinePath = createSmoothPath(incomePoints);
  const expenseLinePath = createSmoothPath(expensePoints);
  const incomeAreaPath = createAreaPath(incomePoints, bottomY);
  const expenseAreaPath = createAreaPath(expensePoints, bottomY);

  // Active hover info
  const activeWeek = activePointIndex !== null ? weekKeys[activePointIndex] : null;
  const activeIncome = activeWeek ? (weeklyData?.[activeWeek.key]?.income || 0) : 0;
  const activeExpense = activeWeek ? (weeklyData?.[activeWeek.key]?.expense || 0) : 0;

  // Find peak income week
  let peakWeek = "M1";
  let peakVal = 0;
  weekKeys.forEach((w) => {
    const inc = weeklyData?.[w.key]?.income || 0;
    if (inc > peakVal) {
      peakVal = inc;
      peakWeek = w.label;
    }
  });

  return (
    <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-3.5 sm:p-4 md:p-6 shadow-sm mb-4 sm:mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-headline-sm font-headline-sm font-bold text-on-surface">
              Tren Transaksi Mingguan
            </h3>
            <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
              Line Chart
            </span>
          </div>
          <p className="text-[11px] sm:text-body-sm font-body-sm text-secondary mt-0.5">
            Pergerakan kas masuk &amp; keluar per minggu ({periodLabel})
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded-full bg-tertiary"></span>
            <span className="text-xs font-semibold text-secondary">Pemasukan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded-full bg-primary"></span>
            <span className="text-xs font-semibold text-secondary">Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full">
        {/* Floating Tooltip when hovering/tapping a point */}
        {activePointIndex !== null && activeWeek && (
          <div
            className="absolute top-1 z-20 bg-inverse-surface/95 backdrop-blur-xs text-inverse-on-surface text-[10px] sm:text-xs px-2.5 py-1 rounded-lg shadow-md flex items-center gap-2 pointer-events-none animate-in fade-in duration-150 whitespace-nowrap"
            style={{
              left: `${Math.max(20, Math.min(80, (xCoords[activePointIndex] / svgWidth) * 100))}%`,
              transform: "translateX(-50%)",
            }}
          >
            <span className="font-bold">{activeWeek.label}:</span>
            <span className="text-emerald-300 font-semibold">+{formatIDR(activeIncome)}</span>
            <span className="text-rose-300 font-semibold">-{formatIDR(activeExpense)}</span>
          </div>
        )}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-40 sm:h-48 overflow-visible select-none"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Green Gradient (Pemasukan) */}
            <linearGradient id="lineIncomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
            </linearGradient>

            {/* Red Gradient (Pengeluaran) */}
            <linearGradient id="lineExpenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ba1a1a" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          <line
            x1="30"
            y1={topY}
            x2={svgWidth - 20}
            y2={topY}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1="30"
            y1={topY + usableHeight / 2}
            x2={svgWidth - 20}
            y2={topY + usableHeight / 2}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <line
            x1="30"
            y1={bottomY}
            x2={svgWidth - 20}
            y2={bottomY}
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />

          {/* Active Column Highlight Line */}
          {activePointIndex !== null && (
            <line
              x1={xCoords[activePointIndex]}
              y1={topY - 4}
              x2={xCoords[activePointIndex]}
              y2={bottomY}
              stroke="#64748b"
              strokeDasharray="3 3"
              strokeWidth="1.5"
              className="animate-in fade-in duration-150"
            />
          )}

          {/* Area Fills */}
          <path d={incomeAreaPath} fill="url(#lineIncomeGrad)" />
          <path d={expenseAreaPath} fill="url(#lineExpenseGrad)" />

          {/* Lines */}
          <path
            d={incomeLinePath}
            fill="none"
            stroke="#16a34a"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={expenseLinePath}
            fill="none"
            stroke="#ba1a1a"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Touch Target Columns */}
          {weekKeys.map((w, idx) => {
            const x = xCoords[idx];
            const colWidth = 70;
            return (
              <rect
                key={w.key}
                x={x - colWidth / 2}
                y={topY - 10}
                width={colWidth}
                height={usableHeight + 20}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActivePointIndex(idx)}
                onMouseLeave={() => setActivePointIndex(null)}
                onClick={() => setActivePointIndex((prev) => (prev === idx ? null : idx))}
              />
            );
          })}

          {/* Circles for Pemasukan (Green) */}
          {incomePoints.map((pt, idx) => {
            const isActive = activePointIndex === idx;
            return (
              <g key={`in-pt-${idx}`} className="pointer-events-none">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 6.5 : 4.5}
                  fill="#ffffff"
                  stroke="#16a34a"
                  strokeWidth={isActive ? 3.5 : 2.5}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}

          {/* Circles for Pengeluaran (Red) */}
          {expensePoints.map((pt, idx) => {
            const isActive = activePointIndex === idx;
            return (
              <g key={`out-pt-${idx}`} className="pointer-events-none">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 6.5 : 4.5}
                  fill="#ffffff"
                  stroke="#ba1a1a"
                  strokeWidth={isActive ? 3.5 : 2.5}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </svg>

        {/* X-Axis Labels (M1, M2, M3, M4) */}
        <div className="flex justify-between items-center px-6 sm:px-9 pt-1 border-t border-surface-variant/20">
          {weekKeys.map((w, idx) => {
            const isActive = activePointIndex === idx;
            return (
              <button
                key={w.key}
                onClick={() => setActivePointIndex((prev) => (prev === idx ? null : idx))}
                className={`flex flex-col items-center py-1 transition-all cursor-pointer ${
                  isActive ? "scale-105" : "hover:opacity-80"
                }`}
              >
                <span
                  className={`text-xs font-bold ${
                    isActive ? "text-primary font-extrabold" : "text-on-surface"
                  }`}
                >
                  {w.label}
                </span>
                <span className="text-[10px] text-secondary font-medium">
                  Tgl {w.dates}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-surface-variant/30 text-body-sm font-body-sm text-secondary flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs sm:text-body-sm">
          <span className="material-symbols-outlined text-sm text-tertiary">trending_up</span>
          <span>
            Puncak Pemasukan:{" "}
            <strong className="text-on-surface">
              {peakVal > 0 ? `${peakWeek} (${formatIDR(peakVal)})` : "Belum ada pemasukan"}
            </strong>
          </span>
        </div>
        <span className="text-xs text-secondary font-medium">
          Dihitung real-time dari 4 siklus minggu kalender
        </span>
      </div>
    </div>
  );
}

