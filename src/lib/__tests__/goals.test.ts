import { describe, it, expect } from 'vitest';
import {
  clampProgress,
  formatGoalDate,
  getGoalStatus,
  todayInputValue,
} from '@/lib/goals';

describe('goals helpers', () => {
  it('clamps progress between 0 and 100', () => {
    expect(clampProgress(-10)).toBe(0);
    expect(clampProgress(42.5)).toBe(42.5);
    expect(clampProgress(150)).toBe(100);
    expect(clampProgress(Number.NaN)).toBe(0);
  });

  it('formats goal dates in Spanish without timezone shifts', () => {
    expect(formatGoalDate('2027-06-01T00:00:00.000Z')).toBe('1 jun 2027');
    expect(formatGoalDate(null)).toBeNull();
    expect(formatGoalDate('nope')).toBeNull();
  });

  it('derives the goal status', () => {
    expect(getGoalStatus({ progress: 25, isArchived: false })).toBe('active');
    expect(getGoalStatus({ progress: 100, isArchived: false })).toBe('done');
    expect(getGoalStatus({ progress: 100, isArchived: true })).toBe('archived');
  });

  it('builds a local date input value', () => {
    expect(todayInputValue(new Date(2026, 4, 9))).toBe('2026-05-09');
  });
});
