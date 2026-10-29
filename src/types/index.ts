export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type { User } from './auth';
export type { Account } from './accounts';
export type { Category, CategoryType } from './categories';
export { CATEGORY_TYPES } from '@/lib/constants';
export type { Transaction, CreateTransactionDTO, UpdateTransactionDTO } from './transactions';
export type { TransactionFilters } from './filter';
export type { MonthlyBudget, BudgetWithCategory, IncomeGroup, IncomeCandidateItem } from './budgets';
export type { Subscription, SubscriptionCandidate } from './subscriptions';
export type { DashboardResponse } from './dashboard';
