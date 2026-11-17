import { useState, useEffect, useCallback, useMemo } from 'react';
import { useBusiness } from './useBusiness';
import { useAuth } from './useAuth';
import * as transactionService from '../services/transactionService';
import { calculateFinancials } from '../utils/financialCalculations';

/**
 * Custom hook to manage transactions and financial calculations
 * @param {Object} options
 * @param {string} [options.startDate]
 * @param {string} [options.endDate]
 * @param {string} [options.type]
 * @param {string} [options.categoryId]
 * @param {string} [options.searchQuery]
 * @param {string} [options.sortBy]
 */
export function useTransactions({
  startDate,
  endDate,
  type = 'all',
  categoryId = 'all',
  searchQuery = '',
  sortBy = 'newest',
} = {}) {
  const { business, selectedOutlet } = useBusiness();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    if (!business?.id) {
      setTransactions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await transactionService.getTransactions({
        businessId: business.id,
        outletId: selectedOutlet,
        startDate,
        endDate,
        type,
        categoryId,
        searchQuery,
        sortBy,
        limit: 300,
      });

      setTransactions(result.transactions);
    } catch (err) {
      console.error('Error fetching transactions in hook:', err);
      setError(err.message || 'Gagal memuat daftar transaksi.');
    } finally {
      setLoading(false);
    }
  }, [business, selectedOutlet, startDate, endDate, type, categoryId, searchQuery, sortBy]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Derived dynamic financials
  const financials = useMemo(() => {
    return calculateFinancials(transactions);
  }, [transactions]);

  // Action: Create Transaction
  const addTransaction = useCallback(
    async (formData) => {
      if (!business?.id || !user?.id) {
        throw new Error('Sesi bisnis tidak aktif.');
      }

      const created = await transactionService.createTransaction({
        ...formData,
        businessId: business.id,
        business_id: business.id,
        userId: user.id,
        created_by: user.id,
      });

      // Update state immediately and trigger fresh query
      setTransactions((prev) => [created, ...prev]);
      return created;
    },
    [business, user]
  );

  // Action: Update Transaction
  const editTransaction = useCallback(
    async (id, updates) => {
      const updated = await transactionService.updateTransaction(id, updates);
      setTransactions((prev) =>
        prev.map((item) => (item.id === id ? updated : item))
      );
      return updated;
    },
    []
  );

  // Action: Delete Transaction
  const removeTransaction = useCallback(
    async (id) => {
      await transactionService.deleteTransaction(id);
      setTransactions((prev) => prev.filter((item) => item.id !== id));
      return true;
    },
    []
  );

  return {
    transactions,
    financials,
    loading,
    error,
    refresh: fetchTransactions,
    addTransaction,
    editTransaction,
    removeTransaction,
  };
}
