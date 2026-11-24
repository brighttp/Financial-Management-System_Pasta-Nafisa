import React, { useEffect, useState } from 'react';
import { getEmployeeHistory } from '../services/transactionService';
import { getBusinessDay } from '../utils/businessDay';
import { formatIDR } from '../utils/currencyFormatter';

export default function EmployeeHistory({ businessId, userId, revision }) {
  const [day, setDay] = useState(() => getBusinessDay());
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const requestKey = `${businessId}:${userId}:${day.day}:${page}:${revision}:${refresh}`;

  useEffect(() => {
    let timer;
    const checkDay = () => {
      const next = getBusinessDay();
      setDay(previous => {
        if (previous.day === next.day) return previous;
        return next;
      });
      clearTimeout(timer);
      timer = setTimeout(checkDay, new Date(next.end).getTime() - Date.now() + 50);
    };
    const onFocus = () => { checkDay(); setRefresh(n => n + 1); };
    checkDay();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  useEffect(() => { setPage(0); }, [day.day, revision, businessId, userId]);

  useEffect(() => {
    let cancelled = false;
    setError('');
    getEmployeeHistory({ businessId, userId, start: day.start, end: day.end, page })
      .then(data => { if (!cancelled) setResult({ ...data, key: requestKey }); })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [businessId, userId, day, page, requestKey]);

  const current = result?.key === requestKey && day.day === getBusinessDay().day ? result : null;
  return (
    <section className="mt-6 rounded-2xl border border-surface-variant/60 bg-white overflow-hidden" aria-labelledby="employee-history-title">
      <div className="p-4 flex items-center justify-between gap-3 border-b border-surface-variant/50">
        <div>
          <h2 id="employee-history-title" className="text-sm font-bold">Riwayat hari ini</h2>
          <p className="text-xs text-secondary mt-1">Hanya yang kamu input hari ini · WIB</p>
        </div>
        <button type="button" aria-label="Muat ulang riwayat" onClick={() => setRefresh(n => n + 1)} className="w-11 h-11 shrink-0 rounded-xl text-secondary hover:bg-surface-container-low flex items-center justify-center"><span aria-hidden="true" className="material-symbols-outlined text-xl">refresh</span></button>
      </div>
      {error ? <div role="alert" className="p-5 text-center text-xs text-primary">{error}<button type="button" className="block mx-auto mt-2 min-h-[44px] font-semibold underline" onClick={() => setRefresh(n => n + 1)}>Coba lagi</button></div>
        : !current ? <p role="status" className="p-6 text-center text-xs text-secondary">Memuat riwayat...</p>
        : current.rows.length === 0 ? <p className="p-6 text-center text-xs text-secondary">Belum ada transaksi yang kamu input hari ini.</p>
        : <>
          <ul className="divide-y divide-surface-variant/50">
            {current.rows.map(tx => <li key={tx.id} className="p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold break-words">{tx.transaction_categories?.name || (tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}</p>
                  <p className="text-xs text-secondary mt-1 break-words">{tx.outlets?.name || 'Gerai'} · {new Date(tx.created_at).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p className={`text-sm font-bold text-right max-w-[55%] break-words ${tx.type === 'income' ? 'text-tertiary' : 'text-primary'}`}>{tx.type === 'income' ? '+' : '−'}{formatIDR(tx.amount)}</p>
              </div>
              <p className="text-[11px] text-secondary mt-2">{tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} · {tx.payment_method || 'Kas Tunai'}</p>
            </li>)}
          </ul>
          {(page > 0 || current.count > 20) && <div className="border-t border-surface-variant/50 px-4 py-2 flex items-center justify-between text-xs">
            <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="min-h-[44px] disabled:opacity-40">Sebelumnya</button>
            <span>{page + 1} / {Math.max(1, Math.ceil(current.count / 20))}</span>
            <button type="button" disabled={(page + 1) * 20 >= current.count} onClick={() => setPage(p => p + 1)} className="min-h-[44px] disabled:opacity-40">Berikutnya</button>
          </div>}
        </>}
    </section>
  );
}
