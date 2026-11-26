import type { Account } from "@/types/accounts";
import type { SavingsGoal } from "@/types/goals";
import type { Transaction } from "@/types/transactions";

export interface AccountDetailProps {
  readonly account: Account;
  readonly balance: number;
  readonly goal: SavingsGoal | null;
  readonly movements: readonly Transaction[];
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onImport: () => void;
}
