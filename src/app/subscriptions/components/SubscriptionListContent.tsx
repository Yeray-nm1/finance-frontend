"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TriangleAlert } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { SubscriptionListContentProps } from "@/types/subscriptions";
import { SubscriptionCard } from "./SubscriptionCard";

export function SubscriptionListContent({
  loading,
  error,
  subscriptions,
  onRetry,
  onDismissError,
  onEdit,
  onDelete,
  onUpdateAmount,
  onDismissPriceChange,
}: Readonly<SubscriptionListContentProps>) {
  if (loading) {
    return <Spinner className="pt-12" />;
  }

  if (error && subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-expense">{error}</p>
        <button onClick={onRetry} className="text-primary text-sm hover:underline mt-2">
          Reintentar
        </button>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-12">
        No tienes suscripciones. Crea una o detecta candidatos.
      </p>
    );
  }

  const priceChangeSubs = subscriptions.filter((s) => (s.priceChanges ?? []).length > 0);

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
                className="p-3 rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TriangleAlert className="size-4 text-amber-600 shrink-0" />
                  <span className="text-sm text-amber-800 truncate">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {subscriptions.map((sub) => (
          <SubscriptionCard
            key={sub.id}
            subscription={sub}
            onEdit={() => onEdit(sub)}
            onDelete={() => onDelete(sub)}
          />
        ))}
      </div>
    </>
  );
}
