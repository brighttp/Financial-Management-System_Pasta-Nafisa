import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BusinessProvider, useBusiness } from "./contexts/BusinessContext";
import LoginPage from "./components/LoginPage";
import AccessDenied from "./components/AccessDenied";
import Sidebar from "./components/Sidebar";
import TopHeader from "./components/TopHeader";
import KpiCards from "./components/KpiCards";
import WeeklyLineChart from "./components/WeeklyLineChart";
import PerformanceChart from "./components/PerformanceChart";
import ExpenseBreakdown from "./components/ExpenseBreakdown";
import RecentTransactions from "./components/RecentTransactions";
import BottomNav from "./components/BottomNav";
import TransactionModal from "./components/TransactionModal";
import TransactionsHistoryView from "./components/TransactionsHistoryView";
import ReportView from "./components/ReportView";
import SettingsView from "./components/SettingsView";
import DateRangeModal from "./components/DateRangeModal";
import TransactionDetailModal from "./components/TransactionDetailModal";
import { useTransactions } from "./hooks/useTransactions";
import {
  getTodayYMD,
  getPreviousDayYMD,
  getWeekRangeYMD,
  getPreviousWeekRangeYMD,
  getMonthRangeYMD,
  getPreviousMonthRangeYMD,
  formatIndonesianDate,
  parseYMD,
} from "./utils/dateHelpers";
import {
  calculateFinancials,
  calculatePeriodComparison,
} from "./utils/financialCalculations";
import * as transactionService from "./services/transactionService";

