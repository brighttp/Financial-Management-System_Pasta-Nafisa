/**
 * Date Helpers for Pasta Nafisa Financial Dashboard
 * Consistent Indonesian business dates without UTC shift errors
 */

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

/**
 * Format local Date to 'YYYY-MM-DD' string safely
 * @param {Date} date
 * @returns {string}
 */
export function formatYMD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get current business date in 'YYYY-MM-DD'
 * @returns {string}
 */
export function getTodayYMD() {
  return formatYMD(new Date());
}

/**
 * Get current week date range (Monday to Sunday)
 * @param {Date} [baseDate]
 * @returns {{ startDate: string, endDate: string }}
 */
export function getWeekRangeYMD(baseDate = new Date()) {
  const date = new Date(baseDate);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    startDate: formatYMD(monday),
    endDate: formatYMD(sunday),
  };
}

/**
 * Get previous week date range (for comparison)
 * @param {Date} [baseDate]
 * @returns {{ startDate: string, endDate: string }}
 */
export function getPreviousWeekRangeYMD(baseDate = new Date()) {
  const current = getWeekRangeYMD(baseDate);
  const prevMonday = new Date(current.startDate);
  prevMonday.setDate(prevMonday.getDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevMonday.getDate() + 6);
  return {
    startDate: formatYMD(prevMonday),
    endDate: formatYMD(prevSunday),
  };
}

/**
 * Get current month date range (1st to last day of month)
 * @param {Date} [baseDate]
 * @returns {{ startDate: string, endDate: string }}
 */
export function getMonthRangeYMD(baseDate = new Date()) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  return {
    startDate: formatYMD(firstDay),
    endDate: formatYMD(lastDay),
  };
}

/**
 * Get previous month date range (for comparison)
 * @param {Date} [baseDate]
 * @returns {{ startDate: string, endDate: string }}
 */
export function getPreviousMonthRangeYMD(baseDate = new Date()) {
  const prev = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
  return getMonthRangeYMD(prev);
}

/**
 * Get previous day in 'YYYY-MM-DD'
 * @param {string|Date} [baseDate]
 * @returns {string}
 */
export function getPreviousDayYMD(baseDate = new Date()) {
  const d = typeof baseDate === 'string' ? parseYMD(baseDate) : new Date(baseDate);
  d.setDate(d.getDate() - 1);
  return formatYMD(d);
}

/**
 * Parse 'YYYY-MM-DD' string safely to local Date without UTC conversion drift
 * @param {string} ymd
 * @returns {Date}
 */
export function parseYMD(ymd) {
  if (!ymd) return new Date();
  const parts = ymd.split('-');
  if (parts.length !== 3) return new Date();
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

/**
 * Format 'YYYY-MM-DD' into Indonesian display string
 * e.g. "24 Okt 2023" or "Selasa, 24 Oktober 2023"
 * @param {string} ymd
 * @param {boolean} [full=false]
 * @returns {string}
 */
export function formatIndonesianDate(ymd, full = false) {
  if (!ymd) return '—';
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;

  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthName = full ? MONTH_NAMES_FULL[monthIdx] : MONTH_NAMES_SHORT[monthIdx];

  if (full) {
    const d = parseYMD(ymd);
    const dayName = DAY_NAMES[d.getDay()];
    return `${dayName}, ${day} ${monthName} ${year}`;
  }

  return `${day} ${monthName} ${year}`;
}

/**
 * Format 'YYYY-MM-DD' into compact timeline string
 * e.g. "Kamis, 5 Nov 2026"
 * @param {string} ymd
 * @returns {string}
 */
export function formatTimelineDate(ymd) {
  if (!ymd) return '—';
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  const d = parseYMD(ymd);
  const dayName = DAY_NAMES[d.getDay()];
  const monthName = MONTH_NAMES_SHORT[parseInt(parts[1], 10) - 1];
  return `${dayName}, ${parseInt(parts[2], 10)} ${monthName} ${parts[0]}`;
}

/**
 * Check if a date string 'YYYY-MM-DD' is within range inclusive
 * @param {string} targetYmd
 * @param {string} startYmd
 * @param {string} endYmd
 * @returns {boolean}
 */
export function isWithinDateRange(targetYmd, startYmd, endYmd) {
  if (!targetYmd) return false;
  if (startYmd && targetYmd < startYmd) return false;
  if (endYmd && targetYmd > endYmd) return false;
  return true;
}

/**
 * Convert 'YYYY-MM-DD' to 'DD/MM/YYYY'
 * @param {string} ymd
 * @returns {string}
 */
export function ymdToDMY(ymd) {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return ymd;
}

/**
 * Convert 'DD/MM/YYYY' to 'YYYY-MM-DD'
 * @param {string} dmy
 * @returns {string}
 */
export function dmyToYMD(dmy) {
  if (!dmy) return '';
  const parts = dmy.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dmy;
}

/**
 * Determine which week of the month (M1 - M4) a date falls in
 * M1: Day 1 - 7
 * M2: Day 8 - 14
 * M3: Day 15 - 21
 * M4: Day 22+
 * @param {string} ymd
 * @returns {string}
 */
export function getWeekLabelOfMonth(ymd) {
  if (!ymd) return 'M1';
  const parts = ymd.split('-');
  const day = parseInt(parts[2], 10) || 1;
  if (day <= 7) return 'M1';
  if (day <= 14) return 'M2';
  if (day <= 21) return 'M3';
  return 'M4';
}

