import type { Category } from "@/types/categories";

export interface BudgetCategoryDetailsProps {
  readonly categories: readonly Category[];
  readonly selectedType: string | undefined;
  readonly typeAllocations: readonly { readonly type: string; readonly percentage: number }[];
  readonly onPercentageChange: (type: string, percentage: number) => void;
  readonly totalIncome: number;
  readonly saveError: string | null;
  readonly onOpenEditCategory: (cat: Category) => void;
  readonly onDeleteCategory: (cat: Category) => void;
  readonly onAddCategory: () => void;
}
