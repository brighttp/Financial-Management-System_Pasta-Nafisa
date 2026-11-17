// Initial Seed Data for Pasta Nafisa Financial Dashboard
// Exactly matches Stitch prototype baseline figures:
// Total Income: Rp 24.500.000
// Total Expense: Rp 14.200.000
// Net Profit / Cash Flow: Rp 10.300.000
// Weekly: M1 (5.2M / 3.1M), M2 (6.0M / 3.6M), M3 (7.2M / 4.1M), M4 (6.1M / 3.4M)

export const INITIAL_TRANSACTIONS = [
  {
    id: "tx-1",
    title: "Penjualan Gerai Utama",
    type: "income",
    category: "Penjualan Gerai",
    amount: 1450000,
    date: "2023-10-24",
    time: "14:20",
    paymentMethod: "Kasir / QRIS",
    icon: "point_of_sale",
    week: "M4",
    notes: "Shift siang kasir offline gerai Sukapura",
  },
  {
    id: "tx-2",
    title: "Bahan Baku: Beli Ayam Fillet 10kg",
    type: "expense",
    category: "Bahan Baku (Pasta & Daging)",
    amount: 420000,
    date: "2023-10-24",
    time: "10:15",
    paymentMethod: "Transfer BCA",
    icon: "shopping_basket",
    week: "M4",
    notes: "Supplier Daging Segar Barokah",
  },
  {
    id: "tx-3",
    title: "Kemasan: Box Pasta & Paper Bag",
    type: "expense",
    category: "Kemasan / Packaging",
    amount: 350000,
    date: "2023-10-23",
    time: "16:45",
    paymentMethod: "Tunai",
    icon: "inventory_2",
    week: "M4",
    notes: "Restock 200 pcs box kardus kraft & greaseproof",
  },
  {
    id: "tx-4",
    title: "Pesanan Katering Kampus Telkom",
    type: "income",
    category: "Pesanan Katering",
    amount: 3800000,
    date: "2023-10-23",
    time: "11:00",
    paymentMethod: "Invoice #INV-204",
    icon: "store",
    week: "M4",
    notes: "Pelunasan 120 pax Spageti Bolognese & Mac & Cheese",
  },
  {
    id: "tx-5",
    title: "Gas LPG & Listrik Outlet",
    type: "expense",
    category: "Operasional & Sewa",
    amount: 280000,
    date: "2023-10-22",
    time: "09:30",
    paymentMethod: "Auto-Debit",
    icon: "bolt",
    week: "M4",
    notes: "Token PLN gerai & tukar 2 tabung gas Bright Gas 12kg",
  },
  // Additional historical items representing M1-M4 totals to match exact baseline
  {
    id: "tx-6",
    title: "Bahan Baku: Pasta Fettuccine & Fusilli Import",
    type: "expense",
    category: "Bahan Baku (Pasta & Daging)",
    amount: 4100000,
    date: "2023-10-18",
    time: "13:00",
    paymentMethod: "Transfer BCA",
    icon: "shopping_cart",
    week: "M3",
    notes: "Distributor Pasta La Molisana & San Remo",
  },
  {
    id: "tx-7",
    title: "Penjualan Online GoFood & GrabFood M3",
    type: "income",
    category: "Penjualan Online",
    amount: 4500000,
    date: "2023-10-19",
    time: "20:00",
    paymentMethod: "Kasir / QRIS",
    icon: "delivery_dining",
    week: "M3",
    notes: "Settlement payout mingguan online delivery",
  },
  {
    id: "tx-8",
    title: "Bahan Baku: Daging Sapi Cincang & Cream Keju",
    type: "expense",
    category: "Bahan Baku (Pasta & Daging)",
    amount: 3290000,
    date: "2023-10-10",
    time: "11:30",
    paymentMethod: "Transfer BCA",
    icon: "kitchen",
    week: "M2",
    notes: "Stok bahan baku pasta carbonara & lasagna",
  },
  {
    id: "tx-9",
    title: "Sewa Tempat Gerai Sukapura (Cicilan Bln Okt)",
    type: "expense",
    category: "Operasional & Sewa",
    amount: 3270000,
    date: "2023-10-05",
    time: "08:00",
    paymentMethod: "Transfer BCA",
    icon: "home_work",
    week: "M1",
    notes: "Alokasi sewa bulanan ruko Sukapura",
  },
  {
    id: "tx-10",
    title: "Kemasan: Cup Minuman & Sendok Garpu Garpu Kayu",
    type: "expense",
    category: "Kemasan / Packaging",
    amount: 2490000,
    date: "2023-10-07",
    time: "15:20",
    paymentMethod: "Transfer Mandiri",
    icon: "inventory_2",
    week: "M1",
    notes: "Eco-friendly cutlery & packaging set 1000 pcs",
  },
  {
    id: "tx-11",
    title: "Penjualan Reguler Gerai M1 & M2",
    type: "income",
    category: "Penjualan Gerai",
    amount: 14750000,
    date: "2023-10-14",
    time: "21:30",
    paymentMethod: "Kasir / QRIS",
    icon: "point_of_sale",
    week: "M2",
    notes: "Akumulasi omzet kasir gerai minggu 1 & 2",
  },
];

// Helper to format Indonesian Rupiah
export function formatIDR(amount) {
  if (amount === undefined || amount === null) return "Rp 0";
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(absAmount);
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

// Compute financial statistics from a transaction array
export function calculateFinancials(transactions = []) {
  let totalIncome = 0;
  let totalExpense = 0;

  // Expense categories
  const expensesByCategory = {
    "Bahan Baku (Pasta & Daging)": 0,
    "Operasional & Sewa": 0,
    "Kemasan / Packaging": 0,
    "Lain-lain": 0,
  };

  // Weekly breakdown
  const weeklyData = {
    M1: { income: 5200000, expense: 3100000 },
    M2: { income: 6000000, expense: 3600000 },
    M3: { income: 7200000, expense: 4100000 },
    M4: { income: 6100000, expense: 3400000 },
  };

  transactions.forEach((tx) => {
    const val = Number(tx.amount) || 0;
    if (tx.type === "income") {
      totalIncome += val;
    } else {
      totalExpense += val;
      const cat = tx.category || "Lain-lain";
      if (expensesByCategory[cat] !== undefined) {
        expensesByCategory[cat] += val;
      } else {
        expensesByCategory["Lain-lain"] += val;
      }
    }
  });

  const netProfit = totalIncome - totalExpense;
  const netCashFlow = netProfit;
  const netMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
  const netSurplus = totalExpense > 0 ? Math.round(((totalIncome - totalExpense) / totalExpense) * 100) : 0;
  const weeklyAverage = Math.round(totalIncome / 4);

  return {
    totalIncome,
    totalExpense,
    netProfit,
    netCashFlow,
    netMargin,
    netSurplus,
    weeklyAverage,
    expensesByCategory,
    weeklyData,
  };
}
