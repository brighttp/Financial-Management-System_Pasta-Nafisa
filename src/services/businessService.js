/**
 * Business & Membership Service
 * Pasta Nafisa Financial System
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Retrieve business membership for the authenticated user
 * @param {string} userId
 * @returns {Promise<{ membership: Object, business: Object }>}
 */
export async function getUserBusinessContext(userId) {
  if (!userId) {
    throw new Error('User ID diperlukan untuk memuat konteks bisnis.');
  }

  // 1. Fetch membership from business_members
  const { data: memberRecord, error: memberError } = await supabase
    .from('business_members')
    .select('id, business_id, user_id, role, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (memberError) {
    console.error('Error fetching business_members:', memberError);
    throw new Error(`Gagal memuat otorisasi bisnis: ${memberError.message}`);
  }

  if (!memberRecord || !memberRecord.business_id) {
    throw new Error(
      'Akun Anda belum terdaftar sebagai anggota bisnis Pasta Nafisa manapun. Hubungi administrator sistem.'
    );
  }

  // 2. Fetch business details from businesses table
  const { data: businessRecord, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, created_at')
    .eq('id', memberRecord.business_id)
    .single();

  if (businessError) {
    console.error('Error fetching businesses:', businessError);
    throw new Error(`Gagal memuat profil bisnis Pasta Nafisa: ${businessError.message}`);
  }

  return {
    membership: memberRecord,
    business: businessRecord,
  };
}

/**
 * Seed default outlets and transaction categories if they don't exist yet
 * @param {string} businessId
 */
export async function seedInitialBusinessDefaults(businessId) {
  if (!businessId) return;

  // 1. Check existing outlets
  const { data: existingOutlets } = await supabase
    .from('outlets')
    .select('id')
    .eq('business_id', businessId);

  if (!existingOutlets || existingOutlets.length === 0) {
    await supabase.from('outlets').insert([
      { business_id: businessId, name: 'Gerai Utama Sukapura', is_active: true },
      { business_id: businessId, name: 'Gerai GKU Telkom University', is_active: true },
    ]);
  }

  // 2. Check existing categories
  const { data: existingCategories } = await supabase
    .from('transaction_categories')
    .select('id')
    .eq('business_id', businessId);

  if (!existingCategories || existingCategories.length === 0) {
    await supabase.from('transaction_categories').insert([
      // Income
      { business_id: businessId, name: 'Penjualan Gerai', type: 'income', is_active: true },
      { business_id: businessId, name: 'Pesanan Katering', type: 'income', is_active: true },
      { business_id: businessId, name: 'Penjualan Online', type: 'income', is_active: true },
      // Expense
      { business_id: businessId, name: 'Bahan Baku (Pasta & Daging)', type: 'expense', is_active: true },
      { business_id: businessId, name: 'Kemasan / Packaging', type: 'expense', is_active: true },
      { business_id: businessId, name: 'Operasional & Sewa', type: 'expense', is_active: true },
      { business_id: businessId, name: 'Gaji Karyawan', type: 'expense', is_active: true },
      { business_id: businessId, name: 'Lain-lain', type: 'expense', is_active: true },
    ]);
  }
}

