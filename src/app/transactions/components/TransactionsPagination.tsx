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
    <div className="mt-4 flex flex-col gap-3 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
      <span className="text-center sm:text-left">
        Mostrando {from}-{to} de {total} transacciones
      </span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center justify-start gap-2">
          <span className="text-xs">Por página:</span>
          <Select
            value={String(limit)}
            onValueChange={(v) => { onLimitChange(Number(v)); }}
          >
            <SelectTrigger className="h-10 w-24 sm:h-8 sm:w-20" aria-label="Elementos por pagina">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:shrink-0 sm:items-center sm:gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-full px-2 sm:h-8 sm:w-auto sm:px-3"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Anterior
          </Button>
          <span className="px-1 text-center text-xs sm:px-2">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-full px-2 sm:h-8 sm:w-auto sm:px-3"
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
