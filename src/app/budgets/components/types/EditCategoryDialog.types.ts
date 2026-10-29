export interface EditCategoryDialogProps {
  open: boolean;
  category: { id: string; name: string } | null;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}
