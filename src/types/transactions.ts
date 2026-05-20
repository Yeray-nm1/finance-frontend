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

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'date' | 'amount' | 'description';
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateTransactionDTO {
  description?: string;
  type?: 'income' | 'expense' | 'transfer';
  amount?: number;
  date?: string;
  categoryId?: string | null;
  accountId?: string | null;
}
