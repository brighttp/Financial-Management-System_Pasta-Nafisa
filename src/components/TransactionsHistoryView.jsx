import React, { useState, useMemo, useRef, useEffect } from "react";
import { formatIDR } from "../utils/currencyFormatter";
import { formatIndonesianDate, formatTimelineDate, getTodayYMD } from "../utils/dateHelpers";
import { useBusiness } from "../hooks/useBusiness";
import ConfirmModal from "./ConfirmModal";
import TransactionDetailModal from "./TransactionDetailModal";

export default function TransactionsHistoryView({
  transactions = [],
  onOpenTransactionModal,
  onBackToDashboard,
  onDeleteTransaction,
  loading = false,
  activePeriod = "month",
  customDateRange,
  onPeriodChange,
  onOpenDateRangeModal,
}) {
  const { categories, outlets, selectedOutlet, addCategory, removeCategory } = useBusiness();

  const periods = [
    { id: "today", label: "Hari Ini" },
    { id: "week", label: "Minggu Ini" },
    { id: "month", label: "Bulan Ini" },
  ];

  const formatCustomRangeLabel = (range) => {
    if (!range?.startDate) return "Pilih Tanggal";
    const toShortDM = (ymd) => {
      const parts = ymd.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return ymd;
    };
    const start = toShortDM(range.startDate);
    const end = range.endDate ? toShortDM(range.endDate) : start;
    if (start === end) return start;
    return `${start} - ${end}`;
  };

  const customLabel = formatCustomRangeLabel(customDateRange);

  const [filterType, setFilterType] = useState("all"); // "all", "income", "expense"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]); // Array for multi-select, empty = all
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);
  const [selectedTxDetail, setSelectedTxDetail] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Premium Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Hapus",
    cancelText: "Batal",
    type: "danger",
    onConfirm: null,
  });

  // Category addition state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("expense");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Close multi-select dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (confirmModal.isOpen) return; // Don't close if confirmation modal is active
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
        setIsAddingCategory(false);
      }
    }
    if (isCategoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isCategoryDropdownOpen, confirmModal.isOpen]);

  // Handler to add a new category
  const handleCreateCategory = async (e) => {
    e?.preventDefault();
    if (!newCatName.trim()) {
      alert("Silakan masukkan nama kategori.");
      return;
    }

    try {
      setIsSubmittingCat(true);
      await addCategory({
        name: newCatName.trim(),
        type: newCatType,
      });
      setNewCatName("");
      setIsAddingCategory(false);
    } catch (err) {
      alert(err.message || "Gagal menambahkan kategori.");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  // Handler to delete an existing category
  const handleDeleteCategoryByName = (catName) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Kategori?",
      message: `Apakah Anda yakin ingin menghapus kategori "${catName}" dari sistem?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
      onConfirm: async () => {
        const found = categories.find(
          (c) => c.name.toLowerCase().trim() === catName.toLowerCase().trim()
        );
        try {
          if (found?.id) {
            await removeCategory(found.id);
          } else {
            alert(`Kategori "${catName}" hanya tercatat dalam riwayat transaksi lama.`);
          }
          setSelectedCategories((prev) => prev.filter((c) => c !== catName));
        } catch (err) {
          alert(err.message || "Gagal menghapus kategori.");
        }
      },
    });
  };

  // Category options for select box
  const { incomeCategories, expenseCategories } = useMemo(() => {
    const incSet = new Set();
    const expSet = new Set();

    categories.forEach((c) => {
      if (c.type === "income") incSet.add(c.name);
      else expSet.add(c.name);
    });

    transactions.forEach((t) => {
      const catName = t.category_name || t.category;
      if (catName) {
        if (t.type === "income") incSet.add(catName);
        else expSet.add(catName);
      }
    });

    return {
      incomeCategories: Array.from(incSet).sort((a, b) => a.localeCompare(b)),
      expenseCategories: Array.from(expSet).sort((a, b) => a.localeCompare(b)),
    };
  }, [categories, transactions]);

  // Toggle single category selection
  const toggleCategory = (catName) => {
    setSelectedCategories((prev) =>
      prev.includes(catName) ? prev.filter((c) => c !== catName) : [...prev, catName]
    );
  };

  // Safe handler to change filter type and validate selected category
  const handleFilterTypeChange = (newType) => {
    setFilterType(newType);
    if (selectedCategories.length > 0) {
      if (newType === "income") {
        setSelectedCategories((prev) => prev.filter((c) => incomeCategories.includes(c)));
      } else if (newType === "expense") {
        setSelectedCategories((prev) => prev.filter((c) => expenseCategories.includes(c)));
      }
    }
  };

  // Filter & sort logic
  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      const cat = t.category_name || t.category;
      if (selectedCategories.length > 0 && !selectedCategories.includes(cat)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (t.title || "").toLowerCase().includes(q);
        const matchCat = (cat || "").toLowerCase().includes(q);
        const matchMethod = (t.payment_method || t.paymentMethod || "").toLowerCase().includes(q);
        const matchNotes = (t.notes || t.description || "").toLowerCase().includes(q);
        return matchTitle || matchCat || matchMethod || matchNotes;
      }
      return true;
    });

    // Always sort by newest date/time first
    result = [...result].sort((a, b) => {
      const dateA = a.transaction_date || a.date || "";
      const dateB = b.transaction_date || b.date || "";
      if (dateB !== dateA) return dateB.localeCompare(dateA);
      const createdA = a.created_at || "";
      const createdB = b.created_at || "";
      return createdB.localeCompare(createdA);
    });

    return result;
  }, [transactions, filterType, selectedCategories, searchQuery]);

  // Compute metrics for current filtered view
  const summaryMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") income += amt;
      else expense += amt;
    });
    return {
      income,
      expense,
      net: income - expense,
      totalCount: transactions.length,
      incomeCount: transactions.filter((t) => t.type === "income").length,
      expenseCount: transactions.filter((t) => t.type === "expense").length,
    };
  }, [transactions]);

  // Group transactions by date for visual timeline
  const groupedByDate = useMemo(() => {
    const groups = {};
    filteredTransactions.forEach((tx) => {
      const dateKey = tx.transaction_date || tx.date || getTodayYMD();
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          items: [],
          totalIncome: 0,
          totalExpense: 0,
        };
      }
      groups[dateKey].items.push(tx);
      const amt = Number(tx.amount) || 0;
      if (tx.type === "income") {
        groups[dateKey].totalIncome += amt;
      } else {
        groups[dateKey].totalExpense += amt;
      }
    });

    return Object.values(groups).sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [filteredTransactions]);

  const getMethodBadge = (method) => {
    if (!method) return { icon: "payments", label: "Kas Tunai" };
    if (method.includes("QRIS")) return { icon: "qr_code_2", label: method };
    if (method.includes("BCA") || method.includes("Mandiri") || method.includes("Transfer"))
      return { icon: "account_balance", label: method };
    if (method.includes("Tunai")) return { icon: "payments", label: method };
    if (method.includes("Invoice")) return { icon: "receipt", label: method };
    if (method.includes("Auto-Debit")) return { icon: "credit_card", label: method };
    return { icon: "account_balance_wallet", label: method };
  };

  const handleDelete = (id, title) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Transaksi?",
      message: `Apakah Anda yakin ingin menghapus transaksi "${title || "ini"}" secara permanen dari Supabase?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
      onConfirm: async () => {
        try {
          setDeletingId(id);
          await onDeleteTransaction(id);
          if (selectedTxDetail?.id === id) {
            setSelectedTxDetail(null);
          }
        } catch (err) {
          alert(err.message || "Gagal menghapus transaksi.");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const getOutletName = () => {
    if (selectedOutlet === "all") return "Semua Gerai";
    const found = outlets.find((o) => o.id === selectedOutlet);
    return found ? found.name : "Gerai Utama Sukapura";
  };

  return (
    <div className="w-full space-y-3.5 sm:space-y-4 pb-16 animate-in fade-in duration-200">
      {/* 1. TOP APP BAR DENGAN FILTER WAKTU (IDENTIK DENGAN DASHBOARD) */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#161b26] to-slate-900 border border-white/10 shadow-xl shadow-slate-950/25 mb-4 text-white transition-all">
        {/* Ambient Decorative Glow Lights */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-center w-full px-3.5 sm:px-5 py-3 sm:py-3.5 max-w-4xl mx-auto">
          {/* Leading Branding & Back Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-sm"
              aria-label="Kembali ke Dashboard"
              title="Kembali ke Dashboard"
            >
              <span className="material-symbols-outlined text-[18px] sm:text-[20px]">arrow_back</span>
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-primary via-rose-600 to-rose-500 text-white flex items-center justify-center font-black text-base shadow-lg shadow-primary/30 ring-1 ring-white/25 select-none shrink-0 tracking-wider">
              PN
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">
                  Riwayat Transaksi
                </span>
                <span className="bg-primary/20 text-rose-300 border border-primary/40 px-2 py-0.5 rounded-md text-[10px] font-bold">
                  Buku Kas
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium flex items-center gap-1.5 truncate mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="truncate text-slate-300 font-semibold">{getOutletName()}</span>
              </p>
            </div>
          </div>

          {/* Quick Add CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenTransactionModal}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-primary via-rose-600 to-rose-500 hover:brightness-110 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all cursor-pointer ring-1 ring-white/20"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span className="hidden sm:inline">Catat Transaksi</span>
            </button>
          </div>
        </div>

        {/* Global Period Selector Sub-Bar (3 Presets on top, Custom Date Range below on Mobile) */}
        <div className="relative z-10 px-3.5 sm:px-5 pb-3.5 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-white/10 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            {/* 3 Main Presets in Segmented Grid */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl backdrop-blur-md w-full sm:w-auto">
              {periods.map((p) => {
                const isActive = activePeriod === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onPeriodChange?.(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer text-center ${
                      isActive
                        ? "bg-gradient-to-r from-primary to-rose-600 text-white shadow-md shadow-primary/30 ring-1 ring-white/20 font-bold"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Range Pill (Baris Bawah di Mobile) */}
            <button
              onClick={() => {
                if (onOpenDateRangeModal) {
                  onOpenDateRangeModal();
                } else {
                  onPeriodChange?.("custom");
                }
              }}
              className={`w-full sm:w-auto flex items-center justify-between sm:justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 active:scale-95 border ${
                activePeriod === "custom"
                  ? "bg-gradient-to-r from-primary to-rose-600 text-white shadow-md shadow-primary/30 ring-1 ring-white/20 font-bold border-transparent"
                  : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
              }`}
              title="Pilih Rentang Tanggal Kustom"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[15px] shrink-0">calendar_month</span>
                <span className="truncate">
                  {activePeriod === "custom" ? customLabel : "Pilih Tanggal"}
                </span>
              </div>
              <span className="material-symbols-outlined text-[14px] opacity-70 shrink-0">
                edit_calendar
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. INTERACTIVE SEARCH, FILTERS & CAROUSEL */}
      <div className="max-w-4xl mx-auto px-1 sm:px-0 space-y-3">
        <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-3.5 shadow-sm space-y-3">
          {/* Search Row */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-lg">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, menu pasta, supplier, invoice, catatan..."
              className="w-full pl-10 pr-9 py-2.5 text-body-sm rounded-xl border border-surface-variant/60 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all bg-surface-container-lowest"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface p-0.5 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>

          {/* Category Multi-Select Filter Row (Full Width) */}
          <div className="relative w-full" ref={categoryDropdownRef}>
            {/* Category Multi-Select Trigger */}
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
              className={`w-full px-3.5 py-2.5 text-xs sm:text-label-sm font-semibold rounded-xl border transition-all flex items-center justify-between cursor-pointer truncate shadow-2xs ${
                selectedCategories.length > 0
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/20"
                  : "border-surface-variant/60 bg-surface-container-lowest text-on-surface hover:border-surface-variant"
              }`}
              title="Pilih satu atau lebih kategori"
            >
              <div className="flex items-center gap-2 min-w-0 truncate">
                <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
                  category
                </span>
                <span className="truncate">
                  {selectedCategories.length === 0
                    ? "Semua Kategori"
                    : `${selectedCategories.length} Kategori Dipilih`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                {selectedCategories.length > 0 && (
                  <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedCategories.length}
                  </span>
                )}
                <span className="material-symbols-outlined text-[18px] text-secondary">
                  {isCategoryDropdownOpen ? "expand_less" : "expand_more"}
                </span>
              </div>
            </button>

            {/* Multi-Select Floating Popover (Utilizes Horizontal Space with 2-Column Grid) */}
            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface-container-lowest border border-surface-variant/70 rounded-2xl shadow-2xl p-3 sm:p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-surface-variant/20 pb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-on-surface truncate">
                      Filter Kategori
                    </span>
                    {/* Add Category Trigger Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(!isAddingCategory);
                        setNewCatType(filterType === "income" ? "income" : "expense");
                      }}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        isAddingCategory
                          ? "bg-primary text-on-primary border-primary shadow-xs"
                          : "bg-surface-container text-primary hover:bg-surface-container-high border-surface-variant/40"
                      }`}
                      title="Tambah kategori baru"
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isAddingCategory ? "close" : "add"}
                      </span>
                      <span>{isAddingCategory ? "Batal" : "Tambah"}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {selectedCategories.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setSelectedCategories([])}
                        className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Pilih Semua
                      </button>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container font-semibold text-secondary">
                        Semua Aktif
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCategoryDropdownOpen(false);
                        setIsAddingCategory(false);
                      }}
                      className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
                      title="Tutup"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Inline Add Category Mini-Form */}
                {isAddingCategory && (
                  <form
                    onSubmit={handleCreateCategory}
                    className="p-2.5 rounded-xl bg-surface-container border border-primary/30 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">add_circle</span>
                        <span>Kategori Baru</span>
                      </span>
                      {/* Type Switcher */}
                      <div className="flex items-center gap-1 bg-surface-container-lowest p-0.5 rounded-lg border border-surface-variant/40 shrink-0">
                        <button
                          type="button"
                          onClick={() => setNewCatType("expense")}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            newCatType === "expense"
                              ? "bg-primary text-on-primary shadow-xs"
                              : "text-secondary hover:text-on-surface"
                          }`}
                        >
                          Pengeluaran
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCatType("income")}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                            newCatType === "income"
                              ? "bg-tertiary text-on-tertiary shadow-xs"
                              : "text-secondary hover:text-on-surface"
                          }`}
                        >
                          Pemasukan
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Contoh: Bumbu Pasta, Promo Iklan..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-surface-container-lowest border border-surface-variant/60 focus:border-primary focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingCat || !newCatName.trim()}
                        className="px-3 py-1.5 bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                      >
                        {isSubmittingCat ? "..." : "Simpan"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Popover Body: 1 Category per Row (Full Name, No Truncation) */}
                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {/* Pemasukan Section */}
                  {filterType !== "expense" && incomeCategories.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-tertiary uppercase tracking-wider px-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                        <span>Pemasukan</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {incomeCategories.map((cat) => {
                          const isSelected = selectedCategories.includes(cat);
                          return (
                            <div
                              key={`inc-${cat}`}
                              className={`group/cat flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl text-xs font-semibold transition-all border ${
                                isSelected
                                  ? "bg-tertiary/10 border-tertiary text-tertiary shadow-2xs"
                                  : "bg-surface-container-low border-surface-variant/40 text-secondary hover:bg-surface-container hover:text-on-surface"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleCategory(cat)}
                                className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                                title={`Pilih ${cat}`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold border transition-colors ${
                                    isSelected
                                      ? "bg-tertiary text-on-tertiary border-tertiary"
                                      : "border-surface-variant bg-surface-container-lowest text-transparent"
                                  }`}
                                >
                                  ✓
                                </span>
                                <span className="font-medium text-on-surface leading-tight break-words">
                                  {cat}
                                </span>
                              </button>

                              {/* Delete Category Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategoryByName(cat);
                                }}
                                className="opacity-40 hover:opacity-100 hover:text-primary hover:bg-error-container/30 p-1 rounded-lg transition-all cursor-pointer shrink-0 ml-1"
                                title={`Hapus kategori "${cat}"`}
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pengeluaran Section */}
                  {filterType !== "income" && expenseCategories.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider px-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                        <span>Pengeluaran</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {expenseCategories.map((cat) => {
                          const isSelected = selectedCategories.includes(cat);
                          return (
                            <div
                              key={`exp-${cat}`}
                              className={`group/cat flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl text-xs font-semibold transition-all border ${
                                isSelected
                                  ? "bg-primary/10 border-primary text-primary shadow-2xs"
                                  : "bg-surface-container-low border-surface-variant/40 text-secondary hover:bg-surface-container hover:text-on-surface"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => toggleCategory(cat)}
                                className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                                title={`Pilih ${cat}`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold border transition-colors ${
                                    isSelected
                                      ? "bg-primary text-on-primary border-primary"
                                      : "border-surface-variant bg-surface-container-lowest text-transparent"
                                  }`}
                                >
                                  ✓
                                </span>
                                <span className="font-medium text-on-surface leading-tight break-words">
                                  {cat}
                                </span>
                              </button>

                              {/* Delete Category Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategoryByName(cat);
                                }}
                                className="opacity-40 hover:opacity-100 hover:text-primary hover:bg-error-container/30 p-1 rounded-lg transition-all cursor-pointer shrink-0 ml-1"
                                title={`Hapus kategori "${cat}"`}
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Popover Footer */}
                <div className="pt-2 border-t border-surface-variant/20 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-secondary truncate">
                    {selectedCategories.length === 0
                      ? "Menampilkan semua kategori"
                      : `${selectedCategories.length} kategori aktif`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCategoryDropdownOpen(false)}
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-transform cursor-pointer"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Selected Categories Pills */}
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-secondary font-medium">Filter aktif:</span>
              {selectedCategories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-semibold"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="hover:text-primary-container cursor-pointer ml-0.5 flex items-center"
                    title={`Hapus filter ${cat}`}
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className="text-[11px] text-primary hover:underline font-semibold ml-1 cursor-pointer"
              >
                Hapus Semua
              </button>
            </div>
          )}

          {/* Type Segmented Controls (3-column responsive grid) */}
          <div className="space-y-2 border-t border-surface-variant/20 pt-2.5">
            <div className="grid grid-cols-3 gap-1.5 w-full">
              <button
                onClick={() => handleFilterTypeChange("all")}
                className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterType === "all"
                    ? "bg-inverse-surface text-inverse-on-surface shadow-sm"
                    : "bg-surface-container text-secondary hover:bg-surface-container-high"
                }`}
              >
                <span>Semua</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    filterType === "all"
                      ? "bg-primary text-on-primary"
                      : "bg-surface-variant text-on-surface"
                  }`}
                >
                  {transactions.length}
                </span>
              </button>

              <button
                onClick={() => handleFilterTypeChange("income")}
                className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterType === "income"
                    ? "bg-tertiary text-on-tertiary shadow-sm ring-1 ring-tertiary-fixed"
                    : "bg-surface-container text-secondary hover:bg-surface-container-high"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed shrink-0"></span>
                <span className="hidden sm:inline">Pemasukan</span>
                <span className="sm:hidden">Masuk</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 font-bold ${
                    filterType === "income"
                      ? "bg-white text-tertiary font-bold"
                      : "bg-surface-variant text-on-surface"
                  }`}
                >
                  {summaryMetrics.incomeCount}
                </span>
              </button>

              <button
                onClick={() => handleFilterTypeChange("expense")}
                className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filterType === "expense"
                    ? "bg-primary text-on-primary shadow-sm ring-1 ring-primary-fixed"
                    : "bg-surface-container text-secondary hover:bg-surface-container-high"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed shrink-0"></span>
                <span className="hidden sm:inline">Pengeluaran</span>
                <span className="sm:hidden">Keluar</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 font-bold ${
                    filterType === "expense"
                      ? "bg-white text-primary font-bold"
                      : "bg-surface-variant text-on-surface"
                  }`}
                >
                  {summaryMetrics.expenseCount}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] sm:text-label-sm text-secondary font-medium px-0.5">
              <span>Menampilkan {filteredTransactions.length} transaksi</span>
              {(selectedCategories.length > 0 || filterType !== "all" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategories([]);
                    setFilterType("all");
                    setSearchQuery("");
                  }}
                  className="text-primary hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. GROUPED TRANSACTIONS TIMELINE */}
      <div className="max-w-4xl mx-auto px-1 sm:px-0 space-y-4">
        {loading ? (
          <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-body-sm text-secondary">Memuat data transaksi dari Supabase...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto mb-3 text-secondary">
              <span className="material-symbols-outlined text-3xl">receipt_long</span>
            </div>
            <h3 className="text-headline-sm font-bold text-on-surface">
              Tidak Ada Transaksi Ditemukan
            </h3>
            <p className="text-body-sm text-secondary max-w-sm mx-auto mt-1">
              Tidak ada catatan transaksi yang sesuai dengan filter atau kata kunci pencarian.
            </p>
            <button
              onClick={() => {
                setFilterType("all");
                setSelectedCategories([]);
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-xl text-label-md font-semibold text-primary transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          groupedByDate.map((group) => {
            const dailyNet = group.totalIncome - group.totalExpense;
            const isDailySurplus = dailyNet >= 0;

            return (
              <div key={group.date} className="space-y-2">
                {/* Timeline Date Header with Day Summary Pill */}
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 px-1 pb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
                    <span className="text-xs sm:text-label-md font-bold text-on-surface uppercase tracking-wide truncate">
                      {formatTimelineDate(group.date)}
                    </span>
                    <span className="text-[11px] text-secondary font-medium shrink-0">
                      ({group.items.length} aktivitas)
                    </span>
                  </div>

                  <span
                    className={`text-[11px] sm:text-label-sm font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      isDailySurplus
                        ? "bg-tertiary/10 text-tertiary border-tertiary/20"
                        : "bg-error-container/40 text-primary border-primary/20"
                    }`}
                  >
                    Net: {isDailySurplus ? `+${formatIDR(dailyNet)}` : formatIDR(dailyNet)}
                  </span>
                </div>

                {/* Cards for this Date Group */}
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const isIncome = item.type === "income";
                    const methodInfo = getMethodBadge(item.payment_method || item.paymentMethod);

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedTxDetail(item)}
                        className="bg-surface-container-lowest border border-surface-variant/40 hover:border-primary/40 rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all duration-150 flex items-center justify-between cursor-pointer group active:scale-[0.99]"
                      >
                        {/* Left: Icon & Description */}
                        <div className="flex items-center gap-3.5 min-w-0 pr-2">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                              isIncome
                                ? "bg-gradient-to-br from-tertiary-fixed/40 to-tertiary/20 text-tertiary border border-tertiary/30 shadow-xs"
                                : "bg-gradient-to-br from-error-container/60 to-primary-fixed/30 text-primary border border-primary/30 shadow-xs"
                            }`}
                          >
                            <span className="material-symbols-outlined text-xl">
                              {item.icon || (isIncome ? "point_of_sale" : "shopping_basket")}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-body-md font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                                {item.title || item.description || "Transaksi"}
                              </h4>
                              {item.receiptImage && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-[10px] bg-tertiary/10 text-tertiary font-semibold px-1.5 py-0.2 rounded border border-tertiary/20"
                                  title="Bukti Struk Terlampir"
                                >
                                  <span className="material-symbols-outlined text-[12px]">receipt</span>
                                  <span>Nota</span>
                                </span>
                              )}
                            </div>

                            {/* Meta Badges */}
                            <div className="flex items-center gap-2 mt-1 text-label-sm font-label-sm text-secondary flex-wrap">
                              <span className="text-xs text-secondary-fixed-variant font-medium">
                                {item.time || "12:00"} WIB
                              </span>
                              <span className="w-1 h-1 rounded-full bg-surface-variant"></span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.2 rounded-md ${
                                  isIncome
                                    ? "bg-tertiary/10 text-tertiary"
                                    : "bg-error-container/50 text-primary"
                                }`}
                              >
                                {item.category_name || item.category || (isIncome ? "Pemasukan" : "Pengeluaran")}
                              </span>
                              {item.description && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-surface-variant hidden sm:inline"></span>
                                  <span className="text-xs text-secondary italic truncate max-w-xs hidden sm:inline">
                                    "{item.description}"
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount & Actions */}
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <div className="text-right">
                            <span
                              className={`text-body-lg font-numeric-stat font-bold block tracking-tight ${
                                isIncome ? "text-tertiary" : "text-primary"
                              }`}
                            >
                              {isIncome ? `+${formatIDR(item.amount)}` : `-${formatIDR(item.amount)}`}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary bg-surface-container-low px-2 py-0.5 rounded-full border border-surface-variant/30 mt-0.5">
                              <span className="material-symbols-outlined text-[13px]">
                                {methodInfo.icon}
                              </span>
                              <span>{methodInfo.label}</span>
                            </span>
                          </div>

                          {/* Quick Delete Trash Button */}
                          {onDeleteTransaction && (
                            <button
                              title="Hapus Transaksi"
                              disabled={deletingId === item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item.id, item.title);
                              }}
                              className="opacity-70 group-hover:opacity-100 p-1.5 text-secondary hover:text-primary transition-opacity rounded-lg hover:bg-error-container/30 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-lg">
                                {deletingId === item.id ? "hourglass_empty" : "delete"}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. DETAIL MODAL (Rincian Transaksi) */}
      <TransactionDetailModal
        isOpen={!!selectedTxDetail}
        transaction={selectedTxDetail}
        onClose={() => setSelectedTxDetail(null)}
        onDelete={onDeleteTransaction ? (id, title) => handleDelete(id, title) : null}
      />
      {/* Premium Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
