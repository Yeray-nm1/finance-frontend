export interface BudgetTypeTabsProps {
  readonly typeAllocations: readonly { readonly type: string; readonly percentage: number }[];
  readonly selectedType: string;
  readonly totalIncome: number;
  readonly onSelectType: (type: string) => void;
  readonly onPercentageChange: (type: string, percentage: number) => void;
}
