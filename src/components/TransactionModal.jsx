import React, { useState, useEffect, useMemo, useRef } from "react";
import { useBusiness } from "../hooks/useBusiness";
import { parseIDRInput } from "../utils/currencyFormatter";
import { getTodayYMD, formatIndonesianDate } from "../utils/dateHelpers";
import { validateTransactionInput } from "../utils/validation";
import ConfirmModal from "./ConfirmModal";

export default function TransactionModal({ isOpen, onClose, onSave }) {
  const {
    isOwner,
    outlets,
    categories,
    selectedOutlet,
    addCategory,
    removeCategory,
    channels = [],
    addChannel,
    removeChannel,
  } = useBusiness();

  const [type, setType] = useState("expense"); // "income" or "expense"
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayYMD());
  const [outletId, setOutletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Kas Tunai"); // "Kas Tunai", "Transfer BCA", "QRIS Kasir"
  const [channel, setChannel] = useState("Offline / Kasir Gerai");
  const [notes, setNotes] = useState("");
  const [receiptImage, setReceiptImage] = useState(null);

  // Custom Category Selection & Management Popover States
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Custom Channel Selection & Management Popover States
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const channelDropdownRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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

  // Toggle helpers to ensure only one popover opens at a time
  const toggleCategoryDropdown = () => {
    setIsCategoryDropdownOpen((prev) => {
      if (!prev) setIsChannelDropdownOpen(false);
      return !prev;
    });
  };

  const toggleChannelDropdown = () => {
    setIsChannelDropdownOpen((prev) => {
      if (!prev) setIsCategoryDropdownOpen(false);
      return !prev;
    });
  };

  // Filter categories by selected type
  const availableCategories = useMemo(() => {
    return categories.filter((c) => c.type === type && (c.is_active !== false));
  }, [categories, type]);

  // Selected Category Object
  const selectedCatObj = useMemo(() => {
    return availableCategories.find((c) => c.id === categoryId) || null;
  }, [availableCategories, categoryId]);

  const prevOpenRef = useRef(false);

  // Click outside listener for category and channel popovers
  useEffect(() => {
    function handleClickOutside(event) {
      if (confirmModal.isOpen) return; // Don't close if confirmation modal is active

      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setIsCategoryDropdownOpen(false);
        setIsAddingCategory(false);
      }
      if (
        channelDropdownRef.current &&
        !channelDropdownRef.current.contains(event.target)
      ) {
        setIsChannelDropdownOpen(false);
        setIsAddingChannel(false);
      }
    }
    if (isCategoryDropdownOpen || isChannelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isCategoryDropdownOpen, isChannelDropdownOpen, confirmModal.isOpen]);

  // Set initial outlet and category ONLY when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setErrors({});
      setDate(getTodayYMD());
      setIsCategoryDropdownOpen(false);
      setIsAddingCategory(false);
      setNewCatName("");
      setIsChannelDropdownOpen(false);
      setIsAddingChannel(false);
      setNewChannelName("");

      // Set default outlet
      const targetOutlet =
        selectedOutlet && selectedOutlet !== "all"
          ? selectedOutlet
          : outlets.length > 0
          ? outlets[0].id
          : "";
      setOutletId(targetOutlet);

      // Set default category for current modal type
      const currentCats = categories.filter((c) => c.type === type && c.is_active !== false);
      if (currentCats.length > 0) {
        setCategoryId(currentCats[0].id);
      }
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, selectedOutlet, outlets, categories, type]);

  if (!isOpen) return null;

  const handleTypeChange = (newType) => {
    setType(newType);
    const nextCats = categories.filter((c) => c.type === newType && c.is_active !== false);
    if (nextCats.length > 0) {
      setCategoryId(nextCats[0].id);
    } else {
      setCategoryId("");
    }
    setIsCategoryDropdownOpen(false);
    setIsAddingCategory(false);
    setNewCatName("");
    setIsChannelDropdownOpen(false);
    setIsAddingChannel(false);
    setNewChannelName("");
    setErrors({});
  };

  // Handler to add a new category directly from modal
  const handleCreateCategory = async (e) => {
    e?.preventDefault();
    if (!newCatName.trim()) {
      alert("Silakan masukkan nama kategori.");
      return;
    }

    try {
      setIsSubmittingCat(true);
      const newCat = await addCategory({
        name: newCatName.trim(),
        type: type, // Matches current modal type
      });
      setNewCatName("");
      setIsAddingCategory(false);
      if (newCat?.id) {
        setCategoryId(newCat.id);
        setErrors((prev) => ({ ...prev, category_id: null, form: null }));
      }
    } catch (err) {
      alert(err.message || "Gagal menambahkan kategori.");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  // Handler to delete category directly from modal
  const handleDeleteCategory = (cat) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Kategori?",
      message: `Apakah Anda yakin ingin menghapus kategori "${cat.name}" dari sistem?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
      onConfirm: async () => {
        try {
          await removeCategory(cat.id);
          if (categoryId === cat.id) {
            const remaining = availableCategories.filter((c) => c.id !== cat.id);
            setCategoryId(remaining.length > 0 ? remaining[0].id : "");
          }
        } catch (err) {
          alert(err.message || "Gagal menghapus kategori.");
        }
      },
    });
  };

  // Handler to add a new channel directly from modal
  const handleCreateChannel = (e) => {
    e?.preventDefault();
    if (!newChannelName.trim()) {
      alert("Silakan masukkan nama kanal.");
      return;
    }

    try {
      if (addChannel) {
        const created = addChannel(newChannelName.trim());
        setChannel(created);
      } else {
        setChannel(newChannelName.trim());
      }
      setNewChannelName("");
      setIsAddingChannel(false);
    } catch (err) {
      alert(err.message || "Gagal menambahkan kanal.");
    }
  };

  // Handler to delete channel directly from modal
  const handleDeleteChannel = (channelName) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Kanal?",
      message: `Apakah Anda yakin ingin menghapus kanal "${channelName}" dari daftar?`,
      confirmText: "Hapus",
      cancelText: "Batal",
      type: "danger",
      onConfirm: () => {
        try {
          if (removeChannel) {
            removeChannel(channelName);
          }
          if (channel === channelName) {
            const remaining = channels.filter((c) => c !== channelName);
            setChannel(remaining.length > 0 ? remaining[0] : "Offline / Kasir Gerai");
          }
        } catch (err) {
          alert(err.message || "Gagal menghapus kanal.");
        }
      },
    });
  };

  const handleQuickAdd = (val) => {
    const currentNum = parseIDRInput(amount);
    const updated = currentNum + val;
    setAmount(updated.toLocaleString("id-ID"));
  };

  const handleAmountChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setAmount("");
      return;
    }
    const num = parseInt(rawVal, 10);
    setAmount(num.toLocaleString("id-ID"));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("Ukuran file terlalu besar. Maksimal 15MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas to ensure fast upload & compact backend payload
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Quality 0.72 provides sharp text readability with ~50KB payload
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.72);
        setReceiptImage(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanAmount = parseIDRInput(amount);

    const effectiveCategoryId =
      categoryId || (availableCategories.length > 0 ? availableCategories[0].id : "");
    const effectiveOutletId =
      outletId ||
      (selectedOutlet && selectedOutlet !== "all"
        ? selectedOutlet
        : outlets.length > 0
        ? outlets[0].id
        : "");

    const payload = {
      type,
      amount: cleanAmount,
      transaction_date: date,
      transactionDate: date,
      outlet_id: effectiveOutletId,
      outletId: effectiveOutletId,
      category_id: effectiveCategoryId,
      categoryId: effectiveCategoryId,
      description: notes.trim(),
      notes: notes.trim(),
      payment_method: paymentMethod,
      paymentMethod: paymentMethod,
      channel,
      receiptImage,
    };

    const validation = validateTransactionInput(
      payload,
      availableCategories,
      outlets
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      await onSave(payload);

      // Reset form
      setNotes("");
      setReceiptImage(null);
      setAmount("");
      onClose();
    } catch (err) {
      console.error("Save transaction error:", err);
      setErrors({ form: err.message || "Gagal menyimpan transaksi ke database." });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOutletObj =
    outlets.find((o) => o.id === (outletId || (outlets.length > 0 ? outlets[0].id : ""))) || outlets[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-inverse-surface/65 backdrop-blur-[2px] flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-t-[28px] sm:rounded-2xl shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] border-t border-surface-variant/50 overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Mobile Drawer Drag Handle Bar */}
        <div className="w-full flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing shrink-0 bg-surface-container-lowest">
          <div className="w-9 h-1 bg-surface-variant rounded-full"></div>
        </div>

        {/* Modal Header */}
        <div className="px-4 pt-1 pb-2 border-b border-surface-container-high flex justify-between items-center shrink-0 bg-surface-container-lowest">
          <div className="min-w-0 pr-2">
            <h2 className="text-base sm:text-headline-md font-headline-md font-bold text-on-surface leading-tight truncate">
              Catat Transaksi Baru
            </h2>
            <div className="flex items-center space-x-1 text-label-sm font-label-sm text-secondary mt-0.5">
              <span
                className="material-symbols-outlined text-primary shrink-0"
                style={{ fontSize: "14px" }}
              >
                storefront
              </span>
              <span className="text-[11px] sm:text-xs truncate">
                {selectedOutletObj?.name || "Gerai Utama Sukapura"} • {formatIndonesianDate(date)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Modal"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-low flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer shrink-0 ml-1"
            type="button"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">
              close
            </span>
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto px-3.5 sm:px-4 py-2.5 sm:py-3 space-y-2.5 sm:space-y-3 no-scrollbar overscroll-contain">
            {errors.form && (
              <div className="p-2.5 rounded-xl bg-error-container/60 border border-primary/40 text-primary text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errors.form}</span>
              </div>
            )}

            {/* 1. Segmented Transaction Type Toggle */}
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                Tipe Transaksi
              </label>
              <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl border border-surface-variant gap-1">
                {/* [ Pemasukan (Income) ] */}
                <button
                  onClick={() => handleTypeChange("income")}
                  className={`flex items-center justify-center space-x-1.5 py-1.5 sm:py-2 px-2 rounded-lg font-headline-sm transition-all cursor-pointer ${
                    type === "income"
                      ? "bg-surface-container-lowest text-tertiary shadow-sm border border-outline-variant font-bold ring-1 ring-tertiary/20"
                      : "text-secondary hover:text-on-surface"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-tertiary text-base shrink-0">
                    arrow_downward
                  </span>
                  <span className="text-xs sm:text-label-md font-semibold">Pemasukan</span>
                </button>

                {/* [ Pengeluaran (Expense) ] */}
                <button
                  onClick={() => handleTypeChange("expense")}
                  className={`flex items-center justify-center space-x-1.5 py-1.5 sm:py-2 px-2 rounded-lg font-headline-sm transition-all cursor-pointer ${
                    type === "expense"
                      ? "bg-surface-container-lowest text-primary shadow-sm border border-outline-variant font-bold ring-1 ring-primary/20"
                      : "text-secondary hover:text-on-surface"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-primary text-base shrink-0">
                    arrow_upward
                  </span>
                  <span className="text-xs sm:text-label-md font-semibold text-primary font-bold">
                    Pengeluaran
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Amount Input (Nominal) - Hero Focus Field */}
            <div
              className={`bg-surface-container-low p-2.5 sm:p-3 rounded-xl border-2 transition-all ${
                errors.amount
                  ? "border-primary bg-error-container/20"
                  : "border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-secondary">
                  Nominal Transaksi (IDR)
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-bold bg-error-container text-error">
                  Wajib
                </span>
              </div>

              {/* Currency Input Box */}
              <div className="flex items-center space-x-2 mt-0.5">
                <div className="px-2 py-0.5 bg-surface-container-high rounded text-xs font-bold text-secondary select-none shrink-0">
                  Rp
                </div>
                <div className="flex-1 flex items-baseline min-w-0">
                  <input
                    className="w-full bg-transparent border-0 p-0 text-2xl sm:text-3xl text-on-surface font-bold focus:ring-0 focus:outline-none tracking-tight font-numeric-stat"
                    placeholder="0"
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={handleAmountChange}
                  />
                  <span className="animate-pulse w-0.5 h-6 bg-primary ml-0.5 inline-block self-center"></span>
                </div>
              </div>

              {errors.amount && (
                <p className="text-xs text-primary mt-1 font-semibold">{errors.amount}</p>
              )}

              {/* Quick Denomination Chips */}
              <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mt-2 pt-1.5 border-t border-surface-variant">
                <button
                  onClick={() => handleQuickAdd(10000)}
                  className="py-1 px-1 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-[11px] sm:text-xs font-semibold text-secondary hover:text-on-surface border border-surface-variant transition-colors text-center active:scale-95 cursor-pointer truncate"
                  type="button"
                >
                  +10rb
                </button>
                <button
                  onClick={() => handleQuickAdd(50000)}
                  className="py-1 px-1 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-[11px] sm:text-xs font-semibold text-secondary hover:text-on-surface border border-surface-variant transition-colors text-center active:scale-95 cursor-pointer truncate"
                  type="button"
                >
                  +50rb
                </button>
                <button
                  onClick={() => handleQuickAdd(100000)}
                  className="py-1 px-1 rounded-lg bg-surface-container-lowest hover:bg-surface-container-high text-[11px] sm:text-xs font-semibold text-secondary hover:text-on-surface border border-surface-variant transition-colors text-center active:scale-95 cursor-pointer truncate"
                  type="button"
                >
                  +100rb
                </button>
                <button
                  onClick={() => handleQuickAdd(500000)}
                  className="py-1 px-1 rounded-lg bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed text-[11px] sm:text-xs font-bold border border-outline-variant transition-colors text-center active:scale-95 cursor-pointer truncate"
                  type="button"
                >
                  +500rb
                </button>
              </div>
            </div>

            {/* 3. Transaction Details Form Fields */}
            <div className="space-y-2.5 sm:space-y-3">
              {/* Outlet Gerai Dropdown */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                  Gerai Outlet
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-primary">
                    <span className="material-symbols-outlined text-[18px]">storefront</span>
                  </div>
                  <select
                    value={outletId || (outlets.length > 0 ? outlets[0].id : "")}
                    onChange={(e) => {
                      setOutletId(e.target.value);
                      setErrors((prev) => ({ ...prev, outlet_id: null, form: null }));
                    }}
                    className="w-full pl-10 pr-9 py-2.5 bg-surface-container-lowest border border-surface-variant/80 rounded-xl text-xs sm:text-sm text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer transition-all"
                  >
                    {outlets.length === 0 ? (
                      <option value="">Gerai Utama Sukapura</option>
                    ) : (
                      outlets.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-secondary">
                    <span className="material-symbols-outlined text-[18px]">unfold_more</span>
                  </div>
                </div>
                {errors.outlet_id && (
                  <p className="text-xs text-primary mt-1 font-semibold">{errors.outlet_id}</p>
                )}
              </div>

              {/* Tanggal Transaksi */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                  Tanggal Transaksi
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-secondary">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  </div>
                  <input
                    className="w-full pl-10 pr-3 py-2.5 bg-surface-container-lowest border border-surface-variant/80 rounded-xl text-xs sm:text-sm text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                {errors.transaction_date && (
                  <p className="text-xs text-primary mt-1 font-semibold">{errors.transaction_date}</p>
                )}
              </div>

              {/* Kategori Single-Select Popover with Add & Delete */}
              <div className="relative w-full" ref={categoryDropdownRef}>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] sm:text-xs font-semibold text-secondary">
                    Kategori {type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </label>
                  <span className="text-[10px] sm:text-[11px] text-secondary font-medium">
                    {availableCategories.length} kategori aktif
                  </span>
                </div>

                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={toggleCategoryDropdown}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border transition-all flex items-center justify-between cursor-pointer shadow-2xs ${
                    errors.category_id
                      ? "border-primary bg-error-container/20 text-primary"
                      : isCategoryDropdownOpen
                      ? "border-primary ring-2 ring-primary/20 bg-surface-container-lowest text-on-surface"
                      : "border-surface-variant/80 bg-surface-container-lowest text-on-surface hover:border-surface-variant"
                  }`}
                  title="Klik untuk memilih kategori"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
                      {type === "income" ? "category" : "inventory_2"}
                    </span>
                    <span className="font-semibold truncate">
                      {selectedCatObj ? selectedCatObj.name : "Pilih Kategori"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-secondary">
                    <span className="material-symbols-outlined text-[18px]">
                      {isCategoryDropdownOpen ? "expand_less" : "expand_more"}
                    </span>
                  </div>
                </button>

                {errors.category_id && (
                  <p className="text-xs text-primary mt-1 font-semibold">{errors.category_id}</p>
                )}

                {/* Single-Select Floating Popover */}
                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-surface-container-lowest border border-surface-variant/70 rounded-2xl shadow-2xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    {/* Popover Header */}
                    <div className="flex items-center justify-between border-b border-surface-variant/20 pb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-on-surface truncate">
                          Pilih 1 Kategori
                        </span>
                        {/* Add Category Trigger Button */}
                        {isOwner && (<button
                          type="button"
                          onClick={() => setIsAddingCategory((prev) => !prev)}
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
                        </button>)}
                      </div>

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

                    {/* Inline Add Category Mini-Form */}
                    {isOwner && isAddingCategory && (
                      <div
                        className="p-2.5 rounded-xl bg-surface-container border border-primary/30 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-primary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">add_circle</span>
                            <span>Kategori {type === "income" ? "Pemasukan" : "Pengeluaran"} Baru</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCreateCategory(e);
                              }
                            }}
                            placeholder="Contoh: Bahan Baku, Kemasan..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-surface-container-lowest border border-surface-variant/60 focus:border-primary focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={isSubmittingCat || !newCatName.trim()}
                            className="px-3 py-1.5 bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                          >
                            {isSubmittingCat ? "..." : "Simpan"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Category List: 1 Category per Row, Single Select (Radio Style), Full Name, No Truncate */}
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5 no-scrollbar">
                      {availableCategories.length === 0 ? (
                        <div className="py-6 text-center text-secondary text-xs">
                          <p>Belum ada kategori {type === "income" ? "pemasukan" : "pengeluaran"}.</p>
                          {isOwner && (<button
                            type="button"
                            onClick={() => setIsAddingCategory(true)}
                            className="text-primary font-bold hover:underline mt-1 inline-block cursor-pointer"
                          >
                            + Tambah Kategori Sekarang
                          </button>)}
                        </div>
                      ) : (
                        availableCategories.map((cat) => {
                          const isSelected = categoryId === cat.id;
                          return (
                            <div
                              key={cat.id}
                              className={`group/cat flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl text-xs font-semibold transition-all border ${
                                isSelected
                                  ? type === "income"
                                    ? "bg-tertiary/10 border-tertiary text-tertiary shadow-2xs"
                                    : "bg-primary/10 border-primary text-primary shadow-2xs"
                                  : "bg-surface-container-low border-surface-variant/40 text-secondary hover:bg-surface-container hover:text-on-surface"
                              }`}
                            >
                              {/* Selection Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCategoryId(cat.id);
                                  setErrors((prev) => ({ ...prev, category_id: null, form: null }));
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                                title={`Pilih ${cat.name}`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border transition-colors ${
                                    isSelected
                                      ? type === "income"
                                        ? "bg-tertiary text-on-tertiary border-tertiary"
                                        : "bg-primary text-on-primary border-primary"
                                      : "border-surface-variant bg-surface-container-lowest text-transparent"
                                  }`}
                                >
                                  ✓
                                </span>
                                <span className="font-medium text-on-surface leading-tight break-words">
                                  {cat.name}
                                </span>
                              </button>

                              {/* Delete Category Button */}
                              {isOwner && (<button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(cat);
                                }}
                                className="opacity-40 hover:opacity-100 hover:text-primary hover:bg-error-container/30 p-1 rounded-lg transition-all cursor-pointer shrink-0 ml-1"
                                title={`Hapus kategori "${cat.name}"`}
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>)}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Kanal Penjualan / Channel Single-Select Popover with Add & Delete */}
              <div className="relative w-full" ref={channelDropdownRef}>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] sm:text-xs font-semibold text-secondary">
                    Kanal / Channel
                  </label>
                  <span className="text-[10px] sm:text-[11px] text-secondary font-medium">
                    {channels.length} kanal aktif
                  </span>
                </div>

                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={toggleChannelDropdown}
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border transition-all flex items-center justify-between cursor-pointer shadow-2xs ${
                    isChannelDropdownOpen
                      ? "border-primary ring-2 ring-primary/20 bg-surface-container-lowest text-on-surface"
                      : "border-surface-variant/80 bg-surface-container-lowest text-on-surface hover:border-surface-variant"
                  }`}
                  title="Klik untuk memilih kanal"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
                      hub
                    </span>
                    <span className="font-semibold truncate">
                      {channel || "Pilih Kanal"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-secondary">
                    <span className="material-symbols-outlined text-[18px]">
                      {isChannelDropdownOpen ? "expand_less" : "expand_more"}
                    </span>
                  </div>
                </button>

                {/* Single-Select Floating Popover */}
                {isChannelDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-surface-container-lowest border border-surface-variant/70 rounded-2xl shadow-2xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    {/* Popover Header */}
                    <div className="flex items-center justify-between border-b border-surface-variant/20 pb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-on-surface truncate">
                          Pilih 1 Kanal
                        </span>
                        {/* Add Channel Trigger Button */}
                        {isOwner && (<button
                          type="button"
                          onClick={() => setIsAddingChannel((prev) => !prev)}
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                            isAddingChannel
                              ? "bg-primary text-on-primary border-primary shadow-xs"
                              : "bg-surface-container text-primary hover:bg-surface-container-high border-surface-variant/40"
                          }`}
                          title="Tambah kanal baru"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {isAddingChannel ? "close" : "add"}
                          </span>
                          <span>{isAddingChannel ? "Batal" : "Tambah"}</span>
                        </button>)}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsChannelDropdownOpen(false);
                          setIsAddingChannel(false);
                        }}
                        className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
                        title="Tutup"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>

                    {/* Inline Add Channel Mini-Form */}
                    {isOwner && isAddingChannel && (
                      <div
                        className="p-2.5 rounded-xl bg-surface-container border border-primary/30 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-bold text-primary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">add_circle</span>
                            <span>Kanal Baru</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCreateChannel(e);
                              }
                            }}
                            placeholder="Contoh: TikTok Shop, Bazaar..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-surface-container-lowest border border-surface-variant/60 focus:border-primary focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleCreateChannel}
                            disabled={!newChannelName.trim()}
                            className="px-3 py-1.5 bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Channel List: 1 Channel per Row, Single Select (Radio Style), Full Name, No Truncate */}
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5 no-scrollbar">
                      {channels.length === 0 ? (
                        <div className="py-6 text-center text-secondary text-xs">
                          <p>Belum ada kanal transaksi.</p>
                          {isOwner && (<button
                            type="button"
                            onClick={() => setIsAddingChannel(true)}
                            className="text-primary font-bold hover:underline mt-1 inline-block cursor-pointer"
                          >
                            + Tambah Kanal Sekarang
                          </button>)}
                        </div>
                      ) : (
                        channels.map((ch) => {
                          const isSelected = channel === ch;
                          return (
                            <div
                              key={ch}
                              className={`group/ch flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl text-xs font-semibold transition-all border ${
                                isSelected
                                  ? "bg-primary/10 border-primary text-primary shadow-2xs"
                                  : "bg-surface-container-low border-surface-variant/40 text-secondary hover:bg-surface-container hover:text-on-surface"
                              }`}
                            >
                              {/* Selection Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setChannel(ch);
                                  setIsChannelDropdownOpen(false);
                                }}
                                className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                                title={`Pilih ${ch}`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border transition-colors ${
                                    isSelected
                                      ? "bg-primary text-on-primary border-primary"
                                      : "border-surface-variant bg-surface-container-lowest text-transparent"
                                  }`}
                                >
                                  ✓
                                </span>
                                <span className="font-medium text-on-surface leading-tight break-words">
                                  {ch}
                                </span>
                              </button>

                              {/* Delete Channel Button */}
                              {isOwner && (<button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteChannel(ch);
                                }}
                                className="opacity-40 hover:opacity-100 hover:text-primary hover:bg-error-container/30 p-1 rounded-lg transition-all cursor-pointer shrink-0 ml-1"
                                title={`Hapus kanal "${ch}"`}
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>)}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Metode Pembayaran (Radio Chips) */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {/* Option 1: Kas Tunai */}
                  <label
                    onClick={() => setPaymentMethod("Kas Tunai")}
                    className={`flex items-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === "Kas Tunai"
                        ? "border-primary bg-primary-fixed/20 shadow-xs"
                        : "border-surface-variant/80 bg-surface-container-lowest hover:border-secondary"
                    }`}
                  >
                    <input
                      checked={paymentMethod === "Kas Tunai"}
                      onChange={() => setPaymentMethod("Kas Tunai")}
                      className="text-primary focus:ring-primary h-4 w-4 shrink-0 cursor-pointer"
                      name="payment_method"
                      type="radio"
                    />
                    <div className="ml-2 min-w-0">
                      <span className="block text-xs font-bold text-on-surface truncate">
                        Kas Tunai
                      </span>
                      <span className="block text-[10px] text-secondary truncate">
                        Laci Kasir Gerai
                      </span>
                    </div>
                  </label>

                  {/* Option 2: Bank BCA / Transfer */}
                  <label
                    onClick={() => setPaymentMethod("Transfer BCA / QRIS")}
                    className={`flex items-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === "Transfer BCA / QRIS"
                        ? "border-primary bg-primary-fixed/20 shadow-xs"
                        : "border-surface-variant/80 bg-surface-container-lowest hover:border-secondary"
                    }`}
                  >
                    <input
                      checked={paymentMethod === "Transfer BCA / QRIS"}
                      onChange={() => setPaymentMethod("Transfer BCA / QRIS")}
                      className="text-primary focus:ring-primary h-4 w-4 shrink-0 cursor-pointer"
                      name="payment_method"
                      type="radio"
                    />
                    <div className="ml-2 min-w-0">
                      <span className="block text-xs font-bold text-on-surface truncate">
                        Bank BCA / QRIS
                      </span>
                      <span className="block text-[10px] text-secondary truncate">
                        Transfer / Settlement
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-secondary mb-1">
                  Catatan / Keterangan
                </label>
                <textarea
                  className="w-full p-2.5 sm:p-3 bg-surface-container-lowest border border-surface-variant/80 rounded-xl text-xs sm:text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none placeholder-secondary/60 transition-all font-medium"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Beli ayam fillet 10kg di pasar, Penjualan shift siang kasir..."
                />
              </div>

              {/* Lampiran / Bukti Struk (Receipt Upload) */}
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-secondary mb-1">
                  Bukti Struk / Nota (Opsional)
                </label>
                {!receiptImage ? (
                  <div className="border-2 border-dashed border-surface-variant hover:border-primary/50 bg-surface-container-low/50 rounded-xl p-2.5 text-center flex flex-col items-center justify-center transition-colors cursor-pointer group relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-105 transition-transform mb-1">
                      <span className="material-symbols-outlined text-lg">
                        photo_camera
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-on-surface">
                      Unggah Struk / Nota
                    </div>
                    <div className="text-[10px] text-secondary mt-0.5">
                      Ketuk untuk kamera foto atau galeri (Auto kompresi HD)
                    </div>
                  </div>
                ) : (
                  <div className="relative border border-surface-variant/80 bg-surface-container-low rounded-xl p-2.5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-surface-variant shrink-0 bg-black/5 flex items-center justify-center">
                      <img
                        src={receiptImage}
                        alt="Preview Struk"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-tertiary font-bold text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Struk Terlampir</span>
                      </div>
                      <p className="text-[10px] text-secondary truncate mt-0.5">
                        Siap disimpan ke database
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label className="p-1.5 rounded-lg border border-surface-variant hover:bg-surface-container text-xs text-secondary hover:text-on-surface cursor-pointer flex items-center justify-center" title="Ganti Foto">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <span className="material-symbols-outlined text-base">cached</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setReceiptImage(null)}
                        className="p-1.5 rounded-lg border border-error-container bg-error-container/40 hover:bg-error-container text-primary transition-colors cursor-pointer flex items-center justify-center"
                        title="Hapus Foto"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="px-3.5 sm:px-4 py-3 bg-surface-container-lowest border-t border-surface-variant/60 flex items-center space-x-2.5 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              onClick={onClose}
              disabled={submitting}
              className="w-1/3 py-2.5 px-2 rounded-xl border border-surface-variant/80 hover:bg-surface-container text-xs sm:text-sm font-semibold text-secondary text-center transition-colors cursor-pointer active:scale-95"
              type="button"
            >
              Batal
            </button>

            <button
              disabled={submitting}
              className={`w-2/3 py-2.5 px-3 rounded-xl bg-gradient-to-r from-primary via-rose-600 to-rose-500 hover:brightness-110 text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/25 flex items-center justify-center space-x-1.5 transition-all active:scale-[0.98] cursor-pointer ring-1 ring-white/20 ${
                submitting ? "opacity-75 cursor-not-allowed" : ""
              }`}
              type="submit"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span
                    className="material-symbols-outlined text-base"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <span>Simpan Transaksi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Premium Confirm Action Modal */}
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
