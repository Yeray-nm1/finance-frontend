import type { BudgetItem, CategorySpendingItem } from "@/types/dashboard";

export interface BudgetOverviewCardProps {
  budgets: Array<BudgetItem>;
  spending: Array<CategorySpendingItem>;
  monthValue: string;
  /** En escritorio, ocupa la altura de la tarjeta vecina sin estirar la fila del grid. */
  fillRow?: boolean;
}
