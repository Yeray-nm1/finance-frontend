import { addDays, addMonths } from "date-fns";
import type { Subscription } from "@/types/subscriptions";

const ANNUAL_MULTIPLIERS: Record<Subscription["frequency"], number> = {
  weekly: 52,
  biweekly: 26,
  monthly: 12,
  bimonthly: 6,
  quarterly: 4,
  yearly: 1,
};

const NEXT_CHARGE_STEPS: Record<Subscription["frequency"], { months: number; days: number }> = {
  weekly: { months: 0, days: 7 },
  biweekly: { months: 0, days: 14 },
  monthly: { months: 1, days: 0 },
  bimonthly: { months: 2, days: 0 },
  quarterly: { months: 3, days: 0 },
  yearly: { months: 12, days: 0 },
};

export function getAnnualCost(
  subscription: Pick<Subscription, "amount" | "frequency">
): number {
  const multiplier = ANNUAL_MULTIPLIERS[subscription.frequency] ?? 12;
  return subscription.amount * multiplier;
}

export function getNextChargeDate(
  subscription: Pick<Subscription, "frequency" | "createdAt" | "lastTransaction">
): Date | null {
  const base = subscription.lastTransaction?.date ?? subscription.createdAt;
  if (!base) return null;

  const parsed = new Date(base);
  if (Number.isNaN(parsed.getTime())) return null;

  const step = NEXT_CHARGE_STEPS[subscription.frequency] ?? NEXT_CHARGE_STEPS.monthly;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = advance(parsed, step);
  let guard = 0;
  while (next < today && guard < 500) {
    next = advance(next, step);
    guard += 1;
  }

  return next;
}

function advance(date: Date, step: { months: number; days: number }): Date {
  if (step.months > 0) return addMonths(date, step.months);
  return addDays(date, step.days);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Días naturales entre hoy y una fecha (0 si es hoy). */
export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000);
}

const STALE_MONTHS = 6;

/** Primer cobro de las activas, con el importe y el número de pagos de ese día. */
export function getUpcomingCharge(
  subscriptions: readonly Subscription[]
): { date: Date; amount: number; count: number } | null {
  const byDay = new Map<number, { date: Date; amount: number; count: number }>();

  for (const subscription of subscriptions) {
    if (subscription.active === false) continue;
    const next = getNextChargeDate(subscription);
    if (!next) continue;

    const key = startOfDay(next).getTime();
    const entry = byDay.get(key) ?? { date: next, amount: 0, count: 0 };
    entry.amount += subscription.amount;
    entry.count += 1;
    byDay.set(key, entry);
  }

  let upcoming: { date: Date; amount: number; count: number } | null = null;
  for (const entry of byDay.values()) {
    if (!upcoming || entry.date < upcoming.date) upcoming = entry;
  }
  if (!upcoming) return null;

  return {
    date: upcoming.date,
    amount: Math.round(upcoming.amount * 100) / 100,
    count: upcoming.count,
  };
}

/** Activas cuyo último cobro es anterior al límite (o que nunca han cobrado). */
export function getStaleSubscriptions(
  subscriptions: readonly Subscription[],
  now: Date = new Date(),
  months = STALE_MONTHS
): Subscription[] {
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());

  return subscriptions.filter((subscription) => {
    if (subscription.active === false) return false;
    const last = subscription.lastTransaction?.date ?? subscription.createdAt;
    const parsed = new Date(last);
    return Number.isNaN(parsed.getTime()) ? true : parsed < cutoff;
  });
}

/** Mes del límite de actividad, para el aviso «sin cobros desde ...». */
export function staleSinceLabel(now: Date = new Date(), months = STALE_MONTHS): string {
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  return new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(cutoff);
}
