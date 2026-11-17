/**
 * Indonesian Rupiah (IDR) Currency Formatting Utilities
 * Pasta Nafisa Financial System
 */

/**
 * Format raw number to IDR string (e.g. "Rp 1.450.000" or "-Rp 450.000")
 * @param {number|string} amount
 * @returns {string}
 */
export function formatIDR(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const numeric = Number(amount);
  const isNegative = numeric < 0;
  const absVal = Math.abs(numeric);

  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absVal);

  return isNegative ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Compact format for badges & tight spaces (e.g. "Rp 24,50 Jt", "Rp 500 Rb")
 * @param {number|string} amount
 * @returns {string}
 */
export function formatCompactIDR(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'Rp 0';
  }
  const num = Number(amount);
  const abs = Math.abs(num);
  const prefix = num < 0 ? '-Rp ' : 'Rp ';

  if (abs >= 1_000_000_000) {
    const val = (abs / 1_000_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2,
    });
    return `${prefix}${val} M`;
  }
  if (abs >= 1_000_000) {
    const val = (abs / 1_000_000).toLocaleString('id-ID', {
      maximumFractionDigits: 2,
    });
    return `${prefix}${val} Jt`;
  }
  if (abs >= 1_000) {
    const val = (abs / 1_000).toLocaleString('id-ID', {
      maximumFractionDigits: 0,
    });
    return `${prefix}${val} Rb`;
  }
  return formatIDR(num);
}

/**
 * Parses user input into a clean positive integer
 * @param {string|number} input
 * @returns {number}
 */
export function parseIDRInput(input) {
  if (typeof input === 'number') return isNaN(input) ? 0 : Math.max(0, input);
  if (!input) return 0;
  const digitsOnly = String(input).replace(/\D/g, '');
  return parseInt(digitsOnly, 10) || 0;
}

