import type { ReactNode } from "react";

export interface EditableSelectOption {
  value: string;
  label: string;
}

export interface EditableSelectCellProps {
  value: string;
  display: ReactNode;
  isEditing: boolean;
  editValue: string;
  savingField: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onInlineEdit: (value: string) => void;
  options: EditableSelectOption[];
  className?: string;
  displayClassName?: string;
}
