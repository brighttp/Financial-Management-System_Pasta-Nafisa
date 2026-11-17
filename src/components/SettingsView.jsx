import React, { useState } from "react";
import { useBusiness } from "../hooks/useBusiness";
import { useAuth } from "../hooks/useAuth";
import { seedInitialBusinessDefaults } from "../services/businessService";
import ConfirmModal from "./ConfirmModal";

export default function SettingsView({ onBackToDashboard }) {
  const { business, outlets, categories, selectedOutlet, setSelectedOutlet, role, refreshBusinessData, addCategory, removeCategory } = useBusiness();
  const { user, logout } = useAuth();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Custom confirmation dialog state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Hapus",
    cancelText: "Batal",
    type: "danger",
    onConfirm: null,
  });

  // Category management in settings
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("expense");
  const [addingCatLoading, setAddingCatLoading] = useState(false);

  const handleSeedDefaults = async () => {
    if (!business?.id) return;
    try {
      setSeeding(true);
      await seedInitialBusinessDefaults(business.id);
      await refreshBusinessData();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert("Gagal melakukan inisialisasi: " + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-space-md md:p-space-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-surface-variant/20">
          <button
            onClick={onBackToDashboard}
            className="p-1 rounded-lg text-secondary hover:bg-surface-container transition-colors md:hidden cursor-pointer"
            aria-label="Kembali"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-headline-sm font-headline-sm text-on-surface">
              Pengaturan Gerai &amp; Profil
            </h2>
            <p className="text-body-sm font-body-sm text-secondary">
              Informasi unit usaha dan otorisasi Pasta Nafisa
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-tertiary/10 border border-tertiary/30 text-tertiary text-xs sm:text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>Pengaturan preferensi gerai berhasil disimpan.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          {/* Unit Usaha */}
          <div>
            <label className="block text-label-md font-label-md text-secondary mb-1">
              Nama Unit Bisnis (Supabase)
            </label>
            <input
              type="text"
              readOnly
              value={business?.name || "Pasta Nafisa"}
              className="w-full px-3 py-2 rounded-xl border border-surface-variant/60 bg-surface-container-low text-body-sm text-on-surface cursor-not-allowed font-semibold"
            />
            <p className="text-[11px] text-secondary mt-1">
              ID Bisnis: <span className="font-mono text-xs">{business?.id || "—"}</span>
            </p>
          </div>

          {/* Active Outlet Selection */}
          <div>
            <label className="block text-label-md font-label-md text-secondary mb-1">
              Filter Gerai Aktif
            </label>
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-surface-variant/60 focus:border-primary text-body-sm bg-surface-container-lowest"
            >
              <option value="all">Semua Gerai (Konsolidasi Bisnis)</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} {o.is_active === false ? "(Nonaktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* User Account Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-label-md font-label-md text-secondary mb-1">
                Akun Terautentikasi
              </label>
              <input
                type="text"
                readOnly
                value={user?.email || "—"}
                className="w-full px-3 py-2 rounded-xl border border-surface-variant/60 bg-surface-container-low text-body-sm text-on-surface font-semibold"
              />
            </div>
            <div>
              <label className="block text-label-md font-label-md text-secondary mb-1">
                Peran / Role Otoritas
              </label>
              <input
                type="text"
                readOnly
                value={role === "owner" ? "Owner / Pemilik" : "Staff Keuangan"}
                className="w-full px-3 py-2 rounded-xl border border-surface-variant/60 bg-surface-container-low text-body-sm text-on-surface font-semibold capitalize"
              />
            </div>
          </div>

          {/* Outlets Listing */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-label-md font-label-md text-secondary">
                Daftar Gerai Resmi ({outlets.length} Gerai)
              </label>
              {(outlets.length === 0 || categories.length === 0) && (
                <button
                  type="button"
                  disabled={seeding}
                  onClick={handleSeedDefaults}
                  className="px-2.5 py-1 text-xs font-semibold bg-tertiary/10 text-tertiary hover:bg-tertiary/20 rounded-lg transition-colors cursor-pointer"
                >
                  {seeding ? "Menginisialisasi..." : "+ Inisialisasi Gerai & Kategori"}
                </button>
              )}
            </div>
            <div className="space-y-2">
              {outlets.length === 0 ? (
                <div className="p-4 rounded-xl border border-surface-variant/60 bg-surface-container-low text-center text-xs text-secondary">
                  <p>Belum ada gerai terdaftar di Supabase.</p>
                  <button
                    type="button"
                    disabled={seeding}
                    onClick={handleSeedDefaults}
                    className="mt-2 px-3 py-1.5 text-xs font-bold bg-primary text-on-primary rounded-lg shadow-xs cursor-pointer"
                  >
                    Inisialisasi Gerai Standar
                  </button>
                </div>
              ) : (
                outlets.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 rounded-xl border border-surface-variant/60 bg-surface-container-low flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-primary text-xl">
                        storefront
                      </span>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-on-surface">{o.name}</p>
                        <p className="text-[10px] text-secondary font-mono">{o.id}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary/10 text-tertiary">
                      Aktif
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Categories Listing */}
          <div className="pt-3 border-t border-surface-variant/20">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-label-md font-label-md text-secondary">
                Daftar Kategori Transaksi ({categories.length} Kategori)
              </label>
              <button
                type="button"
                onClick={() => setShowAddCat(!showAddCat)}
                className="px-2.5 py-1 text-xs font-semibold bg-primary text-on-primary rounded-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {showAddCat ? "close" : "add"}
                </span>
                <span>{showAddCat ? "Batal" : "Tambah Kategori"}</span>
              </button>
            </div>

            {showAddCat && (
              <div className="p-3 mb-3 rounded-xl border border-primary/30 bg-surface-container space-y-2 animate-in fade-in duration-150">
                <p className="text-xs font-bold text-primary">Tambah Kategori Baru</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Nama Kategori (misal: Bahan Baku, Iklan)..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-surface-variant/60 bg-surface-container-lowest focus:border-primary focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value)}
                      className="px-2 py-1.5 text-xs rounded-lg border border-surface-variant/60 bg-surface-container-lowest font-semibold"
                    >
                      <option value="expense">🔴 Pengeluaran</option>
                      <option value="income">🟢 Pemasukan</option>
                    </select>
                    <button
                      type="button"
                      disabled={addingCatLoading || !newCatName.trim()}
                      onClick={async () => {
                        if (!newCatName.trim()) return;
                        try {
                          setAddingCatLoading(true);
                          await addCategory({ name: newCatName.trim(), type: newCatType });
                          setNewCatName("");
                          setShowAddCat(false);
                        } catch (err) {
                          alert(err.message || "Gagal menambah kategori.");
                        } finally {
                          setAddingCatLoading(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      {addingCatLoading ? "..." : "Simpan"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl border border-surface-variant/60 bg-surface-container-low flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${c.type === "income" ? "bg-tertiary" : "bg-primary"}`}></span>
                    <span className="font-semibold text-on-surface truncate">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.type === "income" ? "bg-tertiary/10 text-tertiary" : "bg-primary/10 text-primary"}`}>
                      {c.type === "income" ? "Masuk" : "Keluar"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: "Hapus Kategori?",
                          message: `Apakah Anda yakin ingin menghapus kategori "${c.name}" dari sistem? Transaksi terdahulu yang menggunakan kategori ini tetap tercatat.`,
                          confirmText: "Ya, Hapus",
                          cancelText: "Batal",
                          type: "danger",
                          onConfirm: async () => {
                            try {
                              await removeCategory(c.id);
                            } catch (err) {
                              alert(err.message || "Gagal menghapus kategori.");
                            }
                          },
                        });
                      }}
                      className="p-1 text-secondary hover:text-primary rounded cursor-pointer transition-colors"
                      title="Hapus Kategori"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-surface-variant/20">
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-label-md font-semibold shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Simpan Pengaturan
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: "Keluar dari Sistem?",
                  message: "Apakah Anda yakin ingin keluar dari sistem Pasta Nafisa?",
                  confirmText: "Ya, Keluar",
                  cancelText: "Batal",
                  type: "warning",
                  onConfirm: logout,
                });
              }}
              className="px-4 py-2 border border-primary/40 text-primary hover:bg-error-container/30 rounded-xl text-label-md font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Keluar Sesi</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
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
