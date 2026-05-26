import type { Category, CategoryType } from './categories';

export interface IncomeCandidateItem {
  id: string;
  date: string;
  amount: number;
  description: string;
}

export interface IncomeGroup {
  label: string;
  count: number;
  totalAmount: number;
  transactions: IncomeCandidateItem[];
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  month: number;
  year: number;
  totalIncome: number;
  createdAt: string;
  updatedAt: string;
  typeAllocations: Array<{ type: string; percentage: number }>;
}

export interface BudgetWithCategory {
  id: string;
  userId: string;
  categoryId: string;
  percentage: number;
  createdAt: string;
  category: Category;
}

export interface BudgetTypeAllocation {
  id: string;
  budgetId: string;
  categoryType: CategoryType;
  percentage: number;
}

export interface BudgetDraft {
  exists: boolean;
  budget: MonthlyBudget | null;
}

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
  readonly onCancel?: () => void;
  readonly saving?: boolean;
  readonly canSave?: boolean;
}

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

export interface BudgetHeaderProps {
  monthLabel: string;
  badge: { text: string; className: string };
  canGoBack: boolean;
  canGoForward: boolean;
  showEditButton: boolean;
  editButtonLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onStartEdit: () => void;
}

export interface BudgetReadOnlyViewProps {
  totalIncome: number;
  typeAllocations: readonly { readonly type: string; readonly percentage: number }[];
  categories: readonly Category[];
}

export interface DeleteCategoryDialogProps {
  open: boolean;
  categoryName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export interface EditCategoryDialogProps {
  open: boolean;
  category: { id: string; name: string } | null;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}

export interface IncomeReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: IncomeGroup[];
  onConfirm: (selectedTotal: number) => void;
}

export interface GroupListProps {
  isEmpty: boolean;
  filteredGroups: IncomeGroup[];
  monthName: string;
  prevYear: number;
  checked: Set<string>;
  expanded: Set<string>;
  onToggleGroup: (label: string) => void;
  onToggleExpand: (label: string) => void;
}
