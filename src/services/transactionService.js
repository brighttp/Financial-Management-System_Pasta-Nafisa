/**
 * Financial Transactions Service
 * Pasta Nafisa Financial System
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Normalizes a raw Supabase financial_transaction record for UI consumption
 * @param {Object} row
 * @returns {Object}
 */
export function normalizeTransaction(row) {
  if (!row) return null;

  const isIncome = row.type === 'income';
  const categoryName = row.transaction_categories?.name || 'Lain-lain';
  const outletName = row.outlets?.name || 'Gerai Utama Sukapura';

  // Choose appropriate Material icon based on category/type
  let icon = isIncome ? 'point_of_sale' : 'shopping_basket';
  const lowerCat = categoryName.toLowerCase();
  if (isIncome) {
    if (lowerCat.includes('katering') || lowerCat.includes('pre-order')) icon = 'store';
    else if (lowerCat.includes('online') || lowerCat.includes('gofood') || lowerCat.includes('grab')) icon = 'delivery_dining';
    else icon = 'point_of_sale';
  } else {
    if (lowerCat.includes('bahan') || lowerCat.includes('daging') || lowerCat.includes('pasta')) icon = 'shopping_basket';
    else if (lowerCat.includes('kemasan') || lowerCat.includes('packaging')) icon = 'inventory_2';
    else if (lowerCat.includes('operasional') || lowerCat.includes('listrik') || lowerCat.includes('gas') || lowerCat.includes('sewa')) icon = 'bolt';
    else if (lowerCat.includes('gaji') || lowerCat.includes('karyawan')) icon = 'badge';
    else icon = 'shopping_bag';
  }

  // Derive time from created_at
  let time = '12:00';
  if (row.created_at) {
    try {
      const dt = new Date(row.created_at);
      time = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
    } catch {
      // fallback
    }
  }

  // Extract receipt image if stored in description tag or explicit column
  let descriptionText = row.description || '';
  let receiptImage = row.receipt_url || row.receipt_image || row.receiptImage || null;

  if (!receiptImage && descriptionText) {
    const receiptMatch = descriptionText.match(/\[BUKTI_STRUK:(.+?)\]/s);
    if (receiptMatch) {
      receiptImage = receiptMatch[1];
      descriptionText = descriptionText.replace(/\[BUKTI_STRUK:.+?\]/s, '').trim();
    }
  }

  return {
    id: row.id,
    business_id: row.business_id,
    outlet_id: row.outlet_id,
    outlet_name: outletName,
    category_id: row.category_id,
    category_name: categoryName,
    category: categoryName, // compatibility alias
    type: row.type,
    amount: Number(row.amount) || 0,
    transaction_date: row.transaction_date,
    date: row.transaction_date, // compatibility alias
    description: descriptionText,
    title: descriptionText || (isIncome ? 'Pemasukan Gerai' : 'Pengeluaran Operasional'),
    payment_method: row.payment_method || 'Kas Tunai',
    paymentMethod: row.payment_method || 'Kas Tunai', // compatibility alias
    channel: row.channel || 'Offline / Kasir Gerai',
    receiptImage,
    receipt_url: receiptImage,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    time,
    icon,
    notes: descriptionText,
  };
}

/**
 * Get filtered transactions list
 * @param {Object} options
 * @param {string} options.businessId
 * @param {string} [options.outletId]
 * @param {string} [options.startDate]
 * @param {string} [options.endDate]
 * @param {'income'|'expense'} [options.type]
 * @param {string} [options.categoryId]
 * @param {string} [options.searchQuery]
 * @param {string} [options.sortBy='newest'] 'newest' | 'highest' | 'lowest' | 'oldest'
 * @param {number} [options.limit=200]
 * @param {number} [options.offset=0]
 * @returns {Promise<{ transactions: Array<Object>, totalCount: number }>}
 */
export async function getTransactions({
  businessId,
  outletId,
  startDate,
  endDate,
  type,
  categoryId,
  searchQuery,
  sortBy = 'newest',
  limit = 200,
  offset = 0,
}) {
  if (!businessId) {
    return { transactions: [], totalCount: 0 };
  }

  let query = supabase
    .from('financial_transactions')
    .select('*, outlets(id, name), transaction_categories(id, name, type)', {
      count: 'exact',
    })
    .eq('business_id', businessId);

  // Filter: Outlet
  if (outletId && outletId !== 'all') {
    query = query.eq('outlet_id', outletId);
  }

  // Filter: Date Range
  if (startDate) {
    query = query.gte('transaction_date', startDate);
  }
  if (endDate) {
    query = query.lte('transaction_date', endDate);
  }

  // Filter: Type
  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  // Filter: Category
  if (categoryId && categoryId !== 'all') {
    query = query.eq('category_id', categoryId);
  }

  // Filter: Search Query (description)
  if (searchQuery && searchQuery.trim()) {
    query = query.ilike('description', `%${searchQuery.trim()}%`);
  }

  // Sorting
  if (sortBy === 'highest') {
    query = query.order('amount', { ascending: false });
  } else if (sortBy === 'lowest') {
    query = query.order('amount', { ascending: true });
  } else if (sortBy === 'oldest') {
    query = query.order('transaction_date', { ascending: true }).order('created_at', { ascending: true });
  } else {
    // newest (default)
    query = query.order('transaction_date', { ascending: false }).order('created_at', { ascending: false });
  }

  // Pagination
  if (limit) {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching transactions:', error);
    throw new Error(`Gagal memuat data transaksi: ${error.message}`);
  }

  const normalized = (data || []).map(normalizeTransaction);
  return {
    transactions: normalized,
    totalCount: count || 0,
  };
}

