import React, { useState } from "react";
import { useBusiness } from "../hooks/useBusiness";
import { useAuth } from "../hooks/useAuth";
import ConfirmModal from "./ConfirmModal";

export default function Sidebar({ activeTab, onTabChange, onOpenTransactionModal }) {
  const { business, outlets, selectedOutlet, role } = useBusiness();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard Keuangan", icon: "dashboard", filled: true },
    { id: "transactions", label: "Riwayat Transaksi", icon: "payments", filled: false },
    { id: "reports", label: "Laporan Laba Rugi", icon: "analytics", filled: false },
    { id: "settings", label: "Pengaturan Outlet", icon: "storefront", filled: false },
  ];

  const getOutletName = () => {
    if (selectedOutlet === "all") return "Semua Gerai (Konsolidasi)";
    const found = outlets.find((o) => o.id === selectedOutlet);
    return found ? found.name : "Gerai Utama Sukapura";
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "NM";
  };

  const getRoleLabel = () => {
    if (role === "owner") return "Owner & Manager";
    if (role === "admin") return "Admin Keuangan";
    return role || "Pengelola Bisnis";
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <aside className="hidden md:flex flex-col justify-between h-screen sticky top-0 bg-inverse-surface w-72 p-space-lg shadow-xl shrink-0 z-40">
      <div>
        {/* Profile / Header layout */}
        <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-surface-variant/10">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary font-headline-md font-bold tracking-tight shadow-md select-none shrink-0">
            PN
          </div>
          <div className="overflow-hidden min-w-0">
            <h2 className="text-headline-sm font-headline-sm text-inverse-on-surface truncate">
              {business?.name || "Pasta Nafisa"}
            </h2>
            <p className="text-body-sm font-body-sm text-secondary-fixed">
              Financial System
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed animate-pulse shrink-0"></span>
              <span className="text-label-sm font-label-sm text-secondary-fixed-dim truncate">
                {getOutletName()}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 rounded-lg font-semibold px-space-md py-space-sm active:scale-98 transition-all duration-150 text-left cursor-pointer ${
                  isActive
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-secondary-fixed hover:text-surface hover:bg-on-secondary-fixed-variant/40"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={item.filled || isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="text-label-md font-label-md">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Add CTA in Desktop Sidebar */}
        <div className="mt-8 pt-4 border-t border-surface-variant/10">
          <button
            onClick={onOpenTransactionModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-label-md font-label-md font-semibold shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>+ Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Drawer Bottom Profile with Functional Logout */}
      <div className="pt-4 border-t border-surface-variant/10 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold flex items-center justify-center text-label-md shrink-0">
            {getUserInitials()}
          </div>
          <div className="min-w-0">
            <p className="text-label-md font-label-md text-inverse-on-surface leading-tight truncate">
              {user?.email ? user.email.split("@")[0] : "Nur Maria Ulfah"}
            </p>
            <p className="text-label-sm font-label-sm text-secondary-fixed truncate">
              {getRoleLabel()}
            </p>
          </div>
        </div>
        <button
          title="Keluar dari akun"
          onClick={handleLogout}
          className="text-secondary-fixed hover:text-primary-fixed p-1.5 transition-colors rounded-lg hover:bg-on-secondary-fixed-variant/30 cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
        </button>
      </div>

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
    </aside>
  );
}
