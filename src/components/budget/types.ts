import type { Category } from "@/types/categories";

export interface BudgetDetailsProps {
  readonly totalIncome: number;
  readonly onTotalIncomeChange: (value: number) => void;
  readonly typeAllocations: readonly { readonly type: string; readonly percentage: number }[];
  readonly selectedType: string;
  readonly onSelectType: (type: string) => void;
  readonly totalAllocated: number;
  readonly isValidTotal: boolean;
  readonly onCalculateIncome?: () => void;
  readonly calculatingIncome?: boolean;
  readonly onSave?: () => void;
  readonly saving?: boolean;
  readonly canSave?: boolean;
}

export interface BudgetCategoryDetailsProps {
  readonly categories: readonly Category[];
  readonly selectedType: string;
  readonly typeAllocations: readonly { readonly type: string; readonly percentage: number }[];
  readonly onPercentageChange: (type: string, percentage: number) => void;
  readonly totalIncome: number;
  readonly saveError: string | null;
  readonly onOpenEditCategory: (cat: Category) => void;
  readonly onDeleteCategory: (cat: Category) => void;
  readonly onAddCategory: () => void;
}
