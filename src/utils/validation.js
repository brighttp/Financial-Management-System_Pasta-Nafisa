/**
 * Validation utilities for transaction forms and data entry
 * Pasta Nafisa Financial System
 */

/**
 * Validate transaction form payload
 * @param {Object} payload
 * @param {Array<Object>} availableCategories
 * @param {Array<Object>} availableOutlets
 * @returns {{ isValid: boolean, errors: Object.<string, string> }}
 */
export function validateTransactionInput(payload, availableCategories = [], availableOutlets = []) {
  const errors = {};

  const type = payload.type;
  const amount = Number(payload.amount);
  const transaction_date = payload.transaction_date || payload.transactionDate;
  const category_id = payload.category_id || payload.categoryId;
  const outlet_id = payload.outlet_id || payload.outletId;

  // 1. Transaction Type
  if (!type || !['income', 'expense'].includes(type)) {
    errors.type = 'Tipe transaksi harus dipilih (Pemasukan atau Pengeluaran).';
  }

  // 2. Amount
  if (isNaN(amount) || amount <= 0) {
    errors.amount = 'Nominal transaksi harus lebih besar dari Rp 0.';
  }

  // 3. Date
  if (!transaction_date) {
    errors.transaction_date = 'Tanggal transaksi wajib diisi.';
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(transaction_date)) {
      errors.transaction_date = 'Format tanggal harus YYYY-MM-DD.';
    }
  }

  // 4. Category
  if (!category_id) {
    errors.category_id = 'Kategori transaksi wajib dipilih.';
  } else if (availableCategories.length > 0) {
    const selectedCategory = availableCategories.find((c) => c.id === category_id);
    if (!selectedCategory) {
      errors.category_id = 'Kategori yang dipilih tidak valid untuk unit bisnis ini.';
    } else if (type && selectedCategory.type && selectedCategory.type.toLowerCase() !== type.toLowerCase()) {
      errors.category_id = `Kategori tidak sesuai dengan tipe transaksi (${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}).`;
    }
  }

  // 5. Outlet
  if (!outlet_id) {
    errors.outlet_id = 'Gerai outlet wajib dipilih.';
  } else if (availableOutlets.length > 0) {
    const selectedOutlet = availableOutlets.find((o) => o.id === outlet_id);
    if (!selectedOutlet) {
      errors.outlet_id = 'Outlet yang dipilih tidak terdaftar pada unit bisnis ini.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate user email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

