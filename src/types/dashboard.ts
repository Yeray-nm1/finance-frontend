import type { CategoryType } from './categories';
import type { ReactNode } from 'react';

export interface BudgetItem {
  category: string;
  categoryType: CategoryType;
  percentage: number;
  spent: number;
  budgeted: number;
  progress: number;
  status: 'ok' | 'warning' | 'over';
}

export interface BudgetTypeItem {
  category: string;
  categoryType: CategoryType;
  spent: number;
  budgeted: number;
  progress: number;
  status: string;
}

export interface SubscriptionItem {
  name: string;
  amount: number;
  frequency: string;
  status: string;
  lastChargeDate: string | null;
  nextChargeDate: string | null;
}

export interface TransactionItem {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  category: string | null;
  account: string | null;
}

export interface DashboardResponse {
  balance: {
    income: number;
    expenses: number;
    savings: number;
    available: number;
    balance: number;
    vsPreviousMonth?: { percentage: number; amountDiff: number };
  };
  budgets: BudgetItem[];
  recurring: {
    manual: SubscriptionItem[];
  };
  transactions: TransactionItem[];
}

export interface BalanceCardProps {
  income: number;
  expenses: number;
  savings: number;
  available: number;
  balance: number;
  vsPreviousMonth?: { percentage: number; amountDiff: number };
}

export interface BudgetsCardProps {
  budgets: Array<BudgetItem>;
}

export interface BudgetTypeSectionHeaderProps {
  label: string;
  icon: ReactNode;
  collapsible: boolean;
  barProgress: number;
  progressAccent: string;
  isExpanded: boolean;
  spent?: number;
  budgeted?: number;
}

export interface BudgetTypeSectionProps {
  type: string;
  label: string;
  icon: ReactNode;
  budgets: Array<BudgetTypeItem>;
  isExpanded: boolean;
  onToggle: () => void;
  collapsible?: boolean;
  typeProgress?: number;
}

export interface DashboardErrorProps {
  error: string;
  onRetry: () => void;
}

export interface RecentTransactionsCardProps {
  transactions: Array<TransactionItem>;
}

export interface RecurringCardProps {
  subscriptions: Array<SubscriptionItem>;
}

export interface BalanceDonutProps {
  income: number;
  expenses: number;
  savings: number;
  available: number;
  balance: number;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percentage: number } }>;
}

export interface DashboardCardProps {
  title: string;
  emptyText: string;
  href: string;
  linkText: string;
  isEmpty: boolean;
  children: ReactNode;
}
