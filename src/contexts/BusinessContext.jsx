import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserBusinessContext } from '../services/businessService';
import { getOutlets } from '../services/outletService';
import { getCategories, createCategory, deleteCategory } from '../services/categoryService';
import Toast from '../components/Toast';

const DEFAULT_CHANNELS = [
  "Offline / Kasir Gerai",
  "Pesanan Katering (Pre-Order)",
  "GoFood",
  "GrabFood",
  "ShopeeFood",
  "WhatsApp / Direct Order",
  "Lainnya",
];

export const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [business, setBusiness] = useState(null);
  const [membership, setMembership] = useState(null);
  const [role, setRole] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [categories, setCategories] = useState([]);

  // Active filters
  const [selectedOutlet, setSelectedOutlet] = useState('all'); // 'all' or outlet UUID

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadBusinessData = useCallback(async () => {
    if (!user?.id) {
      setBusiness(null);
      setMembership(null);
      setRole(null);
      setOutlets([]);
      setCategories([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Load business and membership
      const { business: biz, membership: mem } = await getUserBusinessContext(user.id);
      setBusiness(biz);
      setMembership(mem);
      setRole(mem?.role || 'owner');

      // 2. Load outlets and categories in parallel for this business
      const [outletsList, categoriesList] = await Promise.all([
        getOutlets(biz.id),
        getCategories(biz.id),
      ]);

      setOutlets(outletsList);
      setCategories(categoriesList);
    } catch (err) {
      console.error('Error loading business context:', err);
      setError(err.message || 'Gagal memuat konteks bisnis Pasta Nafisa.');
      setBusiness(null);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadBusinessData();
    } else {
      setBusiness(null);
      setMembership(null);
      setRole(null);
      setOutlets([]);
      setCategories([]);
      setError(null);
    }
  }, [isAuthenticated, user, loadBusinessData]);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success", title = "") => {
    setToast({ message, type, title, id: Date.now() });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const addCategory = async ({ name, type }) => {
    if (!business?.id) throw new Error("Bisnis belum dimuat.");
    const newCat = await createCategory({ businessId: business.id, name, type });
    setCategories((prev) => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
    showToast(`Kategori "${newCat.name}" berhasil ditambahkan!`, "success");
    return newCat;
  };

  const removeCategory = async (categoryId) => {
    const targetCat = categories.find((c) => c.id === categoryId);
    const catName = targetCat ? targetCat.name : "Kategori";
    const res = await deleteCategory(categoryId);
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    showToast(`Kategori "${catName}" berhasil dihapus.`, "delete");
    return res;
  };

  // Channels state with persistence in localStorage
  const [channels, setChannels] = useState(() => {
    try {
      const saved = localStorage.getItem("pasta_nafisa_custom_channels");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_CHANNELS;
  });

  const addChannel = (newChannelName) => {
    const trimmed = (newChannelName || "").trim();
    if (!trimmed) throw new Error("Nama kanal tidak boleh kosong.");
    if (channels.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Kanal "${trimmed}" sudah ada.`);
    }
    const updated = [...channels, trimmed];
    setChannels(updated);
    try {
      localStorage.setItem("pasta_nafisa_custom_channels", JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast(`Kanal "${trimmed}" berhasil ditambahkan!`, "success");
    return trimmed;
  };

  const removeChannel = (channelNameToRemove) => {
    const updated = channels.filter((c) => c !== channelNameToRemove);
    setChannels(updated);
    try {
      localStorage.setItem("pasta_nafisa_custom_channels", JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast(`Kanal "${channelNameToRemove}" berhasil dihapus.`, "delete");
  };

  const value = {
    business,
    membership,
    role,
    outlets,
    categories,
    channels,
    addChannel,
    removeChannel,
    selectedOutlet,
    setSelectedOutlet,
    loading,
    error,
    refreshBusinessData: loadBusinessData,
    addCategory,
    removeCategory,
    showToast,
    hideToast,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
      <Toast toast={toast} onClose={hideToast} />
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = React.useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}

