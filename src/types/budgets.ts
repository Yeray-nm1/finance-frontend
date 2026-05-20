import type { Category, CategoryType } from './categories';

export interface IncomeCandidateItem {
  id: string;
  date: string;
  amount: number;
  description: string;
}

export interface IncomeGroup {
  label: string;
  count: number;
  totalAmount: number;
  transactions: IncomeCandidateItem[];
}

export interface MonthlyBudget {
  id: string;
  userId: string;
  month: number;
  year: number;
  totalIncome: number;
  createdAt: string;
  updatedAt: string;
  typeAllocations: Array<{ type: string; percentage: number }>;
}

export interface BudgetWithCategory {
  id: string;
  userId: string;
  categoryId: string;
  percentage: number;
  createdAt: string;
  category: Category;
}

export interface BudgetTypeAllocation {
  id: string;
  budgetId: string;
  categoryType: CategoryType;
  percentage: number;
}

export interface BudgetDraft {
  exists: boolean;
  budget: MonthlyBudget | null;
}
