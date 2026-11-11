import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import type { Subscription } from "@/types/subscriptions";
import type { TransactionType } from "@/types/transactions";
import type { TransactionFlow } from "@/types/filter";

export interface SortableHeaderProps {
  field: string;
  label: string;
  sortBy: string;
  sortOrder: string;
  onSort: (field: "date" | "amount" | "description") => void;
  textRight?: boolean;
}

export interface SelectFilterOption {
  value: string;
  label: string;
}

export interface SelectFilterProps {
  value: string;
  placeholder: string;
  options: SelectFilterOption[];
  onChange: (value: string) => void;
  width?: string;
  clearLabel?: string;
  disabled?: boolean;
}

export interface CalendarFilterProps {
  dateFrom?: Date;
  dateTo?: Date;
  onChange: (dates: { from?: Date; to?: Date }) => void;
}

export interface MultiSelectFilterProps {
  values: string[];
  placeholder: string;
  options: SelectFilterOption[];
  onChange: (values: string[]) => void;
  width?: string;
  disabled?: boolean;
  emptyLabel?: string;
}

export interface MultiSelectTagsProps {
  values: string[];
  options: SelectFilterOption[];
  onChange: (values: string[]) => void;
}

export interface TransactionsFiltersProps {
  filterType: "" | TransactionType;
  filterFlow: "" | TransactionFlow;
  filterCategoryIds: string[];
  filterAccountIds: string[];
  filterSearch: string;
  filterSubscriptionIds: string[];
  filterDates: { from?: Date; to?: Date };
  accounts: Account[];
  categories: Category[];
  subscriptions: Subscription[];
  hasActiveFilters: boolean;
  isDefaultSort: boolean;
  onFilterTypeChange: (value: "" | TransactionType) => void;
  onFilterCategoryIdsChange: (values: string[]) => void;
  onFilterAccountIdsChange: (values: string[]) => void;
  onFilterSearchChange: (value: string) => void;
  onFilterSubscriptionIdsChange: (value: string[]) => void;
  onFilterDatesChange: (dates: { from?: Date; to?: Date }) => void;
  onResetSort: () => void;
  onClearFilters: () => void;
}
