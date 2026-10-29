import { Home, PartyPopper, PiggyBank, Package } from "lucide-react";

export const DOT_COLORS: Record<string, string> = {
  ok: "bg-income",
  warning: "bg-warning",
  over: "bg-expense",
};

export const typeIcons: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  needs: { icon: <Home size={16} />, bg: "bg-amber-100", color: "text-amber-700" },
  leisure: { icon: <PartyPopper size={16} />, bg: "bg-pink-100", color: "text-pink-700" },
  savings: { icon: <PiggyBank size={16} />, bg: "bg-green-100", color: "text-green-700" },
  other: { icon: <Package size={16} />, bg: "bg-sky-100", color: "text-sky-700" },
};

export function getProgressAccent(progress: number): string {
  if (progress > 100) return "var(--color-expense)";
  if (progress >= 80) return "var(--color-warning)";
  return "var(--color-income)";
}

export function getBudgetBadgeStyle(editingBudget: boolean, hasBudget: boolean): string {
  if (editingBudget) return "bg-warning/15 text-warning";
  if (hasBudget) return "bg-income/15 text-income";
  return "bg-bg-elevated text-text-muted";
}

export function getValidationColor(isValid: boolean): string {
  return isValid ? "text-income" : "text-expense";
}

export function getValidationBg(isValid: boolean): string {
  return isValid ? "bg-income/5 text-income" : "bg-expense/5 text-expense";
}
