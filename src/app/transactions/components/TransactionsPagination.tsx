"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransactionsPaginationProps } from "./types/TransactionsPagination.types";

export function TransactionsPagination({
  page,
  total,
  limit,
  totalPages,
  from,
  to,
  onPageChange,
  onLimitChange,
}: Readonly<TransactionsPaginationProps>) {
  if (total <= 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-2 text-sm text-text-muted">
      <span className="text-center sm:text-left">
        Mostrando {from}-{to} de {total} transacciones
      </span>
      <div className="flex flex-nowrap items-center justify-between gap-2 sm:justify-end sm:gap-3">
        <div className="flex shrink-0 items-center gap-1">
          <span className="hidden text-xs sm:inline">Por pagina:</span>
          <Select
            value={String(limit)}
            onValueChange={(v) => { onLimitChange(Number(v)); }}
          >
            <SelectTrigger className="h-8 w-[68px] sm:w-20" aria-label="Elementos por pagina">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="px-2 sm:px-3"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Anterior
          </Button>
          <span className="px-1 text-xs sm:px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="px-2 sm:px-3"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
