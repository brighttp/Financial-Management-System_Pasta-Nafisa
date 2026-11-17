import React, { useState, useMemo } from "react";
import { formatIDR } from "../utils/currencyFormatter";
import { exportTransactionsToCSV, exportTransactionsToPDF } from "../services/reportService";
import { useBusiness } from "../hooks/useBusiness";
import { useAuth } from "../hooks/useAuth";

export default function ReportView({
  transactions = [],
  financials,
  onBackToDashboard,
  _customDateRange,
  onOpenDateRangeModal,
  selectedPeriodLabel = "Bulan Ini",
}) {
  const { business, outlets, selectedOutlet } = useBusiness();
  const { user } = useAuth();

  const [activeReportTab, setActiveReportTab] = useState("laba-rugi"); // "laba-rugi" | "arus-kas"

  const {
    totalIncome = 0,
    totalExpense = 0,
    netProfit = 0,
    netCashFlow = 0,
    netMargin = 0,
    financialStatus = { label: "Sehat / Likuid" },
  } = financials || {};

  // Group real transactions by category for Report breakdown
  const { incomeCategories, expenseCategories } = useMemo(() => {
    const incMap = {};
    const expMap = {};

    transactions.forEach((tx) => {
      const cat = tx.category_name || tx.category || "Lain-lain";
      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") {
        incMap[cat] = (incMap[cat] || 0) + amt;
      } else {
        expMap[cat] = (expMap[cat] || 0) + amt;
      }
    });

    const incList = Object.entries(incMap).map(([name, amount]) => ({ name, amount }));
    const expList = Object.entries(expMap).map(([name, amount]) => ({ name, amount }));

    return { incomeCategories: incList, expenseCategories: expList };
  }, [transactions]);

  const getOutletName = () => {
    if (selectedOutlet === "all") return "Semua Gerai (Konsolidasi)";
    const found = outlets.find((o) => o.id === selectedOutlet);
    return found ? found.name : "Gerai Utama Sukapura";
  };

  // Export real CSV / Excel
  const handleExportExcel = () => {
    exportTransactionsToCSV(
      transactions,
      `Laporan_Keuangan_Pasta_Nafisa_${getOutletName().replace(/\s+/g, "_")}`
    );
  };

  const handleExportPDF = () => {
    exportTransactionsToPDF({
      transactions,
      financials: {
        totalIncome,
        totalExpense,
        netProfit,
        netCashFlow,
        netMargin,
        financialStatus,
      },
      businessName: business?.name || "Pasta Nafisa",
      outletName: getOutletName(),
      periodLabel: selectedPeriodLabel,
      userEmail: user?.email || "Owner Pasta Nafisa",
    });
  };

  return (
    <div className="w-full">
      {/* TOP APP BAR */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#161b26] to-slate-900 border border-white/10 shadow-xl shadow-slate-950/25 mb-4 sm:mb-6 text-white w-full max-w-md mx-auto transition-all">
        {/* Ambient Decorative Glow Lights */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-center w-full px-3.5 sm:px-4 py-3">
          {/* Leading Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBackToDashboard}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-sm shrink-0"
              title="Kembali ke Dashboard"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div
              aria-label="Pasta Nafisa Logo Mark"
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary via-rose-600 to-rose-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-primary/30 ring-1 ring-white/25 select-none shrink-0 tracking-wider"
            >
              PN
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base font-bold text-white tracking-tight truncate">
                  {business?.name || "Pasta Nafisa"}
                </span>
                <span className="bg-primary/20 text-rose-300 border border-primary/40 px-1.5 py-0.2 rounded text-[10px] font-bold">
                  UMKM
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium truncate">
                {getOutletName()}
              </span>
            </div>
          </div>

          {/* Trailing: Verified live audit badge (Bell Removed) */}
          <div className="flex items-center gap-1.5 relative shrink-0 ml-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span>Audit Real-Time</span>
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CANVAS */}
      <main className="w-full max-w-md mx-auto px-1 sm:px-2 pt-1 space-y-3.5 pb-16">
        {/* SUBHEADER: TITLE & EXPORT BUTTONS */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-headline-md font-headline-md font-bold text-on-surface leading-tight truncate">
              Laporan Keuangan
            </h1>
            <p className="text-xs sm:text-body-sm font-body-sm text-secondary truncate">
              Pencatatan Berbasis Kas ({selectedPeriodLabel})
            </p>
          </div>

          {/* Export CTA Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-container-lowest border border-surface-variant/80 rounded-xl text-secondary hover:text-primary hover:border-primary transition-colors text-xs font-semibold shadow-xs active:scale-95 duration-150 cursor-pointer"
              type="button"
              title="Unduh / Cetak Laporan PDF"
            >
              <span className="material-symbols-outlined text-[15px] text-primary">download</span>
              <span>PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-surface-container-lowest border border-surface-variant/80 rounded-xl text-secondary hover:text-tertiary hover:border-tertiary transition-colors text-xs font-semibold shadow-xs active:scale-95 duration-150 cursor-pointer"
              type="button"
              title="Unduh Spreadsheet Excel (.csv)"
            >
              <span className="material-symbols-outlined text-[15px] text-tertiary">table_view</span>
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* NOTICE: Simplified Cash-based Accounting */}
        <div className="p-3 bg-surface-container-low border border-surface-variant/40 rounded-xl flex items-center justify-between text-xs text-secondary">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">info</span>
            <span>Laporan disajikan berdasarkan kas aktual transaksi tercatat.</span>
          </div>
          {onOpenDateRangeModal && (
            <button
              onClick={onOpenDateRangeModal}
              className="text-primary font-semibold hover:underline cursor-pointer shrink-0 ml-1"
            >
              Ubah Tanggal
            </button>
          )}
        </div>

        {/* SEGMENTED REPORT TABS */}
        <div className="bg-surface-container-low p-1 rounded-xl flex items-center shadow-inner">
          <button
            onClick={() => setActiveReportTab("laba-rugi")}
            className={`flex-1 py-2 rounded-lg font-headline-sm text-label-md font-semibold text-center relative transition-all cursor-pointer ${
              activeReportTab === "laba-rugi"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-secondary hover:text-on-surface font-medium"
            }`}
            type="button"
          >
            Laba Rugi Sederhana
            {activeReportTab === "laba-rugi" && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveReportTab("arus-kas")}
            className={`flex-1 py-2 rounded-lg font-headline-sm text-label-md font-semibold text-center relative transition-all cursor-pointer ${
              activeReportTab === "arus-kas"
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-secondary hover:text-on-surface font-medium"
            }`}
            type="button"
          >
            Arus Kas Sederhana
            {activeReportTab === "arus-kas" && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"></span>
            )}
          </button>
        </div>

        {/* TAB 1 CONTENT: LABA RUGI SEDERHANA */}
        {activeReportTab === "laba-rugi" && (
          <>
            {/* 1. SUMMARY BANNER CARD */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-tertiary-fixed/30 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-label-sm font-label-sm text-secondary uppercase tracking-wider">
                    Laba Bersih ({selectedPeriodLabel})
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-body-md font-body-md font-bold text-secondary">Rp</span>
                    <span className={`text-numeric-stat-mobile font-numeric-stat-mobile font-bold ${
                      netProfit >= 0 ? "text-on-surface" : "text-primary"
                    }`}>
                      {formatIDR(netProfit).replace("Rp ", "")}
                    </span>
                  </div>
                </div>
                <div className="bg-tertiary/10 text-tertiary px-2.5 py-1 rounded-full text-label-sm font-label-sm font-bold flex items-center gap-1 border border-tertiary/20">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span>Margin {netMargin}%</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 pt-2 border-t border-surface-variant/60 text-label-sm font-label-sm">
                <span className={`w-2 h-2 rounded-full ${netProfit >= 0 ? "bg-tertiary" : "bg-primary"}`}></span>
                <span className={`font-semibold ${netProfit >= 0 ? "text-tertiary" : "text-primary"}`}>
                  {financialStatus.label}
                </span>
                <span className="text-secondary truncate">• {transactions.length} transaksi dihitung</span>
              </div>
            </div>

            {/* 2. SECTION A: PENDAPATAN OPERASIONAL */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-tertiary/10 text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                  </span>
                  <h2 className="text-label-md font-label-md font-bold text-on-surface tracking-wide uppercase">
                    A. Pendapatan Operasional
                  </h2>
                </div>
                <span className="text-label-sm font-label-sm text-tertiary bg-tertiary/10 px-2 py-0.5 rounded font-semibold">
                  {incomeCategories.length} Pos
                </span>
              </div>
              <div className="space-y-2.5">
                {incomeCategories.length === 0 ? (
                  <p className="text-xs text-secondary italic py-1">Belum ada pendapatan tercatat.</p>
                ) : (
                  incomeCategories.map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-body-md font-body-md">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed-dim shrink-0"></span>
                        <span className="text-on-surface truncate">{item.name}</span>
                      </div>
                      <span className="font-numeric-stat text-body-md font-semibold text-on-surface shrink-0">
                        {formatIDR(item.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-2 border-t border-dashed border-surface-variant flex justify-between items-center bg-surface-container-low/50 -mx-4 px-4 py-2 rounded-b-lg">
                <span className="text-label-md font-label-md font-bold text-on-surface">
                  Subtotal Pendapatan
                </span>
                <span className="font-numeric-stat text-body-lg font-bold text-tertiary">
                  {formatIDR(totalIncome)}
                </span>
              </div>
            </div>

            {/* 3. SECTION B: BEBAN OPERASIONAL */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                  </span>
                  <h2 className="text-label-md font-label-md font-bold text-on-surface tracking-wide uppercase">
                    B. Beban Operasional
                  </h2>
                </div>
                <span className="text-label-sm font-label-sm text-primary bg-primary/10 px-2 py-0.5 rounded font-semibold">
                  {expenseCategories.length} Pos Pengeluaran
                </span>
              </div>
              <div className="space-y-2.5">
                {expenseCategories.length === 0 ? (
                  <p className="text-xs text-secondary italic py-1">Belum ada beban operasional tercatat.</p>
                ) : (
                  expenseCategories.map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-body-md font-body-md">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-on-surface truncate">{item.name}</span>
                      </div>
                      <span className="font-numeric-stat text-body-md font-semibold text-on-surface shrink-0">
                        {formatIDR(item.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-2 border-t border-dashed border-surface-variant flex justify-between items-center bg-primary-fixed/20 -mx-4 px-4 py-2 rounded-b-lg">
                <span className="text-label-md font-label-md font-bold text-on-surface">
                  Subtotal Beban
                </span>
                <span className="font-numeric-stat text-body-lg font-bold text-primary">
                  {formatIDR(totalExpense)}
                </span>
              </div>
            </div>

            {/* 4. GRAND TOTAL HIGHLIGHT CARD */}
            <div className="bg-inverse-surface text-inverse-on-surface rounded-xl p-4 shadow-md space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-label-sm font-label-sm text-secondary-fixed uppercase tracking-wider">
                  Hasil Akhir (Laba Operasional)
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-label-sm font-bold ${
                  netProfit >= 0 ? "bg-primary text-on-primary" : "bg-error-container text-primary"
                }`}>
                  {netProfit >= 0 ? "SURPLUS" : "DEFISIT"}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-headline-sm font-headline-sm font-bold tracking-tight">
                  LABA BERSIH
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-numeric-stat-mobile font-numeric-stat-mobile font-bold text-inverse-on-surface tracking-tight">
                    {formatIDR(netProfit)}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-outline/20 flex items-center justify-between text-body-sm font-body-sm text-secondary-fixed">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-tertiary-fixed">
                    verified
                  </span>
                  <span>Tervalidasi Real-Time Supabase</span>
                </div>
                <span className="text-[11px] font-label-sm bg-inverse-surface border border-outline/30 px-1.5 py-0.5 rounded">
                  Buku Kasir
                </span>
              </div>
            </div>
          </>
        )}

        {/* TAB 2 CONTENT: ARUS KAS SEDERHANA */}
        {activeReportTab === "arus-kas" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {/* Cash Flow Summary */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-label-sm font-label-sm text-secondary uppercase tracking-wider">
                    Arus Kas Bersih (Net Cash Flow)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`text-numeric-stat-mobile font-numeric-stat-mobile font-bold ${
                      netCashFlow >= 0 ? "text-tertiary" : "text-primary"
                    }`}>
                      {netCashFlow >= 0 ? `+${formatIDR(netCashFlow)}` : formatIDR(netCashFlow)}
                    </span>
                  </div>
                </div>
                <div className="bg-tertiary/10 text-tertiary px-2.5 py-1 rounded-full text-label-sm font-label-sm font-bold flex items-center gap-1 border border-tertiary/20">
                  <span className="material-symbols-outlined text-[14px]">
                    {netCashFlow >= 0 ? "check_circle" : "warning"}
                  </span>
                  <span>{netCashFlow >= 0 ? "Likuid" : "Defisit Kas"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-variant/40">
                <div className="bg-surface-container-low p-2.5 rounded-lg">
                  <span className="text-[11px] text-secondary block">Total Kas Masuk</span>
                  <span className="text-body-md font-bold text-tertiary block mt-0.5">
                    +{formatIDR(totalIncome)}
                  </span>
                </div>
                <div className="bg-error-container/30 border border-primary/20 p-2.5 rounded-lg">
                  <span className="text-[11px] text-primary block font-medium">Total Kas Keluar</span>
                  <span className="text-body-md font-bold text-primary block mt-0.5">
                    -{formatIDR(totalExpense)}
                  </span>
                </div>
              </div>
            </div>

            {/* Inflow Details */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-surface-variant">
                <span className="text-label-md font-bold text-tertiary uppercase flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">arrow_downward_alt</span>
                  <span>Penerimaan Kas (Inflows)</span>
                </span>
                <span className="font-bold text-tertiary font-numeric-stat">
                  {formatIDR(totalIncome)}
                </span>
              </div>
              <div className="space-y-2 text-body-sm text-secondary">
                {incomeCategories.length === 0 ? (
                  <p className="text-xs text-secondary italic">Belum ada penerimaan kas tercatat.</p>
                ) : (
                  incomeCategories.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="text-on-surface font-semibold shrink-0">
                        {formatIDR(item.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Outflow Details */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-surface-variant">
                <span className="text-label-md font-bold text-primary uppercase flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">arrow_upward_alt</span>
                  <span>Pengeluaran Kas (Outflows)</span>
                </span>
                <span className="font-bold text-primary font-numeric-stat">
                  {formatIDR(totalExpense)}
                </span>
              </div>
              <div className="space-y-2 text-body-sm text-secondary">
                {expenseCategories.length === 0 ? (
                  <p className="text-xs text-secondary italic">Belum ada pengeluaran kas tercatat.</p>
                ) : (
                  expenseCategories.map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="truncate pr-2">{item.name}</span>
                      <span className="text-on-surface font-semibold shrink-0">
                        {formatIDR(item.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
