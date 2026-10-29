import type { Subscription } from "@/types/subscriptions";

export interface EditSubscriptionDialogProps {
  subscription: Subscription;
  existingNames: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}
