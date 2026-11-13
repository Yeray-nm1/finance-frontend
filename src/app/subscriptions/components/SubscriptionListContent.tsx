"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TriangleAlert } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getAnnualCost } from "@/lib/subscriptions";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/ErrorState";
import type { SubscriptionListContentProps } from "./types/SubscriptionListContent.types";
import { SubscriptionRow } from "./SubscriptionRow";

type Tab = "active" | "cancelled";

export function SubscriptionListContent({
  loading,
  error,
  subscriptions,
  onRetry,
  onDismissError,
  onEdit,
  onDelete,
  onToggleActive,
  onHistory,
  onUpdateAmount,
  onDismissPriceChange,
}: Readonly<SubscriptionListContentProps>) {
  const [tab, setTab] = useState<Tab>("active");

  const activeSubs = subscriptions.filter((s) => s.active !== false);
  const cancelledSubs = subscriptions.filter((s) => s.active === false);

  if (loading) {
    return <Spinner className="pt-12" />;
  }

  if (error && subscriptions.length === 0) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (subscriptions.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-12">
        No tienes suscripciones. Crea una o detecta candidatos.
      </p>
    );
  }

  const annualTotal = activeSubs.reduce((total, sub) => total + getAnnualCost(sub), 0);
  const priceChangeSubs = activeSubs.filter((s) => (s.priceChanges ?? []).length > 0);
  const visibleSubs = tab === "active" ? activeSubs : cancelledSubs;

  return (
    <>
      {error && (
        <div className="mb-4 p-3 rounded-lg border border-expense/30 bg-expense/5 flex items-center justify-between">
          <p className="text-sm text-expense">{error}</p>
          <Button variant="ghost" size="sm" onClick={onDismissError} className="text-xs">
            Descartar
          </Button>
        </div>
      )}

      {priceChangeSubs.length > 0 && (
        <div className="mb-4 space-y-2">
          {priceChangeSubs.map((sub) => {
            const change = sub.priceChanges![0];
            return (
              <div
                key={sub.id}
                className="p-3 rounded-lg border border-warning/20 bg-warning/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TriangleAlert className="size-4 text-warning shrink-0" />
                  <span className="text-sm text-warning truncate">
                    <strong>{sub.name}</strong>: antes {formatCurrency(change.previousAmount)} → {formatCurrency(change.newAmount)}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onUpdateAmount(sub, change.newAmount)}
                  >
                    Actualizar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onDismissPriceChange(sub)}
                  >
                    Descartar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <div role="tablist" className="flex gap-4 border-b border-border">
          {([
            { id: "active" as const, label: "Activas", count: activeSubs.length },
            { id: "cancelled" as const, label: "Canceladas", count: cancelledSubs.length },
          ]).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              data-subscription-tab={item.id}
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "-mb-px border-b-2 px-1 pb-2 text-sm transition-colors",
                tab === item.id
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              )}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>
        <p className="text-sm text-text-muted">
          Coste anual <span className="font-semibold text-text-primary">{formatCurrency(annualTotal)}</span>
        </p>
      </div>

      {visibleSubs.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">
          {tab === "active" ? "No hay suscripciones activas." : "No hay suscripciones canceladas."}
        </p>
      ) : (
        <div className="space-y-2">
          {visibleSubs.map((sub) => (
            <SubscriptionRow
              key={sub.id}
              subscription={sub}
              onEdit={() => onEdit(sub)}
              onDelete={() => onDelete(sub)}
              onToggleActive={() => onToggleActive(sub)}
              onHistory={() => onHistory(sub)}
            />
          ))}
        </div>
      )}
    </>
  );
}
