"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getAmountColor, getAmountSign, NO_CATEGORY_SENTINEL } from "@/lib/transactions-utils";
import type { Transaction } from "@/types/transactions";
import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";

interface SortIconProps {
  field: string;
  sortBy: string;
  sortOrder: string;
}

function SortIcon({ field, sortBy, sortOrder }: Readonly<SortIconProps>) {
  if (sortBy !== field) return <ArrowUpDown className="size-3 inline ml-1 opacity-40" />;
  return sortOrder === "asc"
    ? <ChevronUp className="size-3 inline ml-1" />
    : <ChevronDown className="size-3 inline ml-1" />;
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={`skeleton-cell-${i}`}>
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  );
}

interface TransactionsTableProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  loading: boolean;
  sortBy: string;
  sortOrder: string;
  editingId: string | null;
  editingField: string | null;
  editValue: string;
  savingField: boolean;
  hasActiveFilters: boolean;
  onSort: (field: "date" | "amount" | "description") => void;
  onStartEdit: (txId: string, field: string, value: string) => void;
  onEditValueChange: (value: string) => void;
  onCancelEdit: () => void;
  onInlineEdit: (tx: Transaction, field: string, value: string) => void;
  onOpenEdit: (tx: Transaction) => void;
  onDeleteClick: (id: string) => void;
}

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
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSort("date")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSort("date"); } }}
              tabIndex={0}
              role="button"
              aria-sort={sortBy === "date" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              Fecha <SortIcon field="date" sortBy={sortBy} sortOrder={sortOrder} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSort("description")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSort("description"); } }}
              tabIndex={0}
              role="button"
              aria-sort={sortBy === "description" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              Descripcion <SortIcon field="description" sortBy={sortBy} sortOrder={sortOrder} />
            </TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Cuenta</TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => onSort("amount")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSort("amount"); } }}
              tabIndex={0}
              role="button"
              aria-sort={sortBy === "amount" ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
            >
              Importe <SortIcon field="amount" sortBy={sortBy} sortOrder={sortOrder} />
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={`skeleton-row-${i}`} />)
          )}
          {!loading && transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-text-muted">
                {hasActiveFilters
                  ? "Sin resultados. Prueba con otros filtros."
                  : "No hay transacciones. Anade tu primera transaccion."}
              </TableCell>
            </TableRow>
          )}
          {!loading && transactions.map((tx) => (
            <TableRow key={tx.id} className={`${savingField && editingId === tx.id ? "opacity-60" : ""} border-gray-100`}>
              <TableCell className="py-1.5 px-4 text-sm whitespace-nowrap">
                {new Date(tx.date).toLocaleDateString("es-ES")}
              </TableCell>

              <TableCell className="py-1.5 px-4 font-medium max-w-[200px]">
                {editingId === tx.id && editingField === "description" ? (
                  <Input
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") onCancelEdit();
                    }}
                    onBlur={() => onInlineEdit(tx, "description", editValue)}
                    autoFocus
                    className="h-8 text-sm"
                    disabled={savingField}
                  />
                ) : (
                  <span
                    className="cursor-pointer hover:text-primary border-b border-dashed border-transparent hover:border-primary"
                    onClick={() => onStartEdit(tx.id, "description", tx.description)}
                    title="Clic para editar"
                  >
                    {tx.description}
                  </span>
                )}
              </TableCell>

              <TableCell className="py-1.5 px-4 text-text-muted">
                {editingId === tx.id && editingField === "categoryId" ? (
                  <Select
                    value={editValue}
                    onValueChange={(v) => {
                      onInlineEdit(tx, "categoryId", v);
                    }}
                    onOpenChange={(open) => {
                      if (!open && editingId === tx.id && editingField === "categoryId") onCancelEdit();
                    }}
                    disabled={savingField}
                  >
                    <SelectTrigger className="h-8 text-sm" autoFocus>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY_SENTINEL}>Sin categoria</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    className="cursor-pointer hover:text-primary border-b border-dashed border-transparent hover:border-primary"
                    onClick={() => onStartEdit(tx.id, "categoryId", tx.categoryId ?? NO_CATEGORY_SENTINEL)}
                    title="Clic para editar"
                  >
                    {tx.category?.name ?? categories.find((c) => c.id === tx.categoryId)?.name ?? "-"}
                  </span>
                )}
              </TableCell>

              <TableCell className="py-1.5 px-4 text-text-muted">
                {tx.account?.name ?? accounts.find((a) => a.id === tx.accountId)?.name ?? "-"}
              </TableCell>

              <TableCell
                className={`py-1.5 px-4 text-right font-medium whitespace-nowrap ${getAmountColor(tx.type)}`}
              >
                {getAmountSign(tx.type)}{" "}
                {formatCurrency(Math.abs(tx.amount))}
              </TableCell>

              <TableCell className="py-1.5 px-4 flex gap-1">
                <button
                  onClick={() => onOpenEdit(tx)}
                  className="text-text-muted hover:text-primary transition-colors p-1"
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => onDeleteClick(tx.id)}
                  className="text-text-muted hover:text-expense transition-colors p-1"
                  title="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
