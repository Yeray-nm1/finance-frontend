"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionsPaginationProps {
  page: number;
  total: number;
  limit: number;
  totalPages: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

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
    <div className="flex items-center justify-between mt-4 text-sm text-text-muted">
      <span>
        Mostrando {from}-{to} de {total} transacciones
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-xs">Por pagina:</span>
          <Select
            value={String(limit)}
            onValueChange={(v) => { onLimitChange(Number(v)); }}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Anterior
          </Button>
          <span className="px-2 text-xs">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
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
