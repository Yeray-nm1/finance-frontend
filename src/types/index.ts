export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'checking' | 'savings';
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'needs' | 'leisure' | 'savings' | 'other';
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string | null;
  categoryId: string | null;
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  createdAt: string;
  account?: { id: string; name: string; type: string };
  category?: { id: string; name: string; type: string };
}

export interface CreateTransactionDTO {
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  accountId?: string;
  categoryId?: string;
}

export interface BudgetWithCategory {
  id: string;
  userId: string;
  categoryId: string;
  percentage: number;
  createdAt: string;
  category: Category;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  confidence: number;
  source: 'manual' | 'detected';
  createdAt: string;
}

export interface SubscriptionCandidate {
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  confidence: number;
}

export interface DashboardResponse {
  balance: {
    income: number;
    expenses: number;
    savings: number;
    available: number;
    balance: number;
    vsPreviousMonth?: number;
  };
  budgets: Array<{
    category: string;
    percentage: number;
    spent: number;
    budgeted: number;
    progress: number;
    status: 'ok' | 'warning' | 'over';
  }>;
  recurring: {
    manual: Array<{
      name: string;
      amount: number;
      frequency: string;
      status: string;
    }>;
    detected: Array<{
      name: string;
      amount: number;
      frequency: string;
      status: 'stable' | 'variable';
    }>;
  };
  transactions: Array<{
    id: string;
    date: string;
    amount: number;
    description: string;
    type: 'income' | 'expense' | 'transfer';
    category: string | null;
    account: string | null;
  }>;
}
