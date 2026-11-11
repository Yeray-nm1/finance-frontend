import type { TransactionType } from "./transactions";

export type TransactionFlow = 'expense' | 'income' | 'savings';

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: TransactionType;
  flow?: TransactionFlow;
  categoryId?: string;
  uncategorized?: boolean;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  subscriptionIds?: string;
  sortBy?: 'date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
}
