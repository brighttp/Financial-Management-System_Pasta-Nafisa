import React from "react";
import { formatIDR } from "../utils/currencyFormatter";

export default function ExpenseBreakdown({ financials }) {
  const { totalExpense = 0, expenseBreakdownList = [] } = financials || {};

  // Palette colors for category progress bars
  const barColors = [
    "bg-primary",
    "bg-inverse-surface",
    "bg-outline",
    "bg-secondary",
    "bg-amber-600",
  ];

  // If no expenses recorded yet
  const displayItems =
    expenseBreakdownList.length > 0
      ? expenseBreakdownList.slice(0, 4) // Show top 4 categories
      : [
          { name: "Bahan Baku (Pasta & Daging)", amount: 0, percentage: 0 },
          { name: "Operasional & Sewa", amount: 0, percentage: 0 },
          { name: "Kemasan / Packaging", amount: 0, percentage: 0 },
        ];

  return (
    <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-3.5 sm:p-4 md:p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm sm:text-headline-sm font-headline-sm font-bold text-on-surface">
            Beban Usaha
          </h3>
          <span className="material-symbols-outlined text-secondary text-lg sm:text-xl" title="Alokasi Beban">
            donut_large
          </span>
        </div>
        <p className="text-[11px] sm:text-body-sm font-body-sm text-secondary mb-3.5 sm:mb-4">
          Distribusi alokasi modal gerai
        </p>

        {/* Progress Distribution Stacks */}
        <div className="space-y-3.5">
          {displayItems.map((item, idx) => {
            const colorClass = barColors[idx % barColors.length];
            return (
              <div key={item.name}>
                <div className="flex justify-between text-body-sm font-body-sm mb-1">
                  <span className="text-on-surface font-medium truncate pr-2">
                    {item.name}
                  </span>
                  <span className="font-bold text-on-surface shrink-0">
                    {item.percentage}%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div
                    className={`${colorClass} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-label-sm font-label-sm text-secondary mt-0.5 text-right font-medium">
                  {formatIDR(item.amount)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-surface-variant/30 flex items-center justify-between text-label-md font-label-md">
        <span className="text-secondary">Total Beban:</span>
        <span className="text-primary font-bold">{formatIDR(totalExpense)}</span>
      </div>
    </div>
  );
}
