import React from "react";
import { formatIDR } from "../utils/currencyFormatter";

export default function KpiCards({
  financials,
  lastUpdated = "Real-time Supabase",
  comparisons,
}) {
  const {
    totalIncome = 0,
    totalExpense = 0,
    netProfit = 0,
    netCashFlow = 0,
    netMargin = 0,
    financialStatus = {
      label: "Sehat / Likuid",
      bgClass: "bg-tertiary/10 text-tertiary",
      dotClass: "bg-tertiary",
    },
  } = financials || {};

  const incomeComp = comparisons?.income;
  const expenseComp = comparisons?.expense;
  const compLabel = comparisons?.periodLabel || "vs periode lalu";

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-headline-sm font-headline-sm text-on-surface">
          Ikhtisar Kas &amp; Margin
        </h2>
        <span className="text-[11px] sm:text-label-sm font-label-sm text-secondary">
          Diperbarui: {lastUpdated}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4">
        {/* KPI 1: Total Pemasukan */}
        <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-3 sm:p-4 shadow-sm hover:border-outline/40 transition-colors">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-label-md font-semibold text-secondary">
              Total Pemasukan
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-tertiary-fixed/30 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-sm sm:text-base">arrow_downward_alt</span>
            </div>
          </div>
          <div className="text-[19px] sm:text-numeric-stat-mobile font-numeric-stat-mobile text-on-surface tracking-tight mb-1.5 sm:mb-2 font-bold">
            {formatIDR(totalIncome)}
          </div>
          <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-label-sm font-label-sm bg-tertiary/10 text-tertiary font-semibold truncate max-w-full">
            <span className="material-symbols-outlined text-[13px]">
              {incomeComp?.direction === "down" ? "trending_down" : "trending_up"}
            </span>
            <span className="truncate">
              {incomeComp ? `${incomeComp.formatted} ${compLabel}` : "Arus Kas Masuk"}
            </span>
          </div>
        </div>

        {/* KPI 2: Total Pengeluaran */}
        <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-3 sm:p-4 shadow-sm hover:border-outline/40 transition-colors">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-label-md font-semibold text-secondary">
              Total Pengeluaran
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-error-container/40 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-sm sm:text-base">arrow_upward_alt</span>
            </div>
          </div>
          <div className="text-[19px] sm:text-numeric-stat-mobile font-numeric-stat-mobile text-on-surface tracking-tight mb-1.5 sm:mb-2 font-bold">
            {formatIDR(totalExpense)}
          </div>
          <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-label-sm font-label-sm bg-error-container text-primary font-semibold truncate max-w-full">
            <span className="material-symbols-outlined text-[13px]">
              {expenseComp?.direction === "up" ? "trending_up" : "trending_down"}
            </span>
            <span className="truncate">
              {expenseComp ? `${expenseComp.formatted} ${compLabel}` : "Beban Operasional"}
            </span>
          </div>
        </div>

        {/* KPI 3: Laba Bersih */}
        <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-3 sm:p-4 shadow-sm hover:border-outline/40 transition-colors">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-label-md font-semibold text-secondary">
              Laba Bersih
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
              <span className="material-symbols-outlined text-sm sm:text-base">account_balance_wallet</span>
            </div>
          </div>
          <div className={`text-[19px] sm:text-numeric-stat-mobile font-numeric-stat-mobile tracking-tight mb-1.5 sm:mb-2 font-bold ${
            netProfit >= 0 ? "text-primary" : "text-primary font-extrabold"
          }`}>
            {formatIDR(netProfit)}
          </div>
          <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-label-sm font-label-sm bg-surface-container text-on-secondary-fixed font-semibold truncate max-w-full">
            <span className="material-symbols-outlined text-[13px]">pie_chart</span>
            <span className="truncate">Margin Bersih {netMargin}%</span>
          </div>
        </div>

        {/* KPI 4: Arus Kas Bersih */}
        <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-xl p-3 sm:p-4 shadow-sm hover:border-outline/40 transition-colors">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-xs sm:text-label-md font-semibold text-secondary">
              Arus Kas Bersih
            </span>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${
              netCashFlow >= 0 ? "bg-tertiary-fixed/30 text-tertiary" : "bg-error-container text-primary"
            }`}>
              <span className="material-symbols-outlined text-sm sm:text-base">
                {netCashFlow >= 0 ? "check_circle" : "warning"}
              </span>
            </div>
          </div>
          <div className="text-[19px] sm:text-numeric-stat-mobile font-numeric-stat-mobile text-on-surface tracking-tight mb-1.5 sm:mb-2 font-bold">
            {formatIDR(netCashFlow)}
          </div>
          <div className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-label-sm font-label-sm font-semibold truncate max-w-full ${
            financialStatus.bgClass
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${financialStatus.dotClass}`}></span>
            <span className="truncate">{financialStatus.label}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
