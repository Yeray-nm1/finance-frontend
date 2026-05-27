import type { Account } from "./accounts";
import type { Category } from "./categories";
import type { Subscription } from "./subscriptions";

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

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  subscriptionIds?: string;
  sortBy?: 'date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionsFiltersProps {
  filterType: "" | "income" | "expense" | "transfer";
  filterCategoryId: string;
  filterAccountId: string;
  filterSearch: string;
  filterSubscriptionIds: string[];
  filterDates: { from?: Date; to?: Date };
  accounts: Account[];
  categories: Category[];
  subscriptions: Subscription[];
  hasActiveFilters: boolean;
  onFilterTypeChange: (value: "" | "income" | "expense" | "transfer") => void;
  onFilterCategoryIdChange: (value: string) => void;
  onFilterAccountIdChange: (value: string) => void;
  onFilterSearchChange: (value: string) => void;
  onFilterSubscriptionIdsChange: (value: string[]) => void;
  onFilterDatesChange: (dates: { from?: Date; to?: Date }) => void;
  onClearFilters: () => void;
}
