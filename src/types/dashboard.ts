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
