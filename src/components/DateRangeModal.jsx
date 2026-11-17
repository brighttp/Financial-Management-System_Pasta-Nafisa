import React, { useState, useEffect } from "react";
import { getTodayYMD, parseYMD, getMonthRangeYMD } from "../utils/dateHelpers";

export default function DateRangeModal({
  isOpen,
  onClose,
  onApply,
  initialStartDate,
  initialEndDate,
}) {
  const [startDate, setStartDate] = useState(() => initialStartDate || getMonthRangeYMD().startDate);
  const [endDate, setEndDate] = useState(() => initialEndDate || getMonthRangeYMD().endDate);
  const [hoverDate, setHoverDate] = useState(null);

  // Default view to current active month
  const [currentViewDate, setCurrentViewDate] = useState(() => {
    const initStart = initialStartDate || getMonthRangeYMD().startDate;
    if (initStart) {
      const d = parseYMD(initStart);
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Keep state synced when modal opens
  useEffect(() => {
    if (isOpen) {
      const start = initialStartDate || getMonthRangeYMD().startDate;
      const end = initialEndDate || getMonthRangeYMD().endDate;
      setStartDate(start);
      setEndDate(end);
      if (start) {
        const d = parseYMD(start);
        if (!isNaN(d.getTime())) {
          setCurrentViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
        }
      }
    }
  }, [isOpen, initialStartDate, initialEndDate]);

  if (!isOpen) return null;

  // Month names in Indonesian
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const weekdays = [
    { label: "Sen", isWeekend: false },
    { label: "Sel", isWeekend: false },
    { label: "Rab", isWeekend: false },
    { label: "Kam", isWeekend: false },
    { label: "Jum", isWeekend: false },
    { label: "Sab", isWeekend: true },
    { label: "Min", isWeekend: true },
  ];

  // Helper to format date strings YYYY-MM-DD
  const formatYMD = (year, month, day) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  // Helper to format date for display DD/MM/YYYY
  const formatDisplayDate = (ymdStr) => {
    if (!ymdStr) return "—";
    const parts = ymdStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymdStr;
  };

  // Generate calendar days for a specific year and month
  // Monday is day 0, Sunday is day 6
  const getCalendarMonth = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday
    const startOffset = (firstDay + 6) % 7; // Monday = 0, ..., Sunday = 6
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding before 1st of month
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    // Days of month
    for (let day = 1; day <= totalDays; day++) {
      const ymd = formatYMD(year, month, day);
      const dayOfWeek = (startOffset + day - 1) % 7;
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Sab or Min
      days.push({ day, ymd, isWeekend });
    }
    return days;
  };

  // Compute Left Month (current) and Right Month (next)
  const leftYear = currentViewDate.getFullYear();
  const leftMonth = currentViewDate.getMonth();
  const leftDays = getCalendarMonth(leftYear, leftMonth);

  const nextMonthDate = new Date(leftYear, leftMonth + 1, 1);
  const rightYear = nextMonthDate.getFullYear();
  const rightMonth = nextMonthDate.getMonth();
  const rightDays = getCalendarMonth(rightYear, rightMonth);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(leftYear, leftMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(leftYear, leftMonth + 1, 1));
  };

  // Date click handler
  const handleDateClick = (ymd) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(ymd);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (ymd < startDate) {
        setEndDate(startDate);
        setStartDate(ymd);
      } else {
        setEndDate(ymd);
      }
    }
  };

  // Presets
  const applyPreset = (presetType) => {
    const today = new Date();
    const todayStr = getTodayYMD();

    if (presetType === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
      setCurrentViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    } else if (presetType === "7days") {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 6);
      const startStr = formatYMD(past7.getFullYear(), past7.getMonth(), past7.getDate());
      setStartDate(startStr);
      setEndDate(todayStr);
      setCurrentViewDate(new Date(past7.getFullYear(), past7.getMonth(), 1));
    } else if (presetType === "30days") {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 29);
      const startStr = formatYMD(past30.getFullYear(), past30.getMonth(), past30.getDate());
      setStartDate(startStr);
      setEndDate(todayStr);
      setCurrentViewDate(new Date(past30.getFullYear(), past30.getMonth(), 1));
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleApply = () => {
    if (startDate) {
      onApply({
        startDate: startDate,
        endDate: endDate || startDate,
      });
      onClose();
    }
  };

  // Render day cell
  const renderDayCell = (cell, idx) => {
    if (!cell) {
      return <div key={`empty-${idx}`} className="h-8 sm:h-9" />;
    }

    const { day, ymd, isWeekend } = cell;
    const isStart = startDate === ymd;
    const isEnd = endDate === ymd;
    const isInRange =
      startDate && endDate && ymd > startDate && ymd < endDate;
    const isHoverRange =
      startDate && !endDate && hoverDate && hoverDate > startDate && ymd > startDate && ymd <= hoverDate;

    // Special indicator for current day
    const isTodayIndicator = ymd === getTodayYMD();

    let cellClass = "relative h-8 sm:h-9 w-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors cursor-pointer select-none ";
    let innerClass = "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-xs sm:text-sm transition-all ";

    if (isStart && isEnd) {
      cellClass += "";
      innerClass += "bg-[#0a2540] text-white font-bold shadow-sm";
    } else if (isStart) {
      cellClass += "bg-blue-100/60 rounded-l-full";
      innerClass += "bg-[#0a2540] text-white font-bold shadow-sm";
    } else if (isEnd) {
      cellClass += "bg-blue-100/60 rounded-r-full";
      innerClass += "bg-[#0a2540] text-white font-bold shadow-sm";
    } else if (isInRange) {
      cellClass += "bg-blue-100/60 text-[#0a2540]";
      innerClass += "text-[#0a2540] font-semibold";
    } else if (isHoverRange) {
      cellClass += "bg-blue-50 text-[#0a2540]";
      innerClass += "text-[#0a2540]";
    } else {
      // Normal state
      if (isWeekend) {
        innerClass += "text-[#e04f44] hover:bg-slate-100";
      } else {
        innerClass += "text-slate-700 hover:bg-slate-100";
      }

      if (isTodayIndicator) {
        innerClass += " border-b-2 border-cyan-500 font-bold text-cyan-700";
      }
    }

    return (
      <div
        key={ymd}
        className={cellClass}
        onClick={() => handleDateClick(ymd)}
        onMouseEnter={() => setHoverDate(ymd)}
      >
        <span className={innerClass}>{day}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Date Range Picker Card Container */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-4 sm:p-6 overflow-hidden flex flex-col space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* 1. Header (Title & Subtitle) */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0a2540] leading-tight">
            Rentang Tanggal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pilih tanggal mulai dan tanggal akhir untuk melihat statistik.
          </p>
        </div>

        {/* 2. DARI -> SAMPAI Input Box Container (Styled like Image 1) */}
        <div className="bg-[#f3f6fb] rounded-2xl p-3 sm:p-4 flex items-center gap-6 sm:gap-10 border border-slate-200/60">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              DARI
            </span>
            <span className="text-sm sm:text-base font-bold text-[#0a2540] block mt-0.5 font-mono">
              {formatDisplayDate(startDate)}
            </span>
          </div>

          <div className="text-slate-400 font-bold text-lg select-none">
            →
          </div>

          <div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              SAMPAI
            </span>
            <span className="text-sm sm:text-base font-bold text-[#0a2540] block mt-0.5 font-mono">
              {formatDisplayDate(endDate)}
            </span>
          </div>
        </div>

        {/* 3. Dual Month Calendar View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* LEFT MONTH */}
          <div className="space-y-3">
            {/* Month Header with Prev Button */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevMonth}
                aria-label="Bulan Sebelumnya"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <h3 className="text-sm sm:text-base font-bold text-[#0a2540]">
                {monthNames[leftMonth]} {leftYear}
              </h3>
              <div className="w-8 md:hidden">
                {/* On mobile, allow forward button on the single month */}
                <button
                  onClick={handleNextMonth}
                  aria-label="Bulan Berikutnya"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer ml-auto"
                >
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
              <div className="w-8 hidden md:block" />
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 text-center">
              {weekdays.map((w) => (
                <span
                  key={w.label}
                  className={`text-[11px] sm:text-xs font-semibold py-1 ${
                    w.isWeekend ? "text-[#e04f44]" : "text-slate-500"
                  }`}
                >
                  {w.label}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {leftDays.map((cell, idx) => renderDayCell(cell, `left-${idx}`))}
            </div>
          </div>

          {/* RIGHT MONTH (Shown on desktop/tablet, hidden on narrow mobile) */}
          <div className="space-y-3 hidden md:block">
            {/* Month Header with Next Button */}
            <div className="flex items-center justify-between">
              <div className="w-8" />
              <h3 className="text-sm sm:text-base font-bold text-[#0a2540]">
                {monthNames[rightMonth]} {rightYear}
              </h3>
              <button
                onClick={handleNextMonth}
                aria-label="Bulan Berikutnya"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 text-center">
              {weekdays.map((w) => (
                <span
                  key={`r-${w.label}`}
                  className={`text-[11px] sm:text-xs font-semibold py-1 ${
                    w.isWeekend ? "text-[#e04f44]" : "text-slate-500"
                  }`}
                >
                  {w.label}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {rightDays.map((cell, idx) => renderDayCell(cell, `right-${idx}`))}
            </div>
          </div>
        </div>

        {/* 4. Bottom Controls: Presets (Left) & Action Buttons (Right) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Quick Preset Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => applyPreset("today")}
              type="button"
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#f1f4f9] hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors whitespace-nowrap cursor-pointer"
            >
              Hari ini
            </button>
            <button
              onClick={() => applyPreset("7days")}
              type="button"
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#f1f4f9] hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors whitespace-nowrap cursor-pointer"
            >
              7 hari terakhir
            </button>
            <button
              onClick={() => applyPreset("30days")}
              type="button"
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#f1f4f9] hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors whitespace-nowrap cursor-pointer"
            >
              30 hari terakhir
            </button>
          </div>

          {/* Action Buttons: Bersihkan & Terapkan Tanggal */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleClear}
              type="button"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Bersihkan
            </button>
            <button
              onClick={handleApply}
              type="button"
              disabled={!startDate}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm transition-all cursor-pointer ${
                startDate
                  ? "bg-[#0a2540] hover:bg-[#071c33] active:scale-95"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              Terapkan Tanggal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
