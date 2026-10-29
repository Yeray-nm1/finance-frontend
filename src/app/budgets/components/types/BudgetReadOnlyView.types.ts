import type { Category } from "@/types/categories";

export interface BudgetReadOnlyViewProps {
  totalIncome: number;
  typeAllocations: readonly { readonly type: string; readonly percentage: number }[];
  categories: readonly Category[];
}
