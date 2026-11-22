"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { SubscriptionRowProps } from "./types/SubscriptionRow.types";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { freqLabels } from "@/lib/constants";
import { daysUntil, getAnnualCost, getNextChargeDate } from "@/lib/subscriptions";

export function SubscriptionRow({
  subscription,
  onEdit,
  onDelete,
  onToggleActive,
  onHistory,
}: Readonly<SubscriptionRowProps>) {
  const active = subscription.active !== false;
  const nextCharge = getNextChargeDate(subscription);
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = (subscription.name.trim() || "?").charAt(0).toUpperCase();

  return (
    <div
      data-subscription-row={subscription.id}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 min-h-14"
    >
      <Switch
        checked={active}
        onCheckedChange={onToggleActive}
        aria-label={`${active ? "Desactivar" : "Activar"} ${subscription.name}`}
      />

      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary"
      >
        {initial}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">
            {subscription.name}
          </p>
          {!active && <Badge variant="outline">Cancelada</Badge>}
        </div>
        <p className="mt-0.5 truncate text-xs text-text-muted">
          {formatCurrency(subscription.amount)} · {freqLabels[subscription.frequency]}
          {subscription.lastTransaction
            ? ` · Último cobro ${formatShortDate(subscription.lastTransaction.date)}`
            : " · Sin cobros registrados"}
        </p>
      </div>

      <div className="w-[150px] shrink-0 text-xs">
        <p className="text-text-muted">Próximo cobro</p>
        <p className="font-medium text-text-primary">
          {active && nextCharge
            ? `${formatShortDate(nextCharge.toISOString())} · en ${daysUntil(nextCharge)} días`
            : "-"}
        </p>
      </div>

      <div className="w-[110px] shrink-0 text-xs">
        <p className="text-text-muted">Coste anual</p>
        <p className="font-medium text-text-primary">
          {formatCurrency(getAnnualCost(subscription))}
        </p>
      </div>

      <button
        type="button"
        onClick={onHistory}
        className="w-[70px] shrink-0 text-left text-sm font-medium text-primary hover:underline"
      >
        Historial
      </button>

      <div className="relative shrink-0">
        <button
          type="button"
          aria-label={`Más acciones para ${subscription.name}`}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex size-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-elevated"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="4" cy="10" r="1.6" fill="currentColor" />
            <circle cx="10" cy="10" r="1.6" fill="currentColor" />
            <circle cx="16" cy="10" r="1.6" fill="currentColor" />
          </svg>
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-border bg-white p-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              aria-label={`Editar ${subscription.name}`}
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
              className="block w-full rounded px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-elevated"
            >
              Editar
            </button>
            <button
              type="button"
              role="menuitem"
              aria-label={`Eliminar ${subscription.name}`}
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
              className="block w-full rounded px-3 py-2 text-left text-sm text-expense hover:bg-bg-elevated"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
