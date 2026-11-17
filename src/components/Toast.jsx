import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast || typeof document === "undefined") return null;

  const isDelete = toast.type === "delete";
  const isError = toast.type === "error";
  const isRed = isDelete || isError;

  return createPortal(
    <div className="fixed top-4 sm:top-5 left-1/2 -translate-x-1/2 z-[10000] pointer-events-auto max-w-[92vw] sm:max-w-md animate-in slide-in-from-top-4 fade-in duration-200">
      <div
        className={`bg-slate-900/95 text-white rounded-full shadow-2xl backdrop-blur-md px-3.5 py-2 flex items-center gap-2.5 ring-1 ${
          isRed
            ? "border border-rose-500/40 ring-rose-500/25 shadow-rose-950/50"
            : "border border-emerald-500/35 ring-emerald-500/25 shadow-emerald-950/50"
        }`}
      >
        {/* Glowing Icon Badge */}
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            isRed
              ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/50"
              : "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50"
          }`}
        >
          <span
            className="material-symbols-outlined text-[15px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isDelete ? "delete" : isError ? "error" : "check_circle"}
          </span>
        </div>

        {/* Message Content */}
        <div className="min-w-0 pr-1">
          {toast.title && (
            <p
              className={`text-[10px] font-bold uppercase tracking-wider leading-none mb-0.5 ${
                isRed ? "text-rose-400/90" : "text-emerald-400/90"
              }`}
            >
              {toast.title}
            </p>
          )}
          <p className="text-xs sm:text-[13px] font-semibold text-slate-100 leading-tight truncate">
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-0.5"
          aria-label="Tutup notifikasi"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
    </div>,
    document.body
  );
}
