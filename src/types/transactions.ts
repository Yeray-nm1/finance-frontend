export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string | null;
  categoryId: string | null;
  date: string;
  amount: number;
  description: string;
  type: TransactionType;
  isSubscription: boolean;
  subscriptionId?: string | null;
  createdAt: string;
  account?: { id: string; name: string; type: string };
  category?: { id: string; name: string; type: string };
}

export interface CreateTransactionDTO {
  date: string;
  amount: number;
  description: string;
  type: TransactionType;
  accountId?: string;
  categoryId?: string;
  isSubscription?: boolean;
}

export interface UpdateTransactionDTO {
  description?: string;
  type?: TransactionType;
  amount?: number;
  date?: string;
  categoryId?: string | null;
  accountId?: string | null;
  isSubscription?: boolean;
}
