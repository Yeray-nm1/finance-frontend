import type { CategoryType } from './categories';
import type { TransactionType } from './transactions';

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
  type: TransactionType;
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
