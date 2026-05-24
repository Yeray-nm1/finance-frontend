export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly';
  matchDescriptions: string[];
  amountTolerance: number;
  createdAt: string;
  lastTransaction?: {
    id: string;
    amount: number;
    date: string;
    description: string;
  };
  priceChanges?: PriceChange[];
}

export interface SubscriptionCandidate {
  name: string;
  amount: number;
  existingAmount?: number;
  frequency: string;
  confidence: number;
  transactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
  }>;
  exists: boolean;
}

export interface PriceChange {
  id: string;
  subscriptionId: string;
  transactionId: string;
  previousAmount: number;
  newAmount: number;
  seen: boolean;
  createdAt: string;
}

export interface SearchTx {
  id: string;
  description: string;
  amount: number;
  date: string;
  subscriptionId?: string | null;
}

export interface SubscriptionConflict {
  id: string;
  transactionId: string;
  subscriptionIds: string[];
  resolved: boolean;
  createdAt: string;
}

export interface PendingLink {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: () => void;
  onDelete: () => void;
}

export interface SubscriptionListContentProps {
  loading: boolean;
  error: string | null;
  subscriptions: Subscription[];
  onRetry: () => void;
  onDismissError: () => void;
  onEdit: (sub: Subscription) => void;
  onDelete: (sub: Subscription) => void;
  onUpdateAmount: (sub: Subscription, amount: number) => void;
  onDismissPriceChange: (sub: Subscription) => void;
}

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

export interface CreateSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  existingNames: string[];
}

export interface EditSubscriptionDialogProps {
  subscription: Subscription;
  existingNames: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export interface DetectCandidatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export interface DeleteSubscriptionDialogProps {
  open: boolean;
  subscriptionName: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}
