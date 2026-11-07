import { describe, it, expect, beforeEach } from 'vitest';
import {
  SELECTED_MONTH_STORAGE_KEY,
  formatMonthValue,
  getCurrentMonthValue,
  getMonthDateRange,
  isValidMonthValue,
  parseMonthValue,
  readStoredMonth,
  writeStoredMonth,
} from '../selected-month';

describe('selected-month', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('formats and parses month values', () => {
    expect(formatMonthValue(2026, 5)).toBe('2026-05');
    expect(parseMonthValue('2026-05')).toEqual({ year: 2026, month: 5 });
  });

  it('rejects invalid month values', () => {
    expect(parseMonthValue('2026-13')).toBeNull();
    expect(parseMonthValue('2026-5')).toBeNull();
    expect(parseMonthValue('')).toBeNull();
    expect(isValidMonthValue('2026-12')).toBe(true);
    expect(isValidMonthValue('hola')).toBe(false);
  });

  it('builds a date range covering the whole month', () => {
    const range = getMonthDateRange('2026-05');
    expect(range?.from.getFullYear()).toBe(2026);
    expect(range?.from.getMonth()).toBe(4);
    expect(range?.from.getDate()).toBe(1);
    expect(range?.to.getMonth()).toBe(4);
    expect(range?.to.getDate()).toBe(31);
  });

  it('returns null for an invalid date range', () => {
    expect(getMonthDateRange('2026-13')).toBeNull();
    expect(getMonthDateRange(null)).toBeNull();
  });

  it('persists and reads the selected month', () => {
    writeStoredMonth('2026-05');
    expect(readStoredMonth()).toBe('2026-05');
    expect(window.localStorage.getItem(SELECTED_MONTH_STORAGE_KEY)).toBe('2026-05');
  });

  it('ignores invalid stored values', () => {
    window.localStorage.setItem(SELECTED_MONTH_STORAGE_KEY, 'nope');
    expect(readStoredMonth()).toBeNull();
  });

  it('computes the current month value', () => {
    expect(getCurrentMonthValue(new Date(2026, 10, 5))).toBe('2026-11');
  });
});
