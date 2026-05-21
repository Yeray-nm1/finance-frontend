export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
] as const;

export type { User } from './auth';
export type { Account } from './accounts';
export type { Category, CategoryType, CategoryTypeConfig } from './categories';
export { CATEGORY_TYPES, CATEGORY_CONFIGS } from './categories';
export type { Transaction, CreateTransactionDTO, TransactionFilters, UpdateTransactionDTO } from './transactions';
export type { MonthlyBudget, BudgetWithCategory, BudgetDraft, BudgetTypeAllocation, IncomeGroup, IncomeCandidateItem } from './budgets';
export type { Subscription, SubscriptionCandidate } from './subscriptions';
export type { DashboardResponse } from './dashboard';
