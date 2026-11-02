import type { Category } from "@/types/categories";
import type { CategoryAllocation } from "@/types/budgets";

export interface BudgetCategoryDetailsProps {
  readonly categories: readonly Category[];
  readonly selectedType: string | undefined;
  readonly typeAllocations: readonly { readonly type: string; readonly percentage: number }[];
  readonly categoryAllocations: readonly CategoryAllocation[];
  readonly onPercentageChange: (type: string, percentage: number) => void;
  readonly onCategoryAmountChange: (categoryId: string, amount: number) => void;
  readonly totalIncome: number;
  readonly remaining: number;
  readonly saveError: string | null;
  readonly onOpenEditCategory: (cat: Category) => void;
  readonly onDeleteCategory: (cat: Category) => void;
  readonly onAddCategory: () => void;
}
