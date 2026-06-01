import { Home, PartyPopper, PiggyBank, Package } from "lucide-react";
export { formatCurrency } from "@/lib/format";

export const typeLabels: Record<string, string> = {
  needs: "Necesidades",
  leisure: "Ocio",
  savings: "Ahorro",
  other: "Otros",
};

export const typeIcons: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  needs: { icon: <Home size={16} />, bg: "bg-amber-100", color: "text-amber-700" },
  leisure: { icon: <PartyPopper size={16} />, bg: "bg-pink-100", color: "text-pink-700" },
  savings: { icon: <PiggyBank size={16} />, bg: "bg-green-100", color: "text-green-700" },
  other: { icon: <Package size={16} />, bg: "bg-sky-100", color: "text-sky-700" },
};

export const typeBg: Record<string, string> = {
  needs: "bg-amber-100",
  leisure: "bg-pink-100",
  savings: "bg-green-100",
  other: "bg-sky-100",
};

export const DEFAULT_ALLOCATIONS = [
  { type: "needs", percentage: 50 },
  { type: "leisure", percentage: 20 },
  { type: "savings", percentage: 15 },
  { type: "other", percentage: 15 },
];

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const DOT_COLORS: Record<string, string> = {
  ok: "bg-income",
  warning: "bg-amber-400",
  over: "bg-expense",
};

export function getProgressAccent(progress: number): string {
  if (progress > 100) return "#dc2626";
  if (progress >= 80) return "#fbbf24";
  return "#059669";
}

export function getBudgetBadge(editingBudget: boolean, budget: unknown) {
  if (editingBudget) return { text: "Editando", className: "bg-amber-100 text-amber-700" };
  if (budget) return { text: "En uso", className: "bg-green-100 text-green-700" };
  return { text: "Sin presupuesto", className: "bg-gray-100 text-gray-500" };
}

