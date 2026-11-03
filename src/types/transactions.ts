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

export interface ImportCsvResult {
  imported: number;
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
  errors: Array<{ row: number; reason: string }>;
}

export type CsvField = 'date' | 'amount' | 'description' | 'type';

export type CsvMapping = Record<CsvField, string | null>;

export type CsvRowStatus = 'ok' | 'error' | 'duplicate';

export interface CsvPreviewRow {
  row: number;
  date: string | null;
  amount: number | null;
  description: string;
  type: TransactionType;
  status: CsvRowStatus;
  reason?: string;
}

export interface CsvPreviewResult {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  rows: CsvPreviewRow[];
  truncated: boolean;
  errors: Array<{ row: number; reason: string }>;
  mapping: CsvMapping;
  detected: {
    date: string | null;
    amount: string | null;
  };
}
