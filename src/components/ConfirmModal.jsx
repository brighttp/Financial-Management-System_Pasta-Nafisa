import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ConfirmModal({
  isOpen,
  title = "Konfirmasi Tindakan",
  message = "Apakah Anda yakin ingin melanjutkan?",
  confirmText = "Hapus",
  cancelText = "Batal",
  type = "danger", // 'danger' | 'warning' | 'info'
  onConfirm,
  onCancel,
}) {
  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onCancel) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || typeof document === "undefined") return null;

  const isDanger = type === "danger";
  const isWarning = type === "warning";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) onCancel();
      }}
    >
      <div
        className="relative w-full max-w-sm bg-surface-container-lowest border border-surface-variant/80 rounded-2xl sm:rounded-3xl shadow-2xl p-5 text-center flex flex-col items-center animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent in background */}
        <div
          className={`absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-25 ${
            isDanger ? "bg-primary" : isWarning ? "bg-amber-500" : "bg-blue-500"
          }`}
        ></div>

        {/* Top Icon Badge */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mb-3.5 shadow-sm ring-1 ${
            isDanger
              ? "bg-error-container/70 text-primary ring-primary/20"
              : isWarning
              ? "bg-amber-500/15 text-amber-500 ring-amber-500/30"
              : "bg-primary/10 text-primary ring-primary/20"
          }`}
        >
          <span className="material-symbols-outlined text-2xl">
            {isDanger ? "delete_forever" : isWarning ? "logout" : "help"}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-on-surface tracking-tight leading-tight">
          {title}
        </h3>

        {/* Message */}
        <p className="text-xs sm:text-sm text-secondary leading-relaxed mt-1.5 mb-5 px-1">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-3 rounded-xl border border-surface-variant/80 hover:bg-surface-container text-xs sm:text-sm font-semibold text-secondary hover:text-on-surface transition-all cursor-pointer active:scale-95"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              if (onCancel) onCancel();
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-white text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all cursor-pointer ring-1 ring-white/20 flex items-center justify-center gap-1.5 ${
              isDanger
                ? "bg-gradient-to-r from-primary via-rose-600 to-rose-500 hover:brightness-110 shadow-primary/25"
                : isWarning
                ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 shadow-amber-500/25"
                : "bg-primary hover:bg-primary-container"
            }`}
          >
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
