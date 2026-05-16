export interface CsvDropZoneProps {
  readonly onImported: () => void;
}

export interface CsvUploadDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onImported: () => void;
}
