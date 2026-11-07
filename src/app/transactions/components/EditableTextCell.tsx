"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { TableCell } from "@/components/ui/table";
import type { EditableTextCellProps } from "./types/EditableTextCell.types";

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
  const submittedWithEnter = useRef(false);

  return (
    <TableCell className={className}>
      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              submittedWithEnter.current = false;
              onCancelEdit();
            }
            if (e.key === "Enter") {
              e.preventDefault();
              submittedWithEnter.current = true;
              onInlineEdit(editValue);
            }
          }}
          onBlur={() => {
            if (submittedWithEnter.current) {
              submittedWithEnter.current = false;
              return;
            }
            onInlineEdit(editValue);
          }}
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
