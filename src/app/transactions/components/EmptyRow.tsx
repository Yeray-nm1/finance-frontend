"use client";

import { TableRow, TableCell } from "@/components/ui/table";

interface EmptyRowProps {
  hasActiveFilters: boolean;
}

export function EmptyRow({ hasActiveFilters }: Readonly<EmptyRowProps>) {
  return (
    <TableRow>
      <TableCell colSpan={7} className="text-center py-12 text-text-muted">
        {hasActiveFilters
          ? "Sin resultados. Prueba con otros filtros."
          : "No hay transacciones. Anade tu primera transaccion."}
      </TableCell>
    </TableRow>
  );
}
