import type { BudgetItem, CategorySpendingItem } from "@/types/dashboard";

export interface BudgetOverviewCardProps {
  budgets: Array<BudgetItem>;
  spending: Array<CategorySpendingItem>;
  monthValue: string;
}
