export interface BudgetHeaderProps {
  monthOptions: Array<{ value: string; label: string; shortLabel?: string; hasBudget: boolean; isCurrent: boolean }>;
  selectedMonthValue: string;
  badge: { text: string; className: string };
  canGoBack: boolean;
  canGoForward: boolean;
  nextMonthLabel: string;
  showEditButton: boolean;
  editButtonLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMonthChange: (value: string) => void;
  onStartEdit: () => void;
}
