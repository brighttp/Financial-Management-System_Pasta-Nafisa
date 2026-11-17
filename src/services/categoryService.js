/**
 * Transaction Categories Service
 * Pasta Nafisa Financial System
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Fetch transaction categories for a business
 * @param {string} businessId
 * @param {'income'|'expense'} [type] Optional type filter
 * @returns {Promise<Array<Object>>}
 */
export async function getCategories(businessId, type) {
  if (!businessId) return [];

  let query = supabase
    .from('transaction_categories')
    .select('id, business_id, name, type, is_active, created_at')
    .eq('business_id', businessId)
    .neq('is_active', false)
    .order('name', { ascending: true });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error(`Gagal memuat kategori transaksi: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new transaction category
 * @param {Object} params
 * @param {string} params.businessId
 * @param {string} params.name
 * @param {'income'|'expense'} [params.type]
 * @returns {Promise<Object>}
 */
export async function createCategory({ businessId, name, type = 'expense' }) {
  if (!businessId) throw new Error('ID Bisnis wajib ada.');
  if (!name || !name.trim()) throw new Error('Nama kategori wajib diisi.');

  const cleanName = name.trim();
  const cleanType = type === 'income' ? 'income' : 'expense';

  const { data, error } = await supabase
    .from('transaction_categories')
    .insert([
      {
        business_id: businessId,
        name: cleanName,
        type: cleanType,
        is_active: true,
      },
    ])
    .select('id, business_id, name, type, is_active, created_at')
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw new Error(`Gagal menambahkan kategori: ${error.message}`);
  }

  return data;
}

/**
 * Delete or deactivate a transaction category
 * @param {string} categoryId
 * @returns {Promise<{id: string, deleted?: boolean, softDeleted?: boolean}>}
 */
export async function deleteCategory(categoryId) {
  if (!categoryId) throw new Error('ID Kategori wajib ada.');

  // Attempt delete first
  const { error } = await supabase
    .from('transaction_categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    // If foreign key constraint blocks deletion, fallback to soft delete (is_active = false)
    const { error: updateError } = await supabase
      .from('transaction_categories')
      .update({ is_active: false })
      .eq('id', categoryId);

    if (updateError) {
      console.error('Error soft-deleting category:', updateError);
      throw new Error(`Gagal menghapus kategori: ${updateError.message}`);
    }

    return { id: categoryId, softDeleted: true };
  }

  return { id: categoryId, deleted: true };
}

