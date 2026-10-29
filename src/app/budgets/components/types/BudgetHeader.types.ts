export interface BudgetHeaderProps {
  monthLabel: string;
  badge: { text: string; className: string };
  canGoBack: boolean;
  canGoForward: boolean;
  showEditButton: boolean;
  editButtonLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onStartEdit: () => void;
}
