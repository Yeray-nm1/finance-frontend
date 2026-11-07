import type { CategoryType } from './categories';
import type { TransactionType } from './transactions';

export interface BudgetItem {
  categoryId: string | null;
  category: string;
  categoryType: CategoryType;
  percentage: number;
  spent: number;
  budgeted: number;
  progress: number;
  status: 'ok' | 'warning' | 'over';
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

export interface CategorySpendingItem {
  categoryId: string | null;
  category: string;
  categoryType: CategoryType | null;
  amount: number;
  percentage: number;
}

export interface MonthlyEvolutionItem {
  year: number;
  month: number;
  income: number;
  expenses: number;
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
  categorySpending?: CategorySpendingItem[];
  monthlyEvolution?: MonthlyEvolutionItem[];
}
