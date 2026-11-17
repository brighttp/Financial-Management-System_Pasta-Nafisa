import React from "react";

export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "dashboard",
    },
    {
      id: "transactions",
      label: "Transaksi",
      icon: "receipt_long",
    },
    {
      id: "reports",
      label: "Laporan",
      icon: "bar_chart",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-3 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-variant/50 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-1 flex-1 relative active:scale-95 transition-all duration-150 cursor-pointer ${
              isActive
                ? "text-primary font-bold"
                : "text-secondary hover:text-on-surface"
            }`}
            type="button"
          >
            <span
              className="material-symbols-outlined text-[22px] sm:text-[24px]"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {tab.icon}
            </span>
            <span className="text-[11px] font-semibold mt-0.5 tracking-tight">
              {tab.label}
            </span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5 animate-in zoom-in duration-200"></span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
