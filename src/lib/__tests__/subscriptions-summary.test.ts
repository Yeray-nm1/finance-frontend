import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  daysUntil,
  getStaleSubscriptions,
  getUpcomingCharge,
  staleSinceLabel,
} from '@/lib/subscriptions';
import type { Subscription } from '@/types/subscriptions';

afterEach(() => {
  vi.useRealTimers();
});

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    userId: 'user-1',
    name: 'Netflix',
    amount: 10,
    frequency: 'monthly',
    kind: 'subscription',
    estimated: false,
    matchDescriptions: [],
    amountTolerance: 10,
    active: true,
    createdAt: new Date(2026, 0, 1).toISOString(),
    ...overrides,
  };
}

function lastCharge(iso: string) {
  return { id: 'tx-1', amount: -10, date: iso, description: 'Netflix' };
}

describe('daysUntil', () => {
  it('cuenta los días naturales hasta la fecha', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 21, 15));

    expect(daysUntil(new Date(2026, 10, 27))).toBe(6);
    expect(daysUntil(new Date(2026, 10, 21))).toBe(0);
  });
});

describe('getUpcomingCharge', () => {
  it('agrupa los pagos del primer día de cobro y suma su importe', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 21, 12));

    const upcoming = getUpcomingCharge([
      subscription({ id: 'a', amount: 11.99, lastTransaction: lastCharge(new Date(2026, 9, 27).toISOString()) }),
      subscription({ id: 'b', amount: 10, lastTransaction: lastCharge(new Date(2026, 9, 27).toISOString()) }),
      subscription({ id: 'c', amount: 4.99, lastTransaction: lastCharge(new Date(2026, 9, 3).toISOString()) }),
    ]);

    expect(upcoming?.count).toBe(2);
    expect(upcoming?.amount).toBeCloseTo(21.99);
    expect(upcoming?.date.getDate()).toBe(27);
    expect(upcoming?.date.getMonth()).toBe(10);
  });

  it('ignora las suscripciones canceladas y devuelve null si no hay cobros', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 21, 12));

    expect(getUpcomingCharge([subscription({ active: false })])).toBeNull();
  });
});

describe('getStaleSubscriptions', () => {
  it('detecta activas sin cobros en los últimos seis meses', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 21, 12));

    const stale = subscription({
      id: 'old',
      lastTransaction: lastCharge(new Date(2026, 4, 10).toISOString()),
    });
    const recent = subscription({
      id: 'recent',
      lastTransaction: lastCharge(new Date(2026, 5, 25).toISOString()),
    });
    const cancelled = subscription({
      id: 'cancelled',
      active: false,
      lastTransaction: lastCharge(new Date(2026, 0, 10).toISOString()),
    });

    const result = getStaleSubscriptions([stale, recent, cancelled]);

    expect(result.map((item) => item.id)).toEqual(['old']);
  });

  it('cuenta como sin actividad las que nunca han tenido un cobro', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 21, 12));

    const result = getStaleSubscriptions([
      subscription({ createdAt: new Date(2026, 1, 1).toISOString() }),
    ]);

    expect(result).toHaveLength(1);
  });

  it('el mes del limite coincide con el del aviso', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 21, 12));

    expect(staleSinceLabel()).toBe('mayo');
  });
});
