"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SkeletonRow } from "@/app/transactions/components/SkeletonRow";
import { SortableHeader } from "@/app/transactions/components/SortableHeader";
import { TransactionRow } from "@/app/transactions/components/TransactionRow";
import { EmptyRow } from "@/app/transactions/components/EmptyRow";
import { Checkbox } from "@/components/ui/checkbox";
import type { TransactionsTableProps } from "./types/TransactionsTable.types";

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
  selectedIds,
  onSort,
  onStartEdit,
  onEditValueChange,
  onCancelEdit,
  onInlineEdit,
  onOpenEdit,
  onDeleteClick,
  onToggleSelect,
  onToggleSelectAll,
}: Readonly<TransactionsTableProps>) {
  const allSelected =
    transactions.length > 0 && transactions.every((tx) => selectedIds.has(tx.id));
  const someSelected = transactions.some((tx) => selectedIds.has(tx.id));

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={onToggleSelectAll}
                aria-label="Seleccionar todas"
              />
            </TableHead>
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
            [1, 2, 3].map((row) => <SkeletonRow key={`skeleton-row-${row}`} />)
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
              selected={selectedIds.has(tx.id)}
              onStartEdit={onStartEdit}
              onEditValueChange={onEditValueChange}
              onCancelEdit={onCancelEdit}
              onInlineEdit={onInlineEdit}
              onOpenEdit={onOpenEdit}
              onDeleteClick={onDeleteClick}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
