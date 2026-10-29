import type { IncomeGroup } from "@/types/budgets";

export interface IncomeReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: IncomeGroup[];
  onConfirm: (selectedTotal: number) => void;
}
