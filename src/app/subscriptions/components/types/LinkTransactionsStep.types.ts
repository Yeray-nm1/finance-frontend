import type { SearchTx } from '@/types/subscriptions';

export interface LinkTransactionsStepProps {
  title: string;
  name: string;
  searchQuery: string;
  searchResults: SearchTx[];
  selectedIds: string[];
  searchLoading: boolean;
  searchError: string | null;
  error: string | null;
  saving: boolean;
  saveLabel: string;
  savingLabel: string;
  referenceAmount: number;
  nextChargeLabel: string | null;
  onSearchQueryChange: (value: string) => void;
  onSearch: () => void;
  onToggle: (tx: SearchTx) => void;
  onBack: () => void;
  onSave: () => void;
  onSaveWithoutLinks: () => void;
}
