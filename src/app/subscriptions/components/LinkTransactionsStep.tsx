"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { SubscriptionSteps } from "./SubscriptionSteps";
import type { LinkTransactionsStepProps } from "./types/LinkTransactionsStep.types";
import type { SearchTx } from "@/types/subscriptions";

function dateLabel(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : format(parsed, "d MMM yyyy", { locale: es });
}

export function LinkTransactionsStep({
  title,
  name,
  searchQuery,
  searchResults,
  selectedIds,
  searchLoading,
  searchError,
  error,
  saving,
  saveLabel,
  savingLabel,
  referenceAmount,
  nextChargeLabel,
  onSearchQueryChange,
  onSearch,
  onToggle,
  onBack,
  onSave,
  onSaveWithoutLinks,
}: Readonly<LinkTransactionsStepProps>) {
  const selectedCount = selectedIds.length;

  function isDifferentAmount(tx: SearchTx): boolean {
    if (!referenceAmount) return false;
    return Math.abs(Math.abs(tx.amount) - referenceAmount) > 0.01;
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Paso 2 de 2 · puedes saltarlo</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <SubscriptionSteps current={2} />

      <p className="text-sm leading-relaxed text-text-primary">
        Hemos buscado movimientos parecidos a &laquo;{name}&raquo;. Marca los que sean de esta suscripción.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          aria-label="Buscar movimientos"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSearch();
            }
          }}
          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-white px-3.5 text-sm text-text-primary outline-none focus-visible:border-primary"
        />
        <Button type="button" variant="outline" onClick={onSearch} disabled={searchLoading}>
          {searchLoading ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      {searchError && <p className="text-sm text-expense">{searchError}</p>}

      {searchResults.length > 0 && (
        <div className="scrollbar-thin max-h-52 space-y-2 overflow-y-auto pr-1">
          {searchResults.map((tx) => {
            const label = `${tx.description} ${dateLabel(tx.date)}`;
            const differentAmount = isDifferentAmount(tx);
            return (
              <label
                key={tx.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3.5 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary-light/20"
              >
                <input
                  type="checkbox"
                  aria-label={label}
                  checked={selectedIds.includes(tx.id)}
                  onChange={() => onToggle(tx)}
                  className="size-[18px] shrink-0 accent-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text-primary">
                    {tx.description}
                  </span>
                  <span className="block text-xs text-text-muted">
                    {dateLabel(tx.date)}{differentAmount ? " · importe distinto" : ""}
                  </span>
                </span>
                <strong className="shrink-0 text-sm font-semibold text-text-primary">
                  {formatCurrency(Math.abs(tx.amount))}
                </strong>
              </label>
            );
          })}
        </div>
      )}

      {!searchLoading && !searchError && searchResults.length === 0 && (
        <p className="text-sm text-text-muted">
          No hemos encontrado movimientos parecidos. Puedes guardar sin vincular pagos.
        </p>
      )}

      {nextChargeLabel && (
        <div className="rounded-lg border border-income/30 bg-income/5 px-3.5 py-2.5 text-[13px] text-income">
          {selectedCount === 1
            ? `Con este pago, el próximo cobro será el ${nextChargeLabel}.`
            : `Con estos ${selectedCount} pagos, el próximo cobro será el ${nextChargeLabel}.`}
        </div>
      )}

      {error && <p className="text-sm text-expense">{error}</p>}

      <button
        type="button"
        onClick={onSaveWithoutLinks}
        className="self-start text-sm font-medium text-primary hover:underline"
      >
        Guardar sin vincular pagos
      </button>

      <div className="flex justify-between gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onBack}>
          &larr; Atrás
        </Button>
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? savingLabel : saveLabel}
        </Button>
      </div>
    </>
  );
}
