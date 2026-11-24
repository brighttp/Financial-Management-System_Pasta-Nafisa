import React from 'react';
import { useAuth } from '../hooks/useAuth';

export default function AccessDenied({ message, onRetry }) {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-container-lowest border border-surface-variant/40 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-error-container text-primary flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">no_accounts</span>
        </div>

        <div>
          <h2 className="text-lg sm:text-headline-md font-bold text-on-surface">
            Akses Bisnis Ditolak
          </h2>
          <p className="text-xs sm:text-body-sm text-secondary mt-1">
            Akses untuk akun {user?.email} belum tersedia. Hubungi owner untuk memeriksa keanggotaan dan role akun Anda.
          </p>
        </div>

        {message && (
          <div className="p-3 rounded-xl bg-error-container/40 border border-primary/20 text-primary text-xs text-left">
            {message}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          )}
          <button
            onClick={logout}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-primary hover:bg-primary-container text-on-primary shadow-sm transition-all cursor-pointer"
          >
            Keluar Sesi
          </button>
        </div>
      </div>
    </div>
  );
}

