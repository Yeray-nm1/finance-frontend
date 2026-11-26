import type { SavingsGoal } from "@/types/goals";
import type { Transaction } from "@/types/transactions";

export interface AccountSummary {
  readonly balances: Readonly<Record<string, number>>;
  readonly unassigned: readonly Transaction[];
  readonly recentByAccount: Readonly<Record<string, readonly Transaction[]>>;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildAccountSummary(transactions: readonly Transaction[]): AccountSummary {
  const sorted = [...transactions].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date)
  );
  const balances: Record<string, number> = {};
  const recentByAccount: Record<string, Transaction[]> = {};

  for (const transaction of sorted) {
    if (!transaction.accountId) continue;

    balances[transaction.accountId] = roundCurrency(
      (balances[transaction.accountId] ?? 0) + transaction.amount
    );

    if (!recentByAccount[transaction.accountId]) {
      recentByAccount[transaction.accountId] = [];
    }
    if (recentByAccount[transaction.accountId].length < 3) {
      recentByAccount[transaction.accountId].push(transaction);
    }
  }

  return {
    balances,
    unassigned: sorted.filter((transaction) => !transaction.accountId),
    recentByAccount,
  };
}

export function formatMovementDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function getLinkedGoal(
  goals: readonly SavingsGoal[],
  accountId: string | null
): SavingsGoal | null {
  if (!accountId) return null;
  return (
    goals.find((goal) => goal.accountId === accountId && !goal.isArchived) ?? null
  );
}
