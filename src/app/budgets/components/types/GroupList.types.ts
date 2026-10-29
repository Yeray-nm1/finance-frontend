import type { IncomeGroup } from "@/types/budgets";

export interface GroupListProps {
  isEmpty: boolean;
  filteredGroups: IncomeGroup[];
  monthName: string;
  prevYear: number;
  checked: Set<string>;
  expanded: Set<string>;
  onToggleGroup: (label: string) => void;
  onToggleExpand: (label: string) => void;
}
