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
  type: CategoryType;
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

export const CATEGORY_TYPES = ['needs', 'leisure', 'savings', 'other'] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
] as const;

export interface CategoryTypeConfig {
  type: CategoryType;
  label: string;
  description: string;
  color: string;
  accent: string;
  textAccent: string;
}

export const CATEGORY_CONFIGS: CategoryTypeConfig[] = [
  { type: "needs", label: "Necesidades", description: "Gastos esenciales", color: "from-emerald-50 to-emerald-100", accent: "bg-emerald-600", textAccent: "text-emerald-700" },
  { type: "leisure", label: "Ocio", description: "Entretenimiento", color: "from-violet-50 to-violet-100", accent: "bg-violet-600", textAccent: "text-violet-700" },
  { type: "savings", label: "Ahorro", description: "Ahorros e inversiones", color: "from-blue-50 to-blue-100", accent: "bg-blue-600", textAccent: "text-blue-700" },
  { type: "other", label: "Otros", description: "Gastos varios", color: "from-amber-50 to-amber-100", accent: "bg-amber-600", textAccent: "text-amber-700" },
];

export interface BudgetTypeAllocation {
  id: string;
  budgetId: string;
  categoryType: CategoryType;
  percentage: number;
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  month: number;
  year: number;
  totalIncome: number;
  createdAt: string;
  updatedAt: string;
  typeAllocations: BudgetTypeAllocation[];
}

export interface BudgetDraft {
  exists: boolean;
  budget: MonthlyBudget | null;
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