/**
 * Get a single transaction by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getTransactionById(id) {
  if (!id) throw new Error('Transaction ID wajib disertakan.');

  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*, outlets(id, name), transaction_categories(id, name, type)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching transaction by ID:', error);
    throw new Error(`Transaksi tidak ditemukan: ${error.message}`);
  }

  return normalizeTransaction(data);
}

/**
 * Create a new financial transaction
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function createTransaction(params) {
  const businessId = params.businessId || params.business_id;
  const userId = params.userId || params.created_by;
  const outletId = params.outletId || params.outlet_id;
  const categoryId = params.categoryId || params.category_id;
  const transactionDate = params.transactionDate || params.transaction_date;
  const paymentMethod = params.paymentMethod || params.payment_method || 'Kas Tunai';
  const channel = params.channel || 'Offline / Kasir Gerai';
  const type = params.type;
  const amount = Number(params.amount);
  const description = (params.description || params.notes || '').trim();

  if (!businessId) throw new Error('Konteks bisnis wajib tersedia.');
  if (!userId) throw new Error('Autentikasi pengguna wajib tersedia.');
  if (!type || !['income', 'expense'].includes(type)) {
    throw new Error('Tipe transaksi harus "income" atau "expense".');
  }
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Nominal transaksi harus lebih dari Rp 0.');
  }
  if (!transactionDate) {
    throw new Error('Tanggal transaksi wajib diisi.');
  }
  if (!categoryId) {
    throw new Error('Kategori transaksi wajib dipilih.');
  }
  if (!outletId) {
    throw new Error('Gerai outlet wajib dipilih.');
  }

  const receiptImage = params.receiptImage || params.receipt_url || params.receipt_image || null;

  // Prepare description with receipt image if attached
  let finalDescription = description;
  if (receiptImage && typeof receiptImage === 'string') {
    finalDescription = description
      ? `${description}\n\n[BUKTI_STRUK:${receiptImage}]`
      : `[BUKTI_STRUK:${receiptImage}]`;
  }

  const insertData = {
    business_id: businessId,
    outlet_id: outletId,
    category_id: categoryId,
    type,
    amount,
    transaction_date: transactionDate,
    description: finalDescription,
    payment_method: paymentMethod,
    channel,
    created_by: userId,
  };

  // Perform insert with join or fallback to basic insert
  let data = null;
  const result = await supabase
    .from('financial_transactions')
    .insert([insertData])
    .select('*, outlets(id, name), transaction_categories(id, name, type)')
    .single();

  if (result.error) {
    console.warn('Insert with join failed, retrying clean insert:', result.error.message);
    const fallback = await supabase
      .from('financial_transactions')
      .insert([insertData])
      .select('*')
      .single();

    if (fallback.error) {
      console.error('Error inserting transaction:', fallback.error);
      throw new Error(`Gagal menyimpan transaksi ke database: ${fallback.error.message}`);
    }
    data = fallback.data;
  } else {
    data = result.data;
  }

  return normalizeTransaction(data);
}

/**
 * Update an existing financial transaction
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateTransaction(id, updates) {
  if (!id) throw new Error('Transaction ID wajib disertakan.');

  const payload = { ...updates, updated_at: new Date().toISOString() };
  delete payload.id;
  delete payload.created_at;
  delete payload.created_by;
  delete payload.business_id; // Never let user mutate business_id

  if (updates.receiptImage !== undefined) {
    const rawDesc = (updates.description || '').replace(/\[BUKTI_STRUK:.+?\]/s, '').trim();
    if (updates.receiptImage) {
      payload.description = rawDesc
        ? `${rawDesc}\n\n[BUKTI_STRUK:${updates.receiptImage}]`
        : `[BUKTI_STRUK:${updates.receiptImage}]`;
    } else {
      payload.description = rawDesc;
    }
    delete payload.receiptImage;
    delete payload.receipt_url;
  }

  const { data, error } = await supabase
    .from('financial_transactions')
    .update(payload)
    .eq('id', id)
    .select('*, outlets(id, name), transaction_categories(id, name, type)')
    .single();

  if (error) {
    console.error('Error updating transaction:', error);
    throw new Error(`Gagal memperbarui transaksi: ${error.message}`);
  }

  return normalizeTransaction(data);
}

/**
 * Delete a transaction by ID
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function deleteTransaction(id) {
  if (!id) throw new Error('Transaction ID wajib disertakan.');

  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    throw new Error(`Gagal menghapus transaksi: ${error.message}`);
  }

  return true;
}

