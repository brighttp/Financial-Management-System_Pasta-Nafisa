/**
 * Outlet Service
 * Pasta Nafisa Financial System
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Fetch all active outlets for a business
 * @param {string} businessId
 * @returns {Promise<Array<Object>>}
 */
export async function getOutlets(businessId) {
  if (!businessId) return [];

  const { data, error } = await supabase
    .from('outlets')
    .select('id, business_id, name, is_active, created_at')
    .eq('business_id', businessId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching outlets:', error);
    throw new Error(`Gagal memuat daftar outlet gerai: ${error.message}`);
  }

  return data || [];
}

