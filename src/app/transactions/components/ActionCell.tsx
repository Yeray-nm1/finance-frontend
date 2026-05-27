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
        onClick={onEdit}
        className="text-text-muted hover:text-primary transition-colors p-1"
        title="Editar"
      >
        <Pencil className="size-4" />
      </button>
      <button
        onClick={onDelete}
        className="text-text-muted hover:text-expense transition-colors p-1"
        title="Eliminar"
      >
        <Trash2 className="size-4" />
      </button>
    </TableCell>
  );
}
