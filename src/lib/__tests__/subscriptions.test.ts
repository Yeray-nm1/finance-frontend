import { describe, it, expect, vi, afterEach } from 'vitest';
import { getAnnualCost, getNextChargeDate } from '@/lib/subscriptions';
import type { Subscription } from '@/types/subscriptions';

afterEach(() => {
  vi.useRealTimers();
});

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    userId: 'user-1',
    name: 'Netflix',
    amount: 9.99,
    frequency: 'monthly',
    matchDescriptions: [],
    amountTolerance: 10,
    active: true,
    createdAt: new Date(2026, 0, 1).toISOString(),
    ...overrides,
  };
}

describe('getAnnualCost', () => {
  it('uses the frequency multiplier for each period', () => {
    expect(getAnnualCost(subscription({ amount: 10, frequency: 'weekly' }))).toBe(520);
    expect(getAnnualCost(subscription({ amount: 10, frequency: 'biweekly' }))).toBe(260);
    expect(getAnnualCost(subscription({ amount: 10, frequency: 'monthly' }))).toBe(120);
    expect(getAnnualCost(subscription({ amount: 10, frequency: 'bimonthly' }))).toBe(60);
    expect(getAnnualCost(subscription({ amount: 10, frequency: 'quarterly' }))).toBe(40);
    expect(getAnnualCost(subscription({ amount: 10, frequency: 'yearly' }))).toBe(10);
  });
});

describe('getNextChargeDate', () => {
  it('advances from the last linked payment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 20));

    const next = getNextChargeDate(
      subscription({
        frequency: 'monthly',
        lastTransaction: {
          id: 'tx-1',
          amount: -9.99,
          date: new Date(2026, 0, 15).toISOString(),
          description: 'Netflix',
        },
      })
    );

    expect(next?.getFullYear()).toBe(2026);
    expect(next?.getMonth()).toBe(1);
    expect(next?.getDate()).toBe(15);
  });

  it('keeps advancing until the date is in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 1));

    const next = getNextChargeDate(
      subscription({
        frequency: 'weekly',
        lastTransaction: {
          id: 'tx-1',
          amount: -9.99,
          date: new Date(2026, 0, 1).toISOString(),
          description: 'Netflix',
        },
      })
    );

    expect(next?.getFullYear()).toBe(2026);
    expect(next?.getMonth()).toBe(2);
    expect(next?.getDate()).toBe(5);
  });

  it('falls back to createdAt when there is no linked payment', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));

    const next = getNextChargeDate(
      subscription({ frequency: 'yearly', createdAt: new Date(2025, 5, 10).toISOString() })
    );

    expect(next?.getFullYear()).toBe(2026);
    expect(next?.getMonth()).toBe(5);
    expect(next?.getDate()).toBe(10);
  });
});
