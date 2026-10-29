import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import type { Transaction } from "@/types/transactions";

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
