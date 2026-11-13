"use client";

import { ArrowDownAZ, ArrowUpAZ, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/format";
import { getAmountColor } from "@/components/ui/variants/transactions.variants";
import { getAmountSign } from "@/lib/transactions-utils";
import type { TransactionsMobileListProps } from "./types/TransactionsMobileList.types";

export function TransactionsMobileList({
  transactions,
  categories,
  accounts,
  loading,
  hasActiveFilters,
  selectedIds,
  sortBy,
  sortOrder,
  onSort,
  onOpenEdit,
  onDeleteClick,
  onToggleSelect,
  onToggleSelectAll,
}: Readonly<TransactionsMobileListProps>) {
  const allSelected =
    transactions.length > 0 && transactions.every((tx) => selectedIds.has(tx.id));
  const someSelected = transactions.some((tx) => selectedIds.has(tx.id));

  return (
    <section className="rounded-lg border border-border bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <label className="flex items-center gap-2 text-xs text-text-secondary">
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={onToggleSelectAll}
            aria-label="Seleccionar todas las transacciones"
          />
          Todas
        </label>
        <div className="flex items-center gap-1">
          <select
            aria-label="Ordenar transacciones"
            value={sortBy}
            onChange={(event) => onSort(event.target.value as "date" | "amount" | "description")}
            className="rounded-md border border-border bg-white px-2 py-1 text-xs text-text-primary"
          >
            <option value="date">Fecha</option>
            <option value="amount">Importe</option>
            <option value="description">Descripcion</option>
          </select>
          <button
            type="button"
            onClick={() => onSort(sortBy as "date" | "amount" | "description")}
            aria-label={sortOrder === "asc" ? "Orden ascendente" : "Orden descendente"}
            title={sortOrder === "asc" ? "Orden ascendente" : "Orden descendente"}
            className="flex size-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            {sortOrder === "asc" ? <ArrowUpAZ size={15} /> : <ArrowDownAZ size={15} />}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={`mobile-skeleton-${item}`} className="h-16 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-text-muted">
          {hasActiveFilters
            ? "Sin resultados. Prueba con otros filtros."
            : "No hay transacciones. Anade tu primera transaccion."}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {transactions.map((tx) => {
            const selected = selectedIds.has(tx.id);
            const categoryName =
              tx.category?.name ??
              categories.find((category) => category.id === tx.categoryId)?.name ??
              "Sin categoria";
            const accountName =
              tx.account?.name ??
              accounts.find((account) => account.id === tx.accountId)?.name ??
              "-";
            const transferAccountName = tx.transferAccount?.name;
            const isSub = tx.isSubscription || !!tx.subscriptionId;

            return (
              <li
                key={tx.id}
                className={`p-4 transition-colors ${selected ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => onToggleSelect(tx.id)}
                    aria-label={`Seleccionar ${tx.description}`}
                    className="mt-0.5"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 break-words text-sm font-medium text-text-primary">
                        {tx.description}
                      </p>
                      <span
                        className={`shrink-0 whitespace-nowrap text-sm font-medium ${getAmountColor(tx.type)}`}
                      >
                        {getAmountSign(tx.type)} {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
                      <span>{new Date(tx.date).toLocaleDateString("es-ES")}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{categoryName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">
                        {accountName}
                        {transferAccountName ? ` → ${transferAccountName}` : ""}
                      </span>
                      {isSub && <Badge variant="secondary">Suscripcion</Badge>}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenEdit(tx)}
                      aria-label={`Editar ${tx.description}`}
                      className="flex size-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-elevated hover:text-primary"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteClick(tx.id)}
                      aria-label={`Eliminar ${tx.description}`}
                      className="flex size-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-delete-bg hover:text-expense"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
