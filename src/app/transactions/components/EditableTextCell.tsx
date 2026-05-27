"use client";

import { Input } from "@/components/ui/input";
import { TableCell } from "@/components/ui/table";
import type { EditableTextCellProps } from "@/types/transactions";

export function EditableTextCell({
  value,
  isEditing,
  editValue,
  savingField,
  onStartEdit,
  onEditValueChange,
  onCancelEdit,
  onInlineEdit,
  className,
  displayClassName,
}: Readonly<EditableTextCellProps>) {
  return (
    <TableCell className={className}>
      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") onCancelEdit(); }}
          onBlur={() => onInlineEdit(editValue)}
          autoFocus
          className="h-8 text-sm"
          disabled={savingField}
        />
      ) : (
        <button
          onClick={onStartEdit}
          className={displayClassName ?? "bg-transparent border-none p-0 cursor-pointer font-inherit text-inherit hover:text-primary border-b border-dashed border-transparent hover:border-primary"}
          title="Clic para editar"
        >
          {value}
        </button>
      )}
    </TableCell>
  );
}
