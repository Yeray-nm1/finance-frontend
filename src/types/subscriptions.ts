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
