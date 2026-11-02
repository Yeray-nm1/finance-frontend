import type { Category } from "@/types/categories";
import type { CategoryAllocation } from "@/types/budgets";

export interface BudgetReadOnlyViewProps {
  totalIncome: number;
  typeAllocations: readonly { readonly type: string; readonly percentage: number }[];
  categoryAllocations: readonly CategoryAllocation[];
  categories: readonly Category[];
}
