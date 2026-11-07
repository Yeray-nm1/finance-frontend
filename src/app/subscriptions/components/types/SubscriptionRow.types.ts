import type { Subscription } from "@/types/subscriptions";

export interface SubscriptionRowProps {
  subscription: Subscription;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onHistory: () => void;
}
