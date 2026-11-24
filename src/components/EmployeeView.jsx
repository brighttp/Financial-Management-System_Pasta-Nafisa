import React, { useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useBusiness } from '../hooks/useBusiness';
import { createTransaction } from '../services/transactionService';
import TransactionModal from './TransactionModal';
import EmployeeHistory from './EmployeeHistory';
import ConfirmModal from './ConfirmModal';

export default function EmployeeView() {
  const { user, logout } = useAuth();
  const { business, role, outlets, categories, showToast } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [historyRevision, setHistoryRevision] = useState(0);
  const saving = useRef(false);
  const ready = outlets.some(o => o.is_active !== false) && categories.length > 0;

  const handleSave = async (formData) => {
    if (saving.current) throw new Error('Transaksi sedang disimpan.');
    if (role !== 'pegawai' || !business?.id || !user?.id) throw new Error('Sesi tidak aktif. Silakan masuk kembali.');
    saving.current = true;
    try {
      await createTransaction({ ...formData, businessId: business.id, userId: user.id }, { returnRecord: false });
      setHistoryRevision(n => n + 1);
      setSavedAt(new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }));
      showToast('Catatan sudah diterima. Kamu bisa melanjutkan transaksi berikutnya.', 'success', 'Transaksi tersimpan');
    } finally {
      saving.current = false;
    }
  };

  return (
    <div className="min-h-dvh bg-background text-on-surface antialiased">
      <main className="max-w-lg mx-auto w-full px-4 py-6 sm:py-10">
        <header className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-rose-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">PN</div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{business.name}</p>
              <p className="text-xs text-secondary mt-1">Ruang pegawai</p>
            </div>
          </div>
          <button type="button" onClick={() => setConfirmLogout(true)} className="w-11 h-11 rounded-xl border border-surface-variant bg-white text-secondary hover:text-primary hover:bg-primary/5 flex items-center justify-center shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" aria-label="Keluar akun" title="Keluar akun">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">logout</span>
          </button>
        </header>

        <section className="overflow-hidden rounded-2xl border border-surface-variant/60 bg-surface-container-lowest shadow-sm" aria-labelledby="employee-title">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#161b26] to-slate-900 px-5 py-6 sm:px-6 text-white">
            <div className="absolute -top-14 -right-12 w-44 h-44 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <span className="material-symbols-outlined text-2xl text-rose-300 mb-4" aria-hidden="true">edit_note</span>
              <h1 id="employee-title" className="text-xl font-bold tracking-tight">Pencatatan transaksi</h1>
              <p className="text-sm text-slate-300 leading-relaxed mt-2">Catat pemasukan atau pengeluaran gerai.</p>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <button type="button" disabled={!ready} onClick={() => setIsOpen(true)} className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-rose-500 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <span className="material-symbols-outlined text-xl" aria-hidden="true">add</span>Catat Transaksi
            </button>
            {!ready && <p className="text-xs text-primary mt-3 leading-relaxed" role="status">Hubungi owner untuk menyiapkan gerai dan kategori transaksi.</p>}
            {savedAt && <div role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 flex items-start gap-2 text-emerald-800">
              <span className="material-symbols-outlined text-lg shrink-0" aria-hidden="true">check_circle</span>
              <p className="text-xs leading-relaxed">Transaksi terakhir tersimpan pukul <span className="font-semibold">{savedAt}</span>.</p>
            </div>}
          </div>
        </section>

        <EmployeeHistory businessId={business.id} userId={user.id} revision={historyRevision} />

        <div className="flex items-center justify-center gap-2 mt-5 px-2 text-xs text-secondary min-w-0">
          <span className="material-symbols-outlined text-base shrink-0" aria-hidden="true">account_circle</span>
          <span className="truncate" title={user.email}>{user.email}</span>
        </div>
      </main>
      <TransactionModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSave={handleSave} />
      <ConfirmModal isOpen={confirmLogout} title="Keluar dari akun?" message="Pastikan transaksi kamu sudah tersimpan sebelum keluar." confirmText="Ya, Keluar" cancelText="Batal" type="warning" onConfirm={logout} onCancel={() => setConfirmLogout(false)} />
    </div>
  );
}
