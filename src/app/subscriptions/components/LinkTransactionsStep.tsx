"use client";

import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { LinkTransactionsStepProps } from "@/types/subscriptions";

export function LinkTransactionsStep({
  name,
  pendingLinks,
  searchResults,
  searchLoading,
  searchError,
  error,
  saving,
  saveLabel,
  savingLabel,
  onSearch,
  onLinkAll,
  onAddPending,
  onRemovePending,
  onBack,
  onSave,
}: Readonly<LinkTransactionsStepProps>) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Vincular transacciones</DialogTitle>
        <DialogDescription>
          Busca y vincula transacciones a &quot;{name}&quot;
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {pendingLinks.length > 0 && (
          <div className="border rounded-lg max-h-24 overflow-y-auto divide-y bg-bg-elevated">
            {pendingLinks.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-3 py-1.5 text-sm">
                <span className="truncate text-xs">{tx.description}</span>
                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => onRemovePending(tx.id)}>
                  <X className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onSearch} disabled={searchLoading}>
            {searchLoading ? "Buscando..." : "Buscar transacciones"}
          </Button>
        </div>

        {searchError && <p className="text-sm text-expense">{searchError}</p>}

        {searchResults.length > 0 && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={onLinkAll}>
              Vincular todas
            </Button>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="border rounded-lg max-h-40 overflow-y-auto divide-y">
            {searchResults.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-text-muted shrink-0">
                    {new Date(tx.date).toLocaleDateString("es-ES", {
                      day: "2-digit", month: "2-digit",
                    })}
                  </span>
                  <span className="truncate">{tx.description}</span>
                  <span className="text-text-muted shrink-0">{formatCurrency(Math.abs(tx.amount))}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={() => onAddPending(tx.id, tx.description, tx.amount, tx.date)}
                >
                  <Link className="size-3" />
                  Vincular
                </Button>
              </div>
            ))}
          </div>
        )}

        {!searchLoading && !searchError && searchResults.length === 0 && (
          <p className="text-xs text-text-muted">Pulsa &quot;Buscar transacciones&quot; para encontrar transacciones pendientes de vincular</p>
        )}

        {error && <p className="text-sm text-expense">{error}</p>}

        <div className="flex justify-between gap-2 pt-2">
          <Button variant="outline" onClick={onBack}>
            Atras
          </Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? savingLabel : saveLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
