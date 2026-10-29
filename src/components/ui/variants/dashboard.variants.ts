export const DONUT_COLORS = {
  expenses: "var(--color-expense)",
  savings: "var(--color-savings)",
  available: "var(--color-available)",
} as const;

export function getBalanceColor(value: number): string {
  return value >= 0 ? "text-income" : "text-expense";
}
