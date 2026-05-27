"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import type { EditableSelectCellProps } from "@/types/transactions";

export function EditableSelectCell({
  value: _value,
  display,
  isEditing,
  editValue,
  savingField,
  onStartEdit,
  onCancelEdit,
  onInlineEdit,
  options,
  className,
  displayClassName,
}: Readonly<EditableSelectCellProps>) {
  return (
    <TableCell className={className}>
      {isEditing ? (
        <Select
          value={editValue}
          onValueChange={(v) => onInlineEdit(v)}
          onOpenChange={(open) => {
            if (!open) onCancelEdit();
          }}
          disabled={savingField}
        >
          <SelectTrigger className="h-8 text-sm" autoFocus>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <button
          onClick={onStartEdit}
          className={displayClassName ?? "bg-transparent border-none p-0 cursor-pointer font-inherit text-inherit text-text-muted hover:text-primary border-b border-dashed border-transparent hover:border-primary"}
          title="Clic para editar"
        >
          {display}
        </button>
      )}
    </TableCell>
  );
}
