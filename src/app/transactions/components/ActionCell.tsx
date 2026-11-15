"use client";

import { TableCell } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";

interface ActionCellProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function ActionCell({ onEdit, onDelete }: Readonly<ActionCellProps>) {
  return (
    <TableCell className="py-1.5 px-4 flex gap-1">
      <button
        type="button"
        onClick={onEdit}
        aria-label="Editar transacción"
        className="flex size-9 items-center justify-center rounded-md text-text-muted hover:text-primary hover:bg-bg-elevated transition-colors"
        title="Editar"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Eliminar transacción"
        className="flex size-9 items-center justify-center rounded-md text-text-muted hover:text-expense hover:bg-delete-bg transition-colors"
        title="Eliminar"
      >
        <Trash2 className="size-4" />
      </button>
    </TableCell>
  );
}
