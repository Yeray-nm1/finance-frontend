import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import type { Transaction } from "@/types/transactions";

export interface TransactionsMobileListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  loading: boolean;
  hasActiveFilters: boolean;
  selectedIds: Set<string>;
  sortBy: string;
  sortOrder: string;
  onSort: (field: "date" | "amount" | "description") => void;
  onOpenEdit: (tx: Transaction) => void;
  onDeleteClick: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}
