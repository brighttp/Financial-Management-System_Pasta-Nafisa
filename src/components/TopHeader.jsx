import React, { useState, useRef, useEffect } from "react";
import { useBusiness } from "../hooks/useBusiness";
import { useAuth } from "../hooks/useAuth";
import ConfirmModal from "./ConfirmModal";

export default function TopHeader({
  activePeriod,
  onPeriodChange,
  onOpenTransactionModal,
  customDateRange,
  onOpenDateRangeModal,
}) {
  const { business, outlets, selectedOutlet, setSelectedOutlet, role } = useBusiness();
  const { user, logout } = useAuth();

  const [showOutletDropdown, setShowOutletDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const userDropdownRef = useRef(null);
  const outletDropdownRef = useRef(null);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (outletDropdownRef.current && !outletDropdownRef.current.contains(event.target)) {
        setShowOutletDropdown(false);
      }
    }
    if (showUserDropdown || showOutletDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showUserDropdown, showOutletDropdown]);

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

  // Active Outlet Label
  const getSelectedOutletLabel = () => {
    if (selectedOutlet === "all") return "Semua Gerai";
    const found = Array.isArray(outlets) ? outlets.find((o) => o.id === selectedOutlet) : null;
    return found ? found.name : "Gerai Utama Sukapura";
  };

  // Derive User Initials
  const getUserInitials = () => {
    if (user?.email) {
      const namePart = user.email.split("@")[0];
      return namePart.slice(0, 2).toUpperCase();
    }
    return "NM";
  };

  const getUserDisplayName = () => {
    return user?.email || "Nur Maria Ulfah";
  };

  const getRoleLabel = () => {
    if (role === "owner") return "Owner";
    if (role === "admin") return "Admin Keuangan";
    return role || "Owner & Manager";
  };

  return (
    <header className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-[#161b26] to-slate-900 border border-white/10 shadow-xl shadow-slate-950/25 mb-4 sm:mb-6 text-white transition-all">
      {/* Ambient Decorative Glow Lights (Isolated with overflow-hidden so they don't clip dropdowns) */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl"></div>
      </div>

      {/* Top Bar with Logo, Outlet Badge, & Profile (Higher z-index so dropdowns float over Sub-Bar) */}
      <div className="relative z-30 flex justify-between items-center w-full px-3.5 sm:px-5 py-3 sm:py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Crimson Glossy PN Logo */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary via-rose-600 to-rose-500 text-white flex items-center justify-center font-black text-base shadow-lg shadow-primary/30 ring-1 ring-white/25 select-none shrink-0 tracking-wider">
            PN
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                {business?.name || "Pasta Nafisa"}
              </span>

              {/* Modern Frosted Outlet Switcher Pill */}
              <div className="relative inline-block" ref={outletDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowOutletDropdown(!showOutletDropdown)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                  title="Klik untuk ganti filter outlet"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="truncate max-w-[130px] sm:max-w-none">
                    {getSelectedOutletLabel()}
                  </span>
                  <span className="material-symbols-outlined text-[14px] opacity-80">
                    expand_more
                  </span>
                </button>

                {showOutletDropdown && (
                  <div className="absolute left-0 top-8 w-60 bg-slate-900/95 text-white border border-white/15 backdrop-blur-xl rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/40">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10 mb-1">
                      Pilih Filter Outlet
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOutlet("all");
                        setShowOutletDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                        selectedOutlet === "all"
                          ? "bg-primary text-white shadow-xs font-bold"
                          : "text-slate-200 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span>Semua Gerai (Konsolidasi)</span>
                      {selectedOutlet === "all" && (
                        <span className="material-symbols-outlined text-sm">check</span>
                      )}
                    </button>
                    {(outlets || []).map((outlet) => (
                      <button
                        key={outlet.id}
                        type="button"
                        onClick={() => {
                          setSelectedOutlet(outlet.id);
                          setShowOutletDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer mt-0.5 transition-colors ${
                          selectedOutlet === outlet.id
                            ? "bg-primary text-white shadow-xs font-bold"
                            : "text-slate-200 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span className="truncate">{outlet.name}</span>
                        {selectedOutlet === outlet.id && (
                          <span className="material-symbols-outlined text-sm">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-wide mt-0.5">
              Financial System • <span className="text-slate-300 font-semibold">{getRoleLabel()}</span>
            </p>
          </div>
        </div>

        {/* Trailing User Profile Avatar Area */}
        <div className="flex items-center gap-2 relative shrink-0 ml-2" ref={userDropdownRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full ring-2 ring-white/20 hover:ring-primary/80 bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-xs sm:text-sm select-none cursor-pointer transition-all shadow-md active:scale-95"
              title={`${getUserDisplayName()} (${getRoleLabel()})`}
            >
              {getUserInitials()}
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 top-12 w-60 bg-slate-900/95 border border-white/15 backdrop-blur-xl rounded-2xl shadow-2xl p-2.5 z-50 text-white text-left animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/40">
                <div className="px-2.5 py-2 border-b border-white/10 mb-1.5">
                  <p className="text-xs font-bold text-white truncate">
                    {getUserDisplayName()}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-rose-300 border border-primary/30">
                    {getRoleLabel()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 active:scale-95 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">logout</span>
                  <span>Keluar Akun (Logout)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Period & CTA Sub-Bar */}
      <div className="relative z-10 px-3.5 sm:px-5 pb-3.5 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-white/10">
        {/* Global Period Selector: 3 Presets in row 1, Custom Date Range in row 2 on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          {/* 3 Main Presets in Segmented Grid */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl backdrop-blur-md w-full sm:w-auto">
            {periods.map((p) => {
              const isActive = activePeriod === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onPeriodChange(p.id)}
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
                onPeriodChange("custom");
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

        {/* Quick Action CTA Button */}
        <button
          onClick={onOpenTransactionModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary via-rose-600 to-rose-500 hover:brightness-110 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all cursor-pointer shrink-0 ring-1 ring-white/20"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Catat Transaksi</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Keluar dari Akun?"
        message="Sesi login Anda akan diakhiri. Anda perlu memasukkan kredensial lagi untuk masuk ke Pasta Nafisa."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        type="warning"
        onConfirm={logout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </header>
  );
}
