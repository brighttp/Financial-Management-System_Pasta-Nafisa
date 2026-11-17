/**
 * Financial Calculation Engine
 * Pasta Nafisa Financial Dashboard
 * Simplified cash-based financial model based on recorded transactions
 */

import { getWeekLabelOfMonth } from './dateHelpers.js';

/**
 * @typedef {Object} FinancialSummary
 * @property {number} totalIncome
 * @property {number} totalExpense
 * @property {number} netProfit
 * @property {number} netCashFlow
 * @property {number} netMargin
 * @property {number} expenseRatio
 * @property {number} netSurplus
 * @property {number} weeklyAverage
 * @property {Object.<string, number>} expensesByCategory
 * @property {Array<{ name: string, amount: number, percentage: number }>} expenseBreakdownList
 * @property {Object.<string, { income: number, expense: number }>} weeklyData
 * @property {Object} financialStatus
 * @property {number} transactionCount
 * @property {number} incomeCount
 * @property {number} expenseCount
 */

/**
 * Calculates all financial metrics dynamically from an array of transactions
 * @param {Array<Object>} transactions
 * @returns {FinancialSummary}
 */
export function calculateFinancials(transactions = []) {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalCashIn = 0;
  let totalCashOut = 0;

  let incomeCount = 0;
  let expenseCount = 0;

  const expensesByCategory = {};

  const weeklyData = {
    M1: { income: 0, expense: 0 },
    M2: { income: 0, expense: 0 },
    M3: { income: 0, expense: 0 },
    M4: { income: 0, expense: 0 },
  };

  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0;
    const type = (tx.type || '').toLowerCase();
    const txDate = tx.transaction_date || tx.date || '';
    const weekLabel = getWeekLabelOfMonth(txDate);

    // Resolve category name
    const categoryName = tx.category_name || tx.category || tx.transaction_categories?.name || 'Lain-lain';

    if (type === 'income') {
      totalIncome += amount;
      totalCashIn += amount; // Cash-based model treats all recorded income as cash in
      incomeCount += 1;

      if (weeklyData[weekLabel]) {
        weeklyData[weekLabel].income += amount;
      }
    } else if (type === 'expense') {
      totalExpense += amount;
      totalCashOut += amount; // Cash-based model treats all recorded expense as cash out
      expenseCount += 1;

      if (!expensesByCategory[categoryName]) {
        expensesByCategory[categoryName] = 0;
      }
      expensesByCategory[categoryName] += amount;

      if (weeklyData[weekLabel]) {
        weeklyData[weekLabel].expense += amount;
      }
    }
  });

  // Net Profit: Total Income - Total Expense
  const netProfit = totalIncome - totalExpense;

  // Net Cash Flow: Total Cash In - Total Cash Out (tracked separately)
  const netCashFlow = totalCashIn - totalCashOut;

  // Net Margin: (Net Profit / Total Income) * 100
  // Safe handling: return 0 when totalIncome is 0
  const netMargin = totalIncome > 0
    ? Number(((netProfit / totalIncome) * 100).toFixed(1))
    : 0;

  // Expense Ratio: (Total Expense / Total Income) * 100
  const expenseRatio = totalIncome > 0
    ? Number(((totalExpense / totalIncome) * 100).toFixed(1))
    : 0;

  // Net Surplus percentage vs expense: ((Income - Expense) / Expense) * 100
  const netSurplus = totalExpense > 0
    ? Math.round(((totalIncome - totalExpense) / totalExpense) * 100)
    : 0;

  // Weekly average income
  const weeklyAverage = Math.round(totalIncome / 4);

  // Expense breakdown list sorted descending by amount
  const expenseBreakdownList = Object.entries(expensesByCategory)
    .map(([name, amount]) => {
      const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return { name, amount, percentage };
    })
    .sort((a, b) => b.amount - a.amount);

  // Determine Financial Status with documented thresholds
  // 1. Healthy / Likuid: Net Profit > 0 and Net Margin >= 25% (healthy F&B standard)
  // 2. Needs Attention: Net Profit > 0 but Margin < 25%
  // 3. Negative Cash Flow: Net Profit < 0
  // 4. Insufficient Data: No transactions or 0 income and expense
  let financialStatus;
  if (totalIncome === 0 && totalExpense === 0) {
    financialStatus = {
      label: 'Belum Ada Transaksi',
      code: 'NO_DATA',
      color: 'secondary',
      bgClass: 'bg-surface-container text-secondary',
      dotClass: 'bg-secondary',
      description: 'Belum ada catatan transaksi pada periode yang dipilih.',
    };
  } else if (netProfit > 0 && netMargin >= 25) {
    financialStatus = {
      label: 'Sehat / Likuid',
      code: 'HEALTHY',
      color: 'tertiary',
      bgClass: 'bg-tertiary/10 text-tertiary',
      dotClass: 'bg-tertiary',
      description: `Margin bersih ${netMargin}% melampaui ambang batas sehat kuliner (25%).`,
    };
  } else if (netProfit > 0 && netMargin < 25) {
    financialStatus = {
      label: 'Perlu Perhatian',
      code: 'ATTENTION',
      color: 'amber',
      bgClass: 'bg-amber-100 text-amber-800',
      dotClass: 'bg-amber-600',
      description: `Margin bersih ${netMargin}% di bawah ambang batas standar (25%). Evaluasi beban bahan baku/operasional.`,
    };
  } else {
    financialStatus = {
      label: 'Arus Kas Negatif',
      code: 'DEFICIT',
      color: 'primary',
      bgClass: 'bg-error-container text-primary',
      dotClass: 'bg-primary',
      description: 'Pengeluaran melebihi pemasukan pada periode ini.',
    };
  }

  return {
    totalIncome,
    totalExpense,
    netProfit,
    netCashFlow,
    netMargin,
    expenseRatio,
    netSurplus,
    weeklyAverage,
    expensesByCategory,
    expenseBreakdownList,
    weeklyData,
    financialStatus,
    transactionCount: transactions.length,
    incomeCount,
    expenseCount,
  };
}

/**
 * Calculates percentage difference between current and previous period values
 * Safely returns null if previous period has 0 or invalid data
 * @param {number} current
 * @param {number} previous
 * @returns {{ percent: number, direction: 'up'|'down'|'neutral', formatted: string } | null}
 */
export function calculatePeriodComparison(current, previous) {
  if (previous === undefined || previous === null || isNaN(previous) || previous <= 0) {
    return null;
  }
  const curr = Number(current) || 0;
  const prev = Number(previous);

  const diff = curr - prev;
  const percent = Math.round((diff / prev) * 100);

  if (diff > 0) {
    return {
      percent,
      direction: 'up',
      formatted: `+${percent}%`,
    };
  }
  if (diff < 0) {
    return {
      percent: Math.abs(percent),
      direction: 'down',
      formatted: `${percent}%`,
    };
  }
  return {
    percent: 0,
    direction: 'neutral',
    formatted: '0%',
  };
}
