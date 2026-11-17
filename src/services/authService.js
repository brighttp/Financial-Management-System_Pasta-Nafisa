/**
 * Supabase Authentication Service
 * Pasta Nafisa Financial System
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object, session: Object }>}
 */
export async function signIn(email, password) {
  if (!email || !password) {
    throw new Error('Email dan kata sandi wajib diisi.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    let message = 'Gagal masuk akun. Silakan periksa kembali email dan kata sandi Anda.';
    if (error.message.includes('Invalid login credentials')) {
      message = 'Email atau kata sandi tidak sesuai.';
    } else if (error.message.includes('Email not confirmed')) {
      message = 'Email belum dikonfirmasi di Supabase Auth.';
    } else if (error.message.includes('Too many requests')) {
      message = 'Terlalu banyak percobaan masuk. Mohon tunggu beberapa saat.';
    }
    throw new Error(message);
  }

  return data;
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('SignOut error:', error);
    throw new Error('Gagal keluar dari sesi. Silakan coba lagi.');
  }
}

/**
 * Get current session
 * @returns {Promise<Object|null>}
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('getSession error:', error);
    return null;
  }
  return data.session;
}

/**
 * Get current authenticated user
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
  return data.user;
}

/**
 * Listen for Supabase auth state changes
 * @param {Function} callback
 * @returns {{ unsubscribe: Function }}
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return subscription;
}

