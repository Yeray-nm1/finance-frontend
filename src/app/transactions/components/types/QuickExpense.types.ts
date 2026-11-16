export interface QuickExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export interface QuickExpenseButtonProps {
  onCreated: () => void;
}
