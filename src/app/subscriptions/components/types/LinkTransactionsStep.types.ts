import type { PendingLink, SearchTx } from "@/types/subscriptions";

export interface LinkTransactionsStepProps {
  name: string;
  pendingLinks: PendingLink[];
  searchResults: SearchTx[];
  searchLoading: boolean;
  searchError: string | null;
  error: string | null;
  saving: boolean;
  saveLabel: string;
  savingLabel: string;
  onSearch: () => void;
  onLinkAll: () => void;
  onAddPending: (txId: string, txDescription: string, txAmount: number, txDate: string) => void;
  onRemovePending: (txId: string) => void;
  onBack: () => void;
  onSave: () => void;
}
