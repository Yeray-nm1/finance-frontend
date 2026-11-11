"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { History, Pencil, Trash2 } from "lucide-react";
import type { SubscriptionRowProps } from "./types/SubscriptionRow.types";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { freqLabels } from "@/lib/constants";
import { getAnnualCost, getNextChargeDate } from "@/lib/subscriptions";

export function SubscriptionRow({
  subscription,
  onEdit,
  onDelete,
  onToggleActive,
  onHistory,
}: Readonly<SubscriptionRowProps>) {
  const active = subscription.active !== false;
  const nextCharge = getNextChargeDate(subscription);

  return (
    <div
      data-subscription-row={subscription.id}
      className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3"
    >
      <Switch
        checked={active}
        onCheckedChange={onToggleActive}
        aria-label={`${active ? "Desactivar" : "Activar"} ${subscription.name}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <p className="font-medium text-sm text-text-primary truncate">
            {subscription.name}
          </p>
          {!active && <Badge variant="outline">Cancelada</Badge>}
        </div>
        <p className="text-xs text-text-muted mt-0.5 truncate">
          {formatCurrency(subscription.amount)} · {freqLabels[subscription.frequency]}
          <span className="sm:hidden">
            {" · "}{formatCurrency(getAnnualCost(subscription))}/año
            {active && nextCharge ? ` · ${formatShortDate(nextCharge.toISOString())}` : ""}
          </span>
        </p>
      </div>

      <div className="hidden sm:block w-28 shrink-0 text-xs">
        <p className="text-text-muted">Coste anual</p>
        <p className="font-medium text-text-primary">{formatCurrency(getAnnualCost(subscription))}</p>
      </div>

      <div className="hidden md:block w-28 shrink-0 text-xs">
        <p className="text-text-muted">Proximo cobro</p>
        <p className="font-medium text-text-primary">
          {active && nextCharge ? formatShortDate(nextCharge.toISOString()) : "-"}
        </p>
      </div>

      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onHistory}>
          <History className="size-4" />
          <span className="hidden lg:inline text-xs">Historial</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Editar ${subscription.name}`}>
          <Pencil className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Eliminar ${subscription.name}`}>
          <Trash2 className="size-4 text-expense" />
        </Button>
      </div>
    </div>
  );
}
