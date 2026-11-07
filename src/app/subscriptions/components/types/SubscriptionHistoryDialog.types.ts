import type { Subscription } from "@/types/subscriptions";

export interface SubscriptionHistoryDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
