import type { Subscription } from "@/types/subscriptions";

export interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: () => void;
  onDelete: () => void;
}
