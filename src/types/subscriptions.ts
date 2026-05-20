export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  confidence: number;
  source: 'manual' | 'detected';
  createdAt: string;
}

export interface SubscriptionCandidate {
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  confidence: number;
}
