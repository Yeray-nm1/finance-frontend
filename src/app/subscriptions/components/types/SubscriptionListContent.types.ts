import type { Subscription } from "@/types/subscriptions";

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
