"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SkeletonRow } from "@/app/transactions/components/SkeletonRow";
import { SortableHeader } from "@/app/transactions/components/SortableHeader";
import { TransactionRow } from "@/app/transactions/components/TransactionRow";
import { EmptyRow } from "@/app/transactions/components/EmptyRow";
import type { TransactionsTableProps } from "@/types/transactions";

export function TransactionsTable({
  transactions,
  categories,
  accounts,
  loading,
  sortBy,
  sortOrder,
  editingId,
  editingField,
  editValue,
  savingField,
  hasActiveFilters,
  onSort,
  onStartEdit,
  onEditValueChange,
  onCancelEdit,
  onInlineEdit,
  onOpenEdit,
  onDeleteClick,
}: Readonly<TransactionsTableProps>) {
  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="date" label="Fecha" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <SortableHeader field="description" label="Descripcion" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} />
            <TableHead>Categoria</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead>Suscripci&oacute;n</TableHead>
            <SortableHeader field="amount" label="Importe" sortBy={sortBy} sortOrder={sortOrder} onSort={onSort} textRight />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={`skeleton-row-${i}`} />)
          )}
          {!loading && transactions.length === 0 && (
            <EmptyRow hasActiveFilters={hasActiveFilters} />
          )}
          {!loading && transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              categories={categories}
              accounts={accounts}
              editingId={editingId}
              editingField={editingField}
              editValue={editValue}
              savingField={savingField}
              onStartEdit={onStartEdit}
              onEditValueChange={onEditValueChange}
              onCancelEdit={onCancelEdit}
              onInlineEdit={onInlineEdit}
              onOpenEdit={onOpenEdit}
              onDeleteClick={onDeleteClick}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
