"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TriangleAlert } from "lucide-react";
import { formatCurrency, formatShortDate } from "@/lib/format";
import {
  daysUntil,
  getAnnualCost,
  getNextChargeDate,
  getStaleSubscriptions,
  getUpcomingCharge,
  staleSinceLabel,
} from "@/lib/subscriptions";
import { cn } from "@/lib/utils";
import { ErrorState } from "@/components/ErrorState";
import type { Subscription } from "@/types/subscriptions";
import type { SubscriptionListContentProps } from "./types/SubscriptionListContent.types";
import { SubscriptionRow } from "./SubscriptionRow";

type Tab = "active" | "cancelled";

function byNextCharge(a: Subscription, b: Subscription): number {
  const aDate = getNextChargeDate(a);
  const bDate = getNextChargeDate(b);
  if (!aDate) return bDate ? 1 : 0;
  if (!bDate) return -1;
  return aDate.getTime() - bDate.getTime();
}

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
  const [reviewingStale, setReviewingStale] = useState(false);

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
  const upcoming = getUpcomingCharge(activeSubs);
  const staleSubs = getStaleSubscriptions(activeSubs);
  const priceChangeSubs = activeSubs.filter((s) => (s.priceChanges ?? []).length > 0);
  const inScope = tab === "active" ? activeSubs : cancelledSubs;
  const visibleSubs = [...(reviewingStale && tab === "active" ? staleSubs : inScope)].sort(
    byNextCharge
  );

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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
        <div className="rounded-lg border border-border bg-white px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">COSTE ANUAL</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {formatCurrency(annualTotal)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-white px-5 py-4">
          <p className="text-xs uppercase tracking-widest text-text-muted">
            {upcoming
              ? `PRÓXIMO COBRO · ${formatShortDate(upcoming.date.toISOString())} · EN ${daysUntil(upcoming.date)} DÍAS`
              : "PRÓXIMO COBRO"}
          </p>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            {upcoming ? formatCurrency(upcoming.amount) : "-"}
            {upcoming && (
              <span className="ml-2 text-sm font-normal text-text-muted">
                {upcoming.count} {upcoming.count === 1 ? "pago" : "pagos"}
              </span>
            )}
          </p>
        </div>
      </section>

      {staleSubs.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
          <p className="text-sm text-warning">
            {staleSubs.length} {staleSubs.length === 1 ? "suscripción" : "suscripciones"} sin cobros desde {staleSinceLabel()}. ¿Siguen activas?
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm font-medium text-warning"
            onClick={() => {
              setTab("active");
              setReviewingStale((current) => !current);
            }}
          >
            {reviewingStale ? "Ver todas" : "Revisar →"}
          </Button>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
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
              onClick={() => {
                setTab(item.id);
                setReviewingStale(false);
              }}
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
        <p className="text-sm text-text-muted">Ordenadas por próximo cobro</p>
      </div>

      {visibleSubs.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">
          {tab === "active" ? "No hay suscripciones activas." : "No hay suscripciones canceladas."}
        </p>
      ) : (
        <div
          data-testid="subscription-list"
          className="scrollbar-thin max-h-[520px] space-y-2 overflow-y-auto pr-1"
        >
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
