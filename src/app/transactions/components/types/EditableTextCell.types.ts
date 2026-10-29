export interface EditableTextCellProps {
  value: string;
  isEditing: boolean;
  editValue: string;
  savingField: boolean;
  onStartEdit: () => void;
  onEditValueChange: (value: string) => void;
  onCancelEdit: () => void;
  onInlineEdit: (value: string) => void;
  className?: string;
  displayClassName?: string;
}
