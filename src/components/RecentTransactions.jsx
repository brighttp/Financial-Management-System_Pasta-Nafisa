import React from "react";
import { formatIDR } from "../utils/currencyFormatter";
import { formatIndonesianDate } from "../utils/dateHelpers";

export default function RecentTransactions({
  transactions = [],
  onViewAll,
  onSelectTransaction,
  loading = false,
  error = null,
}) {
  const displayItems = transactions.slice(0, 5);

  return (
    <section className="bg-surface-container-lowest border border-surface-variant/40 rounded-2xl p-3.5 sm:p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 border-b border-surface-variant/20">
        <div>
          <h3 className="text-sm sm:text-headline-sm font-headline-sm font-bold text-on-surface">
            Transaksi Terbaru
          </h3>
          <p className="text-[11px] sm:text-body-sm font-body-sm text-secondary">
            Arus kas masuk dan keluar real-time
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs sm:text-label-md font-label-md text-primary hover:text-primary-container font-semibold flex items-center gap-1 transition-colors group cursor-pointer"
        >
          <span>Lihat Semua</span>
          <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-2 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high"></div>
                <div className="space-y-1.5">
                  <div className="w-36 h-4 bg-surface-container-high rounded"></div>
                  <div className="w-24 h-3 bg-surface-container rounded"></div>
                </div>
              </div>
              <div className="w-20 h-4 bg-surface-container-high rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="py-6 text-center text-primary text-xs sm:text-body-sm">
          <span className="material-symbols-outlined text-2xl mb-1">error_outline</span>
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayItems.length === 0 && (
        <div className="py-8 text-center text-secondary">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center mx-auto mb-2 text-secondary">
            <span className="material-symbols-outlined text-2xl">receipt_long</span>
          </div>
          <p className="text-body-sm font-semibold text-on-surface">Belum ada transaksi</p>
          <p className="text-xs text-secondary mt-0.5">
            Gunakan tombol "+ Catat Transaksi" untuk memasukkan transaksi pertama Anda.
          </p>
        </div>
      )}

      {/* Ledger Items */}
      {!loading && !error && displayItems.length > 0 && (
        <div className="divide-y divide-surface-variant/20">
          {displayItems.map((item) => {
            const isIncome = item.type === "income";
            const txDate = item.transaction_date || item.date;

            return (
              <div
                key={item.id}
                onClick={() => onSelectTransaction && onSelectTransaction(item)}
                className="py-3 flex items-center justify-between hover:bg-surface-container-low px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? "bg-tertiary-fixed/30 text-tertiary"
                        : "bg-error-container/50 text-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined">
                      {item.icon || (isIncome ? "point_of_sale" : "shopping_basket")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-body-md font-body-md font-semibold text-on-surface leading-snug truncate">
                        {item.title || item.description || "Transaksi"}
                      </p>
                      {item.receiptImage && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[10px] bg-tertiary/15 text-tertiary font-bold px-1.5 py-0.5 rounded border border-tertiary/30 shrink-0 shadow-2xs"
                          title="Bukti Struk Terlampir"
                        >
                          <span className="material-symbols-outlined text-[11px]">receipt</span>
                          <span>Nota</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-label-sm font-label-sm text-secondary truncate mt-0.5">
                      <span className="shrink-0">{formatIndonesianDate(txDate)}</span>
                      <span className="w-1 h-1 rounded-full bg-secondary shrink-0"></span>
                      <span
                        className={`font-semibold shrink-0 ${
                          isIncome ? "text-tertiary" : "text-primary"
                        }`}
                      >
                        {item.category_name || item.category || (isIncome ? "Pemasukan" : "Pengeluaran")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span
                    className={`text-body-md font-body-md font-bold block ${
                      isIncome ? "text-tertiary" : "text-primary"
                    }`}
                  >
                    {isIncome ? `+${formatIDR(item.amount)}` : `-${formatIDR(item.amount)}`}
                  </span>
                  <p className="text-label-sm font-label-sm text-secondary truncate max-w-[120px]">
                    {item.payment_method || item.paymentMethod || "Kas Tunai"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
