import type { ReactNode } from "react";
import type { BudgetTypeItem } from "@/types/dashboard";

export interface BudgetTypeSectionProps {
  type: string;
  label: string;
  icon: ReactNode;
  budgets: Array<BudgetTypeItem>;
  isExpanded: boolean;
  onToggle: () => void;
  collapsible?: boolean;
  typeProgress?: number;
}
