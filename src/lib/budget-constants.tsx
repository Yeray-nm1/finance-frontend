import { getBudgetBadgeStyle } from "@/components/ui/variants/budget.variants";

export const typeLabels: Record<string, string> = {
  needs: "Necesidades",
  leisure: "Ocio",
  savings: "Ahorro",
  other: "Otros",
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

export function getBudgetBadge(editingBudget: boolean, budget: unknown) {
  const style = getBudgetBadgeStyle(editingBudget, !!budget);
  if (editingBudget) return { text: "Editando", className: style };
  if (budget) return { text: "En uso", className: style };
  return { text: "Sin presupuesto", className: style };
}

