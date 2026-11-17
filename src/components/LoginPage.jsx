import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Silakan masukkan email dan kata sandi Anda.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (err) {
      setErrorMessage(
        err.message || 'Gagal masuk akun. Silakan periksa kembali email dan kata sandi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 selection:bg-primary selection:text-on-primary">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md">
        {/* Brand Card Header with Official Pasta Nafisa Logo */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#181d29] to-slate-900 text-white rounded-t-3xl p-6 sm:p-7 shadow-xl border border-b-0 border-white/10 text-center">
          {/* Subtle warm ambient glows */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-8 right-0 w-36 h-36 bg-primary/20 rounded-full blur-2xl pointer-events-none"></div>

          {/* Logo Showcase without white box container */}
          <div className="relative mx-auto w-fit mb-2.5 flex items-center justify-center">
            {/* Soft warm glow behind the transparent logo */}
            <div className="absolute inset-0 bg-amber-400/15 rounded-full blur-2xl pointer-events-none scale-125"></div>

            {!logoError ? (
              <div className="relative transition-transform hover:scale-105 duration-300">
                <img
                  src="/logo-pasta-nafisa.png"
                  alt="Pasta Nafisa Logo"
                  className="w-44 sm:w-52 h-auto object-contain select-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                  loading="eager"
                  decoding="async"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-primary via-rose-600 to-rose-500 text-white font-black text-3xl flex items-center justify-center shadow-xl shadow-primary/30 ring-2 ring-white/30">
                PN
              </div>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            Pasta Nafisa
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-300 font-medium mt-1">
            Financial Management System • Culinary UMKM
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 mt-3 border border-emerald-500/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Gerai Sukapura &amp; GKU Telkom University</span>
          </div>
        </div>

        {/* Form Body Card */}
        <div className="bg-surface-container-lowest border border-surface-variant/40 rounded-b-3xl p-6 sm:p-7 shadow-xl space-y-5">
          <div>
            <h2 className="text-base sm:text-headline-sm font-bold text-on-surface">
              Masuk Akun Pengelola
            </h2>
            <p className="text-xs sm:text-body-sm text-secondary mt-0.5">
              Masukkan kredensial akun Owner / Staf Keuangan resmi Pasta Nafisa.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-error-container/60 border border-primary/30 flex items-start gap-2.5 text-primary text-xs sm:text-body-sm animate-in fade-in duration-200">
              <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">
                error
              </span>
              <p className="font-medium leading-snug">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs sm:text-label-md font-semibold text-secondary mb-1.5"
              >
                Alamat Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@pastanafisa.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-surface-variant/70 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm text-on-surface bg-surface-container-lowest transition-all placeholder:text-secondary/50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-label-md font-semibold text-secondary"
                >
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-surface-variant/70 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm text-on-surface bg-surface-container-lowest transition-all placeholder:text-secondary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface p-0.5 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 sm:py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-on-primary bg-primary hover:bg-primary-container shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                loading ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Memverifikasi Sesi...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  <span>Masuk ke Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