function DashboardApp() {
  const {
    business,
    selectedOutlet,
    loading: businessLoading,
    error: businessError,
    refreshBusinessData,
    showToast,
  } = useBusiness();

  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "transactions", "reports", "settings"
  const [activePeriod, setActivePeriod] = useState("month"); // "today", "week", "month", "custom"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [selectedTransactionDetail, setSelectedTransactionDetail] = useState(null);

  // Month baseline as default
  const defaultMonthRange = useMemo(() => getMonthRangeYMD(), []);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: defaultMonthRange.startDate,
    endDate: defaultMonthRange.endDate,
  });

  const [lastUpdated, setLastUpdated] = useState("Real-time Supabase");

  // Determine current effective date range based on activePeriod
  const { effectiveStartDate, effectiveEndDate, periodLabel, prevStartDate, prevEndDate, prevPeriodLabel } =
    useMemo(() => {
      const today = getTodayYMD();

      if (activePeriod === "today") {
        return {
          effectiveStartDate: today,
          effectiveEndDate: today,
          periodLabel: "Hari Ini",
          prevStartDate: getPreviousDayYMD(today),
          prevEndDate: getPreviousDayYMD(today),
          prevPeriodLabel: "vs kemarin",
        };
      }

      if (activePeriod === "week") {
        const week = getWeekRangeYMD();
        const prevWeek = getPreviousWeekRangeYMD();
        return {
          effectiveStartDate: week.startDate,
          effectiveEndDate: week.endDate,
          periodLabel: "Minggu Ini",
          prevStartDate: prevWeek.startDate,
          prevEndDate: prevWeek.endDate,
          prevPeriodLabel: "vs minggu lalu",
        };
      }

      if (activePeriod === "custom" && customDateRange.startDate) {
        return {
          effectiveStartDate: customDateRange.startDate,
          effectiveEndDate: customDateRange.endDate || customDateRange.startDate,
          periodLabel: `${formatIndonesianDate(customDateRange.startDate)} - ${formatIndonesianDate(
            customDateRange.endDate || customDateRange.startDate
          )}`,
          prevStartDate: null,
          prevEndDate: null,
          prevPeriodLabel: "vs periode lalu",
        };
      }

      // "month" (default)
      const month = getMonthRangeYMD();
      const prevMonth = getPreviousMonthRangeYMD();
      return {
        effectiveStartDate: month.startDate,
        effectiveEndDate: month.endDate,
        periodLabel: "Bulan Ini",
        prevStartDate: prevMonth.startDate,
        prevEndDate: prevMonth.endDate,
        prevPeriodLabel: "vs bln lalu",
      };
    }, [activePeriod, customDateRange]);

  // Load transactions for current period from Supabase
  const {
    transactions,
    financials,
    loading: txLoading,
    error: txError,
    refresh: refreshTransactions,
    addTransaction,
    removeTransaction,
  } = useTransactions({
    startDate: effectiveStartDate,
    endDate: effectiveEndDate,
  });

  // Calculate comparisons against previous period (if applicable)
  const [comparisons, setComparisons] = useState(null);

  const fetchPreviousPeriodComparisons = useCallback(async () => {
    if (!business?.id || !prevStartDate || !prevEndDate) {
      setComparisons(null);
      return;
    }

    try {
      const prevResult = await transactionService.getTransactions({
        businessId: business.id,
        startDate: prevStartDate,
        endDate: prevEndDate,
        limit: 200,
      });

      const prevFin = calculateFinancials(prevResult.transactions);

      const incomeComp = calculatePeriodComparison(
        financials.totalIncome,
        prevFin.totalIncome
      );
      const expenseComp = calculatePeriodComparison(
        financials.totalExpense,
        prevFin.totalExpense
      );

      setComparisons({
        income: incomeComp,
        expense: expenseComp,
        periodLabel: prevPeriodLabel,
      });
    } catch (err) {
      console.warn("Could not fetch comparison period:", err);
      setComparisons(null);
    }
  }, [
    business,
    prevStartDate,
    prevEndDate,
    prevPeriodLabel,
    financials.totalIncome,
    financials.totalExpense,
  ]);

  useEffect(() => {
    fetchPreviousPeriodComparisons();
  }, [fetchPreviousPeriodComparisons]);

  // Dedicated monthly financials for the weekly performance chart (M1 - M4)
  // Ensures consistent weekly trend data across the entire month even when dashboard filter is set to "Hari Ini" or "Minggu Ini"
  const [monthlyFinancials, setMonthlyFinancials] = useState(null);

  const fetchMonthlyPerformanceData = useCallback(async () => {
    if (!business?.id) {
      setMonthlyFinancials(null);
      return;
    }

    // If active period is already "month" and not custom, reuse current `financials`
    if (activePeriod === "month") {
      setMonthlyFinancials(financials);
      return;
    }

    try {
      let baseDate = new Date();
      if (activePeriod === "custom" && customDateRange.startDate) {
        baseDate = parseYMD(customDateRange.startDate);
      }
      const monthRange = getMonthRangeYMD(baseDate);

      const monthResult = await transactionService.getTransactions({
        businessId: business.id,
        outletId: selectedOutlet,
        startDate: monthRange.startDate,
        endDate: monthRange.endDate,
        limit: 500,
      });

      setMonthlyFinancials(calculateFinancials(monthResult.transactions));
    } catch (err) {
      console.warn("Could not fetch monthly performance chart data:", err);
    }
  }, [business, selectedOutlet, activePeriod, customDateRange.startDate, financials]);

  useEffect(() => {
    fetchMonthlyPerformanceData();
  }, [fetchMonthlyPerformanceData]);

  const monthlyPeriodLabel = useMemo(() => {
    if (activePeriod === "custom" && customDateRange.startDate) {
      const d = parseYMD(customDateRange.startDate);
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    }
    return "Bulan Ini";
  }, [activePeriod, customDateRange.startDate]);

  const handleApplyCustomDateRange = ({ startDate, endDate }) => {
    setCustomDateRange({ startDate, endDate });
    setActivePeriod("custom");
  };

  const handleSaveTransaction = async (formData) => {
    try {
      await addTransaction(formData);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")} WIB`;
      setLastUpdated(`Hari ini, ${timeStr}`);
      showToast(
        `Transaksi senilai ${formData.amount.toLocaleString("id-ID")} berhasil dicatat ke Supabase.`,
        "success",
        "Transaksi Berhasil Disimpan"
      );
      refreshTransactions();
      fetchMonthlyPerformanceData();
    } catch (err) {
      showToast(err.message || "Gagal menyimpan transaksi.", "error", "Gagal Mencatat");
      throw err;
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await removeTransaction(id);
      showToast("Transaksi berhasil dihapus dari sistem.", "delete", "Transaksi Dihapus");
      refreshTransactions();
      fetchMonthlyPerformanceData();
    } catch (err) {
      showToast(err.message || "Gagal menghapus transaksi.", "error", "Gagal Menghapus");
    }
  };

  // If business membership error, display clear access error
  if (businessError) {
    return (
      <AccessDenied
        message={businessError}
        onRetry={refreshBusinessData}
      />
    );
  }

  // If loading business context
  if (businessLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary font-bold text-xl flex items-center justify-center mb-3 shadow-md">
          PN
        </div>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-body-sm font-semibold text-on-surface">Memuat Data Pasta Nafisa...</p>
        <p className="text-xs text-secondary mt-0.5">Menghubungkan ke Supabase Cloud</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-on-surface antialiased selection:bg-primary selection:text-on-primary w-full overflow-x-hidden">
      {/* Desktop Lateral Rail (Sidebar) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenTransactionModal={() => setIsModalOpen(true)}
      />

      {/* Main Content Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 pb-28 md:pb-8 overflow-x-hidden">
        {/* Top Header Card for Dashboard */}
        {activeTab === "dashboard" && (
          <TopHeader
            activePeriod={activePeriod}
            customDateRange={customDateRange}
            onOpenDateRangeModal={() => setIsDateRangeModalOpen(true)}
            onPeriodChange={(p) => {
              if (p === "custom") {
                setIsDateRangeModalOpen(true);
                return;
              }
              setActivePeriod(p);
            }}
            onOpenTransactionModal={() => setIsModalOpen(true)}
          />
        )}

        {/* View Switcher */}
        {activeTab === "dashboard" && (
          <>
            {/* KPI Cards (2x2 Grid) */}
            <KpiCards
              financials={financials}
              lastUpdated={lastUpdated}
              comparisons={comparisons}
            />

            {/* Line Chart Tren Transaksi Mingguan */}
            <WeeklyLineChart
              financials={monthlyFinancials || financials}
              periodLabel={monthlyPeriodLabel}
            />

            {/* Performance Bar Chart & Expense Breakdown (Bento Grid) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <PerformanceChart
                financials={monthlyFinancials || financials}
                periodLabel={monthlyPeriodLabel}
              />
              <ExpenseBreakdown financials={financials} />
            </section>

            {/* Recent Transactions Ledger */}
            <RecentTransactions
              transactions={transactions}
              loading={txLoading}
              error={txError}
              onViewAll={() => setActiveTab("transactions")}
              onSelectTransaction={(tx) => setSelectedTransactionDetail(tx)}
            />
          </>
        )}

        {activeTab === "transactions" && (
          <TransactionsHistoryView
            transactions={transactions}
            loading={txLoading}
            activePeriod={activePeriod}
            customDateRange={customDateRange}
            onPeriodChange={(p) => {
              if (p === "custom") {
                setIsDateRangeModalOpen(true);
                return;
              }
              setActivePeriod(p);
            }}
            onOpenDateRangeModal={() => setIsDateRangeModalOpen(true)}
            onOpenTransactionModal={() => setIsModalOpen(true)}
            onBackToDashboard={() => setActiveTab("dashboard")}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {activeTab === "reports" && (
          <ReportView
            transactions={transactions}
            financials={financials}
            onBackToDashboard={() => setActiveTab("dashboard")}
            customDateRange={customDateRange}
            onOpenDateRangeModal={() => setIsDateRangeModalOpen(true)}
            selectedPeriodLabel={periodLabel}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView
            onBackToDashboard={() => setActiveTab("dashboard")}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Transaction Modal (Catat Transaksi Baru) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
      />

      {/* Date Range Modal (Rentang Tanggal) */}
      <DateRangeModal
        isOpen={isDateRangeModalOpen}
        onClose={() => setIsDateRangeModalOpen(false)}
        onApply={handleApplyCustomDateRange}
        initialStartDate={customDateRange.startDate}
        initialEndDate={customDateRange.endDate}
      />

      {/* Transaction Detail Modal (Dashboard) */}
      <TransactionDetailModal
        isOpen={!!selectedTransactionDetail}
        transaction={selectedTransactionDetail}
        onClose={() => setSelectedTransactionDetail(null)}
        onDelete={handleDeleteTransaction}
      />
    </div>
  );
}

function MainApp() {
  const { isAuthenticated, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary font-bold text-2xl flex items-center justify-center mb-3 shadow-md animate-pulse">
          PN
        </div>
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-body-sm font-semibold text-on-surface">Memulihkan Sesi Pengguna...</p>
        <p className="text-xs text-secondary mt-0.5">Supabase Auth Security</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <BusinessProvider>
      <DashboardApp />
    </BusinessProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
