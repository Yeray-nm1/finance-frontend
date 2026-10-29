export interface BudgetDetailsProps {
  readonly totalIncome: number;
  readonly onTotalIncomeChange: (value: number) => void;
  readonly typeAllocations: readonly { readonly type: string; readonly percentage: number }[];
  readonly selectedType: string;
  readonly onSelectType: (type: string) => void;
  readonly totalAllocated: number;
  readonly isValidTotal: boolean;
  readonly onCalculateIncome?: () => void;
  readonly calculatingIncome?: boolean;
  readonly onSave?: () => void;
  readonly onCancel?: () => void;
  readonly saving?: boolean;
  readonly canSave?: boolean;
}
