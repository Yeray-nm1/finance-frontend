"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TriangleAlert } from "lucide-react";
import { formatCurrency, formatShortDate } from "@/lib/format";
import {
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
type ListFilter = "all" | "subscription" | "recurring" | "upcoming";

function FilterCard({
  label,
  count,
  amount,
  suffix = "al año",
  selected,
  onClick,
  disabled = false,
}: Readonly<{
  label: string;
  count: string | number;
  amount: number | null;
  suffix?: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}>) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg border bg-white px-5 py-4 text-left transition-colors disabled:cursor-default disabled:opacity-100",
        selected
          ? "border-2 border-primary bg-primary-light/30"
          : "border-border enabled:hover:border-primary/40"
      )}
    >
      <p className="text-xs uppercase tracking-[0.08em] text-text-muted">
        {label} · {count}
      </p>
      <p className="mt-1 flex items-baseline gap-2 whitespace-nowrap text-[22px] font-bold leading-tight text-text-primary">
        {amount === null ? "-" : formatCurrency(amount)}
        <span className="text-[13px] font-normal text-text-muted">{suffix}</span>
      </p>
    </button>
  );
}

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
  const [listFilter, setListFilter] = useState<ListFilter>("all");
  const [reviewingStale, setReviewingStale] = useState(false);

  const kindOf = (sub: Subscription) => sub.kind ?? "subscription";
  const activeSubs = subscriptions.filter((s) => s.active !== false);
  const cancelledSubs = subscriptions.filter((s) => s.active === false);
  const subscriptionSubs = activeSubs.filter((s) => kindOf(s) === "subscription");
  const recurringSubs = activeSubs.filter((s) => kindOf(s) === "recurring");

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

  const annualTotalOf = (subs: readonly Subscription[]) =>
    subs.reduce((total, sub) => total + getAnnualCost(sub), 0);
  const annualTotal = annualTotalOf(activeSubs);
  const upcoming = getUpcomingCharge(activeSubs);
  const staleSubs = getStaleSubscriptions(activeSubs);
  const priceChangeSubs = activeSubs.filter((s) => (s.priceChanges ?? []).length > 0);
  const inScope = tab === "active" ? activeSubs : cancelledSubs;
  const upcomingDay = upcoming?.date.toDateString();
  const visibleSubs = [...(reviewingStale && tab === "active" ? staleSubs : inScope)]
    .filter((sub) => {
      if (listFilter === "upcoming") {
        return Boolean(upcomingDay && getNextChargeDate(sub)?.toDateString() === upcomingDay);
      }
      return listFilter === "all" || kindOf(sub) === listFilter;
    })
    .sort(byNextCharge);

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

      <section
        aria-label="Filtrar por tipo"
        className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <FilterCard
          label="TODOS"
          count={activeSubs.length}
          amount={annualTotal}
          selected={listFilter === "all"}
          onClick={() => setListFilter("all")}
        />
        <FilterCard
          label="SUSCRIPCIONES"
          count={subscriptionSubs.length}
          amount={annualTotalOf(subscriptionSubs)}
          selected={listFilter === "subscription"}
          onClick={() => setListFilter("subscription")}
        />
        <FilterCard
          label="PAGOS RECURRENTES"
          count={recurringSubs.length}
          amount={annualTotalOf(recurringSubs)}
          selected={listFilter === "recurring"}
          onClick={() => setListFilter("recurring")}
        />
        <FilterCard
          label="PRÓXIMO"
          count={upcoming ? formatShortDate(upcoming.date.toISOString()).toUpperCase() : "—"}
          amount={upcoming?.amount ?? null}
          suffix={
            upcoming
              ? `${upcoming.count} ${upcoming.count === 1 ? "pago" : "pagos"}`
              : "sin cobros"
          }
          selected={listFilter === "upcoming"}
          onClick={() => setListFilter("upcoming")}
          disabled={!upcoming}
        />
      </section>
      <p className="mb-4 text-xs text-text-muted">
        Pulsa una tarjeta para filtrar la lista por tipo.
      </p>

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
