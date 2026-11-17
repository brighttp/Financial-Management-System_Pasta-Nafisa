/**
 * Financial Reporting Service
 * Pasta Nafisa Financial System
 */

import { calculateFinancials } from '../utils/financialCalculations';
import { formatIDR } from '../utils/currencyFormatter';
import { formatIndonesianDate } from '../utils/dateHelpers';

/**
 * Escape HTML special characters for safe printable template interpolation
 * @param {string|number} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate structured Profit & Loss and Cash Flow report data
 * @param {Array<Object>} transactions
 * @param {Object} metadata
 * @returns {Object}
 */
export function generateFinancialReport(transactions = [], metadata = {}) {
  const summary = calculateFinancials(transactions);

  // Group Income by Category
  const incomeCategories = {};
  const expenseCategories = {};

  transactions.forEach((tx) => {
    const catName = tx.category_name || tx.category || 'Lain-lain';
    const amt = Number(tx.amount) || 0;

    if (tx.type === 'income') {
      incomeCategories[catName] = (incomeCategories[catName] || 0) + amt;
    } else {
      expenseCategories[catName] = (expenseCategories[catName] || 0) + amt;
    }
  });

  const incomeBreakdown = Object.entries(incomeCategories).map(([name, amount]) => ({
    name,
    amount,
    percentage: summary.totalIncome > 0 ? Math.round((amount / summary.totalIncome) * 100) : 0,
  }));

  const expenseBreakdown = Object.entries(expenseCategories).map(([name, amount]) => ({
    name,
    amount,
    percentage: summary.totalExpense > 0 ? Math.round((amount / summary.totalExpense) * 100) : 0,
  }));

  return {
    ...summary,
    incomeBreakdown,
    expenseBreakdown,
    periodLabel: metadata.periodLabel || 'Periode Berjalan',
    outletLabel: metadata.outletLabel || 'Semua Gerai',
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Export report to CSV / Excel file
 * @param {Array<Object>} transactions
 * @param {string} fileNamePrefix
 */
export function exportTransactionsToCSV(transactions = [], fileNamePrefix = 'Laporan_Keuangan_Pasta_Nafisa') {
  const headers = [
    'ID Transaksi',
    'Tanggal',
    'Tipe',
    'Kategori',
    'Nominal (IDR)',
    'Metode Pembayaran',
    'Kanal',
    'Outlet',
    'Catatan / Keterangan',
  ];

  const rows = transactions.map((tx) => [
    `"${tx.id || ''}"`,
    `"${tx.transaction_date || tx.date || ''}"`,
    `"${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
    `"${tx.category_name || tx.category || ''}"`,
    tx.amount || 0,
    `"${tx.payment_method || tx.paymentMethod || 'Kas Tunai'}"`,
    `"${tx.channel || 'Offline / Kasir Gerai'}"`,
    `"${tx.outlet_name || 'Gerai Utama Sukapura'}"`,
    `"${(tx.description || tx.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `${fileNamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate complete standalone HTML for printable PDF document
 * @param {Object} params
 * @returns {string} HTML string
 */
export function generatePrintableReportHTML({
  transactions = [],
  financials = {},
  businessName = 'Pasta Nafisa',
  outletName = 'Semua Gerai (Konsolidasi)',
  periodLabel = 'Bulan Ini',
  _userEmail = 'Owner',
} = {}) {
  // Sort transactions chronologically
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = a.transaction_date || a.date || '';
    const dateB = b.transaction_date || b.date || '';
    return dateA.localeCompare(dateB);
  });

  let totalIncomeCalc = 0;
  let totalExpenseCalc = 0;

  sortedTransactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncomeCalc += amt;
    } else {
      totalExpenseCalc += amt;
    }
  });

  const totalIncome = financials.totalIncome !== undefined ? financials.totalIncome : totalIncomeCalc;
  const totalExpense = financials.totalExpense !== undefined ? financials.totalExpense : totalExpenseCalc;
  const netProfit = financials.netProfit !== undefined ? financials.netProfit : (totalIncome - totalExpense);

  const now = new Date();
  const printDateStr = formatIndonesianDate(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    true
  ) + `, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

  // Transaction table rows - clear, clean, and legible without technical UUID clutter
  const transactionRows = sortedTransactions.length > 0
    ? sortedTransactions.map((tx, idx) => {
        const isIncome = tx.type === 'income';
        const dateStr = formatIndonesianDate(tx.transaction_date || tx.date, false);
        const desc = tx.description || tx.notes || tx.title || (isIncome ? 'Pemasukan' : 'Pengeluaran');
        const cat = tx.category_name || tx.category || 'Lain-lain';
        const method = tx.payment_method || tx.paymentMethod || 'Kas Tunai';
        const amountDisplay = isIncome ? `+${formatIDR(tx.amount)}` : `-${formatIDR(tx.amount)}`;
        const amountClass = isIncome ? 'val-income' : 'val-expense';
        const badgeClass = isIncome ? 'badge-income' : 'badge-expense';
        const badgeLabel = isIncome ? 'Masuk' : 'Keluar';

        return `
          <tr>
            <td style="text-align: center; color: #64748b; font-weight: 600;">${idx + 1}</td>
            <td style="white-space: nowrap; font-weight: 500;">${escapeHtml(dateStr)}</td>
            <td>
              <div style="font-weight: 700; color: #0f172a; font-size: 12.5px;">${escapeHtml(desc)}</div>
            </td>
            <td><span class="cat-pill">${escapeHtml(cat)}</span></td>
            <td style="color: #334155;">${escapeHtml(method)}</td>
            <td style="text-align: center;">
              <span class="tx-badge ${badgeClass}">${badgeLabel}</span>
            </td>
            <td style="text-align: right;" class="${amountClass}">${amountDisplay}</td>
          </tr>
        `;
      }).join('')
    : `
      <tr>
        <td colspan="7" style="text-align: center; padding: 28px; color: #64748b; font-style: italic; font-size: 13px;">
          Tidak ada data transaksi yang tercatat pada periode ini.
        </td>
      </tr>
    `;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Keuangan - ${escapeHtml(businessName)}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.45;
      padding: 20px 24px;
    }
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }
    @media print {
      body {
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      tr {
        page-break-inside: avoid;
      }
    }

    /* HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #ba1a1a;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-box {
      width: 44px;
      height: 44px;
      background-color: #ba1a1a;
      color: #ffffff;
      font-weight: 800;
      font-size: 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-info h1 {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.1;
    }
    .brand-info p {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    .doc-title {
      text-align: right;
    }
    .doc-title h2 {
      font-size: 17px;
      font-weight: 800;
      color: #ba1a1a;
      text-transform: uppercase;
    }
    .doc-title p {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 2px;
    }

    /* INFO BAR */
    .info-bar {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .info-item span.label {
      color: #64748b;
      font-size: 11px;
      display: block;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .info-item span.value {
      color: #0f172a;
      font-size: 13px;
      font-weight: 700;
    }

    /* SUMMARY CARDS - 3 BESAR & JELAS */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 18px;
    }
    .card {
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      background: #ffffff;
    }
    .card-income {
      border-top: 4px solid #16a34a;
      background: #f0fdf4;
    }
    .card-expense {
      border-top: 4px solid #ba1a1a;
      background: #fef2f2;
    }
    .card-profit {
      border-top: 4px solid ${netProfit >= 0 ? '#16a34a' : '#ba1a1a'};
      background: ${netProfit >= 0 ? '#f0fdf4' : '#fff1f2'};
    }
    .card-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .card-income .card-label { color: #166534; }
    .card-expense .card-label { color: #991b1b; }
    .card-profit .card-label { color: #0f172a; }
    .card-amount {
      font-size: 18px;
      font-weight: 800;
      line-height: 1.2;
    }
    .val-income { color: #15803d; }
    .val-expense { color: #b91c1c; }
    .val-profit { color: ${netProfit >= 0 ? '#15803d' : '#b91c1c'}; }
    .card-status-note {
      font-size: 11px;
      font-weight: 600;
      margin-top: 3px;
    }

    /* SECTION TITLE */
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge-count {
      background: #e2e8f0;
      color: #334155;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 6px;
    }

    /* TRANSACTION TABLE */
    .tx-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .tx-table th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      padding: 9px 10px;
      text-align: left;
      border-top: 1.5px solid #cbd5e1;
      border-bottom: 1.5px solid #cbd5e1;
    }
    .tx-table td {
      padding: 9px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
      vertical-align: middle;
    }
    .tx-table tr:nth-child(even) td {
      background-color: #fafbfc;
    }
    .cat-pill {
      display: inline-block;
      padding: 2px 7px;
      background: #e2e8f0;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 600;
      color: #334155;
    }
    .tx-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-income {
      background-color: #dcfce7;
      color: #15803d;
    }
    .badge-expense {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .tx-total-row td {
      background-color: #f8fafc !important;
      font-weight: 700;
      border-top: 1.5px solid #94a3b8;
      border-bottom: 1.5px solid #94a3b8;
      font-size: 12.5px;
      padding: 9px 10px;
    }

    /* FOOTER */
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="brand-logo">
      <div class="logo-box">PN</div>
      <div class="brand-info">
        <h1>${escapeHtml(businessName)}</h1>
        <p>Laporan Ringkasan Kas & Pembukuan Keuangan</p>
      </div>
    </div>
    <div class="doc-title">
      <h2>Laporan Keuangan</h2>
      <p>Catatan Pemasukan & Pengeluaran Kas</p>
    </div>
  </div>

  <!-- INFO BAR -->
  <div class="info-bar">
    <div class="info-item">
      <span class="label">Periode</span>
      <span class="value">${escapeHtml(periodLabel)}</span>
    </div>
    <div class="info-item">
      <span class="label">Gerai / Outlet</span>
      <span class="value">${escapeHtml(outletName)}</span>
    </div>
    <div class="info-item">
      <span class="label">Waktu Cetak</span>
      <span class="value">${escapeHtml(printDateStr)}</span>
    </div>
  </div>

  <!-- SUMMARY CARDS (3 BESAR & JELAS) -->
  <div class="summary-grid">
    <div class="card card-income">
      <div class="card-label">Total Uang Masuk</div>
      <div class="card-amount val-income">+${formatIDR(totalIncome)}</div>
    </div>
    <div class="card card-expense">
      <div class="card-label">Total Uang Keluar</div>
      <div class="card-amount val-expense">-${formatIDR(totalExpense)}</div>
    </div>
    <div class="card card-profit">
      <div class="card-label">Sisa Saldo / Keuntungan</div>
      <div class="card-amount val-profit">${formatIDR(netProfit)}</div>
      <div class="card-status-note val-profit">
        ${netProfit >= 0 ? 'Surplus (Untung)' : 'Defisit (Minus)'}
      </div>
    </div>
  </div>

  <!-- SECTION TITLE -->
  <div class="section-title">
    <span>Daftar Rincian Transaksi</span>
    <span class="badge-count">${sortedTransactions.length} Transaksi</span>
  </div>

  <!-- TABLE -->
  <table class="tx-table">
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">No</th>
        <th style="width: 95px;">Tanggal</th>
        <th>Keterangan Transaksi</th>
        <th style="width: 110px;">Kategori</th>
        <th style="width: 120px;">Pembayaran</th>
        <th style="width: 75px; text-align: center;">Tipe</th>
        <th style="width: 125px; text-align: right;">Jumlah (Rp)</th>
      </tr>
    </thead>
    <tbody>
      ${transactionRows}
    </tbody>
    <tfoot>
      <tr class="tx-total-row">
        <td colspan="6" style="text-align: right; font-weight: 700;">TOTAL KAS MASUK:</td>
        <td style="text-align: right;" class="val-income">+${formatIDR(totalIncome)}</td>
      </tr>
      <tr class="tx-total-row">
        <td colspan="6" style="text-align: right; font-weight: 700;">TOTAL KAS KELUAR:</td>
        <td style="text-align: right;" class="val-expense">-${formatIDR(totalExpense)}</td>
      </tr>
      <tr class="tx-total-row" style="background-color: #f1f5f9 !important; font-size: 13.5px;">
        <td colspan="6" style="text-align: right; font-weight: 800;">SISA SALDO BERSIH:</td>
        <td style="text-align: right;" class="val-profit">${formatIDR(netProfit)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- FOOTER -->
  <div class="footer">
    <span>Sistem Keuangan ${escapeHtml(businessName)}</span>
    <span>Dicetak pada ${escapeHtml(printDateStr)}</span>
  </div>
</body>
</html>`;
}

/**
 * Trigger clean printing of financial report and transactions to PDF
 * Renders an isolated document inside a hidden iframe to prevent printing mobile app UI
 * @param {Object} options
 * @returns {boolean}
 */
export function exportTransactionsToPDF(options = {}) {
  const html = generatePrintableReportHTML(options);

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return html;
  }

  // Remove any stale print frame
  const existingFrame = document.getElementById('nafisa-pdf-print-frame');
  if (existingFrame) {
    try {
      document.body.removeChild(existingFrame);
    } catch {}
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'nafisa-pdf-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  try {
    const frameDoc = iframe.contentWindow || iframe.contentDocument;
    const targetDoc = frameDoc.document || frameDoc;

    targetDoc.open();
    targetDoc.write(html);
    targetDoc.close();

    // Trigger printing once rendered
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (printErr) {
        console.warn('Iframe print error, falling back to popup window:', printErr);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 300);
        }
      }
    }, 350);
  } catch (err) {
    console.error('Failed to initialize printable iframe, falling back to popup:', err);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 300);
    }
  }

  return true;
}
