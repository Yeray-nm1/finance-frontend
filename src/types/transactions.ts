import type { ReactNode } from "react";
import type { Account } from "./accounts";
import type { Category } from "./categories";

export interface Transaction {
  id: string;
  userId: string;
  accountId: string | null;
  categoryId: string | null;
  date: string;
  amount: number;
  description: string;
  type: 'income' | 'expense' | 'transfer';
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
  type: 'income' | 'expense' | 'transfer';
  accountId?: string;
  categoryId?: string;
  isSubscription?: boolean;
}

export interface EditableTextCellProps {
  value: string;
  isEditing: boolean;
  editValue: string;
  savingField: boolean;
  onStartEdit: () => void;
  onEditValueChange: (value: string) => void;
  onCancelEdit: () => void;
  onInlineEdit: (value: string) => void;
  className?: string;
  displayClassName?: string;
}

export interface EditableSelectOption {
  value: string;
  label: string;
}

export interface EditableSelectCellProps {
  value: string;
  display: ReactNode;
  isEditing: boolean;
  editValue: string;
  savingField: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onInlineEdit: (value: string) => void;
  options: EditableSelectOption[];
  className?: string;
  displayClassName?: string;
}

export interface TransactionRowProps {
  tx: Transaction;
  categories: Category[];
  accounts: Account[];
  editingId: string | null;
  editingField: string | null;
  editValue: string;
  savingField: boolean;
  onStartEdit: (txId: string, field: string, value: string) => void;
  onEditValueChange: (value: string) => void;
  onCancelEdit: () => void;
  onInlineEdit: (tx: Transaction, field: string, value: string) => void;
  onOpenEdit: (tx: Transaction) => void;
  onDeleteClick: (id: string) => void;
}

export interface SortIconProps {
  field: string;
  sortBy: string;
  sortOrder: string;
}

export interface TransactionsTableProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  loading: boolean;
  sortBy: string;
  sortOrder: string;
  editingId: string | null;
  editingField: string | null;
  editValue: string;
  savingField: boolean;
  hasActiveFilters: boolean;
  onSort: (field: "date" | "amount" | "description") => void;
  onStartEdit: (txId: string, field: string, value: string) => void;
  onEditValueChange: (value: string) => void;
  onCancelEdit: () => void;
  onInlineEdit: (tx: Transaction, field: string, value: string) => void;
  onOpenEdit: (tx: Transaction) => void;
  onDeleteClick: (id: string) => void;
}

export interface TransactionsPaginationProps {
  page: number;
  total: number;
  limit: number;
  totalPages: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export interface ToastMessageProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export interface TransactionFormProps {
  newDate: string;
  newType: "income" | "expense" | "transfer";
  newAmount: string;
  newDescription: string;
  newAccountId: string;
  newCategoryId: string;
  newIsSubscription: boolean;
  editTxId: string | null;
  accounts: Account[];
  categories: Category[];
  saving: boolean;
  onDateChange: (date: string) => void;
  onTypeChange: (type: "income" | "expense" | "transfer") => void;
  onAmountChange: (amount: string) => void;
  onDescriptionChange: (description: string) => void;
  onAccountIdChange: (accountId: string) => void;
  onCategoryIdChange: (categoryId: string) => void;
  onIsSubscriptionChange: (isSubscription: boolean) => void;
  onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
}

export interface UpdateTransactionDTO {
  description?: string;
  type?: 'income' | 'expense' | 'transfer';
  amount?: number;
  date?: string;
  categoryId?: string | null;
  accountId?: string | null;
  isSubscription?: boolean;
}
