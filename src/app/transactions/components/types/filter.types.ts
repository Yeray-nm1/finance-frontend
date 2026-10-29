import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import type { Subscription } from "@/types/subscriptions";
import type { TransactionType } from "@/types/transactions";

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
}

export interface CalendarFilterProps {
  dateFrom?: Date;
  dateTo?: Date;
  onChange: (dates: { from?: Date; to?: Date }) => void;
}

export interface SubscriptionFilterProps {
  subscriptionIds: string[];
  subscriptions: Subscription[];
  onChange: (ids: string[]) => void;
}

export interface TransactionsFiltersProps {
  filterType: "" | TransactionType;
  filterCategoryId: string;
  filterAccountId: string;
  filterSearch: string;
  filterSubscriptionIds: string[];
  filterDates: { from?: Date; to?: Date };
  accounts: Account[];
  categories: Category[];
  subscriptions: Subscription[];
  hasActiveFilters: boolean;
  onFilterTypeChange: (value: "" | TransactionType) => void;
  onFilterCategoryIdChange: (value: string) => void;
  onFilterAccountIdChange: (value: string) => void;
  onFilterSearchChange: (value: string) => void;
  onFilterSubscriptionIdsChange: (value: string[]) => void;
  onFilterDatesChange: (dates: { from?: Date; to?: Date }) => void;
  onClearFilters: () => void;
}
