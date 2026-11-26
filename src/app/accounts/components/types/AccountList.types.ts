import type { Account } from "@/types/accounts";

export interface AccountListProps {
  readonly accounts: readonly Account[];
  readonly balances: Readonly<Record<string, number>>;
  readonly selectedId: string | null;
  readonly onSelectAccount: (id: string) => void;
}
