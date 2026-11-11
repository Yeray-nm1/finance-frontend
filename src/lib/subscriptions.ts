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
