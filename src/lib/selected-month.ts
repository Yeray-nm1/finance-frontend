export const SELECTED_MONTH_STORAGE_KEY = "finance:selected-month";

export function formatMonthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getCurrentMonthValue(date = new Date()): string {
  return formatMonthValue(date.getFullYear(), date.getMonth() + 1);
}

export function parseMonthValue(value: string | null | undefined): { year: number; month: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function isValidMonthValue(value: string | null | undefined): value is string {
  return parseMonthValue(value) !== null;
}

export function getMonthDateRange(value: string | null | undefined): { from: Date; to: Date } | null {
  const parsed = parseMonthValue(value);
  if (!parsed) return null;
  return {
    from: new Date(parsed.year, parsed.month - 1, 1),
    to: new Date(parsed.year, parsed.month, 0),
  };
}

export function readStoredMonth(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(SELECTED_MONTH_STORAGE_KEY);
    return isValidMonthValue(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredMonth(value: string): void {
  if (typeof window === "undefined" || !isValidMonthValue(value)) return;
  try {
    window.localStorage.setItem(SELECTED_MONTH_STORAGE_KEY, value);
  } catch {
    // Storage can be unavailable (private mode, quota); the UI still works.
  }
}
