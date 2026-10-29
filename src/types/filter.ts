import type { TransactionType } from "./transactions";

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  subscriptionIds?: string;
  sortBy?: 'date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
}
