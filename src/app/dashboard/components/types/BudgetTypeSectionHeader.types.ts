import type { ReactNode } from "react";

export interface BudgetTypeSectionHeaderProps {
  label: string;
  icon: ReactNode;
  collapsible: boolean;
  barProgress: number;
  progressAccent: string;
  isExpanded: boolean;
  spent?: number;
  budgeted?: number;
}
