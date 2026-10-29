import type { Transaction } from "@/types/transactions";
import type { Category } from "@/types/categories";
import type { Account } from "@/types/accounts";

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
