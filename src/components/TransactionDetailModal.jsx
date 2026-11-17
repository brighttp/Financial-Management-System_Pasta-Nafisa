import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { formatIDR } from "../utils/currencyFormatter";
import { formatIndonesianDate } from "../utils/dateHelpers";

export default function TransactionDetailModal({
  isOpen,
  transaction,
  onClose,
  onDelete,
}) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isZoomOpen) {
          setIsZoomOpen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isZoomOpen, onClose]);

  if (!isOpen || !transaction || typeof document === "undefined" || !document.body) return null;

  const isIncome = transaction.type === "income";
  const txDate = transaction.transaction_date || transaction.date;
  const receiptImg = transaction.receiptImage || transaction.receipt_url || null;

  return createPortal(
    <>
      {/* Main Detail Modal */}
      <div
        className="fixed inset-0 z-[9990] overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <div
          className="bg-surface-container-lowest border border-surface-variant/50 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isIncome
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-primary text-white shadow-primary/30"
                }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {transaction.icon || (isIncome ? "point_of_sale" : "shopping_basket")}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight truncate">
                  Rincian Transaksi
                </h3>
                <p className="text-[11px] text-slate-300 font-mono truncate">
                  ID: {transaction.id ? String(transaction.id).slice(0, 18) : "—"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Tutup"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 space-y-4 text-on-surface max-h-[82vh] overflow-y-auto">
            {/* Highlight Amount Card */}
            <div
              className={`p-4 rounded-2xl border text-center relative overflow-hidden ${
                isIncome
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                  : "bg-error-container/40 border-primary/30 text-primary"
              }`}
            >
              <span className="text-[11px] uppercase font-bold tracking-wider opacity-80 block">
                {isIncome ? "Total Pemasukan" : "Total Pengeluaran"}
              </span>
              <span className="text-2xl sm:text-3xl font-black block mt-1 tracking-tight">
                {isIncome ? `+${formatIDR(transaction.amount)}` : `-${formatIDR(transaction.amount)}`}
              </span>
              <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold px-3 py-1 rounded-full bg-surface-container-lowest text-on-surface shadow-xs border border-surface-variant/40">
                <span>{transaction.category_name || transaction.category || (isIncome ? "Pemasukan" : "Pengeluaran")}</span>
              </div>
            </div>

            {/* Information Grid */}
            <div className="divide-y divide-surface-variant/30 border border-surface-variant/40 rounded-2xl p-3.5 text-xs sm:text-sm bg-surface-container-lowest shadow-2xs">
              <div className="py-2 flex justify-between items-start gap-2">
                <span className="text-secondary font-medium shrink-0">Catatan / Keterangan</span>
                <span className="text-on-surface font-semibold text-right">
                  {transaction.description || transaction.title || "—"}
                </span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-secondary font-medium">Tanggal &amp; Waktu</span>
                <span className="text-on-surface font-semibold">
                  {formatIndonesianDate(txDate)} {transaction.time ? `• ${transaction.time} WIB` : ""}
                </span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-secondary font-medium">Metode Pembayaran</span>
                <span className="text-on-surface font-semibold">
                  {transaction.payment_method || transaction.paymentMethod || "Kas Tunai"}
                </span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-secondary font-medium">Kanal Penjualan / Pengeluaran</span>
                <span className="text-on-surface font-semibold">
                  {transaction.channel || "Offline / Kasir Gerai"}
                </span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span className="text-secondary font-medium">Gerai Outlet</span>
                <span className="text-on-surface font-semibold">
                  {transaction.outlet_name || "Gerai Utama Sukapura"}
                </span>
              </div>
            </div>

            {/* Bukti Struk / Nota Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-on-surface">
                  <span className="material-symbols-outlined text-base text-primary">receipt_long</span>
                  <span>Bukti Struk / Nota Pembayaran</span>
                </div>
                {receiptImg && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Terlampir</span>
                  </span>
                )}
              </div>

              {receiptImg ? (
                <div
                  onClick={() => setIsZoomOpen(true)}
                  className="group relative border border-surface-variant/80 hover:border-primary/50 rounded-2xl overflow-hidden bg-slate-950/5 flex flex-col items-center justify-center p-2.5 transition-all cursor-pointer shadow-xs hover:shadow-md"
                  title="Klik untuk memperbesar struk"
                >
                  <img
                    src={receiptImg}
                    alt="Bukti Struk / Nota"
                    className="max-h-56 sm:max-h-64 w-auto object-contain rounded-xl select-none transition-transform group-hover:scale-[1.02] duration-200"
                  />
                  {/* Floating Expand Pill */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/85 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg flex items-center gap-1.5 group-hover:bg-primary transition-colors pointer-events-none">
                    <span className="material-symbols-outlined text-sm">zoom_in</span>
                    <span>Ketuk untuk Memperbesar</span>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-surface-variant rounded-2xl p-4 text-center bg-surface-container-low/40">
                  <span className="material-symbols-outlined text-2xl text-secondary/60 mb-1">
                    receipt
                  </span>
                  <p className="text-xs text-secondary font-medium">
                    Tidak ada lampiran bukti struk untuk transaksi ini.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-surface-variant/30 gap-2">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(transaction.id, transaction.title || transaction.description)}
                  className="flex items-center gap-1.5 text-primary hover:text-white hover:bg-primary text-xs font-bold px-3 py-2 rounded-xl transition-all border border-primary/20 hover:border-primary cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  <span>Hapus Transaksi</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-inverse-surface text-inverse-on-surface hover:bg-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all ml-auto cursor-pointer active:scale-95 shadow-xs"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Fullscreen Modal */}
      {isZoomOpen && receiptImg && (
        <div
          className="fixed inset-0 z-[10005] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          {/* Top Bar for Lightbox */}
          <div
            className="w-full max-w-2xl flex items-center justify-between p-3 text-white mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
              <span className="text-xs sm:text-sm font-bold">Bukti Struk Pembayaran HD</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={receiptImg}
                download={`struk-pasta-nafisa-${transaction.id || "tx"}.jpg`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Unduh</span>
              </a>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Image Container */}
          <div
            className="relative max-w-3xl max-h-[85vh] overflow-auto flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={receiptImg}
              alt="Bukti Struk Full"
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl ring-1 ring-white/15"
            />
          </div>
        </div>
      )}
    </>,
    document.body
  );
}