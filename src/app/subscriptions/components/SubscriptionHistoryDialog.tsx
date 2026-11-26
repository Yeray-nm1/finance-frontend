"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { SearchTx } from "@/types/subscriptions";
import type { SubscriptionHistoryDialogProps } from "./types/SubscriptionHistoryDialog.types";

function dateLabel(date: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? date
    : format(parsed, "d MMM yyyy", { locale: es });
}

export function SubscriptionHistoryDialog({
  subscription,
  open,
  onOpenChange,
  onChanged,
}: Readonly<SubscriptionHistoryDialogProps>) {
  const [suggestions, setSuggestions] = useState<SearchTx[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !subscription) return;
    const controller = new AbortController();
    const term = subscription.name || subscription.matchDescriptions?.[0] || "";
    if (!term) return;

    fetch(`/api/v1/transactions?search=${encodeURIComponent(term)}&limit=20`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Error al buscar transacciones");
        return response.json();
      })
      .then((data) => {
        const all = (data.data || []) as SearchTx[];
        const linked = new Set(
          (subscription.recentTransactions ?? []).map((payment) => payment.id)
        );
        const available = all.filter((tx) => !tx.subscriptionId && !linked.has(tx.id));
        setSuggestions(available);
        setSelectedIds(
          available
            .filter((tx) => isSameAmount(tx, subscription.amount))
            .map((tx) => tx.id)
        );
      })
      .catch(() => {
        setSuggestions([]);
        setSelectedIds([]);
      });

    return () => controller.abort();
  }, [open, subscription]);

  function isSameAmount(tx: SearchTx, reference: number): boolean {
    if (!reference) return false;
    return Math.abs(Math.abs(tx.amount) - reference) <= 0.01;
  }

  if (!subscription) return null;

  const payments = [...(
    subscription.recentTransactions
      ?? (subscription.lastTransaction ? [subscription.lastTransaction] : [])
  )].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const chosen = suggestions.filter((tx) => selectedIds.includes(tx.id));

  function toggle(tx: SearchTx) {
    setSelectedIds((current) =>
      current.includes(tx.id)
        ? current.filter((id) => id !== tx.id)
        : [...current, tx.id]
    );
  }

  async function handleUnlink(transactionId: string) {
    setBusy(true);
    setError(null);
    try {
      await api.subscriptions.unlinkTransaction(subscription!.id, transactionId);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desvincular el pago");
    } finally {
      setBusy(false);
    }
  }

  async function handleLink() {
    setBusy(true);
    setError(null);
    try {
      for (const tx of chosen) {
        await api.subscriptions.confirmMatch(subscription!.id, tx.description, tx.id);
      }
      setSelectedIds([]);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron vincular los pagos");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex min-h-0 flex-col overflow-hidden sm:max-w-[560px] [&>button:last-child]:hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>Historial · {subscription.name}</DialogTitle>
              <DialogDescription>Pagos vinculados a esta suscripción</DialogDescription>
            </div>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => onOpenChange(false)}
              className="-mt-1 flex size-10 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-elevated"
            >
              <span aria-hidden="true" className="text-2xl leading-none">×</span>
            </button>
          </div>
        </DialogHeader>

        <div className="shrink-0 rounded-lg border border-warning/30 bg-warning/5 px-3.5 py-2.5 text-[13px] text-warning">
          ¿Falta algún pago? Vincula movimientos que no se reconocieron automáticamente.
        </div>

        {payments.length === 0 ? (
          <p className="shrink-0 py-4 text-center text-sm text-text-muted">
            Sin pagos vinculados.
          </p>
        ) : (
          <div
            data-testid="history-payment-list"
            className="scrollbar-thin max-h-40 min-h-0 shrink-0 overflow-y-auto"
          >
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex min-h-12 items-center justify-between gap-3 border-t border-border px-1 py-2 text-sm"
              >
                <span className="text-text-primary">{dateLabel(payment.date)}</span>
                <span className="flex items-center gap-3">
                  <strong className="font-semibold text-text-primary">
                    {formatCurrency(Math.abs(payment.amount))}
                  </strong>
                  <button
                    type="button"
                    onClick={() => void handleUnlink(payment.id)}
                    disabled={busy}
                    className="text-[13px] font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    Desvincular
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-text-primary">
            Movimientos sin vincular que se parecen
          </p>
          {suggestions.length === 0 ? (
            <p className="text-sm text-text-muted">No hay movimientos parecidos sin vincular.</p>
          ) : (
            <div className="scrollbar-thin max-h-48 space-y-2 overflow-y-auto pr-1">
              {suggestions.map((tx) => {
                const different = !isSameAmount(tx, subscription.amount);
                return (
                  <label
                    key={tx.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-3.5 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary-light/20"
                  >
                    <input
                      type="checkbox"
                      aria-label={`${tx.description} ${dateLabel(tx.date)}`}
                      checked={selectedIds.includes(tx.id)}
                      onChange={() => toggle(tx)}
                      className="size-[18px] shrink-0 accent-primary"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text-primary">
                        {tx.description}
                      </span>
                      <span className="block text-xs text-text-muted">
                        {dateLabel(tx.date)}{different ? " · importe distinto" : ""}
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
        </div>

        {error && <p className="shrink-0 text-sm text-expense">{error}</p>}

        <div className="flex shrink-0 justify-between gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={() => void handleLink()}
            disabled={busy || chosen.length === 0}
          >
            {chosen.length === 0
              ? "Vincular pagos"
              : `Vincular ${chosen.length} ${chosen.length === 1 ? "pago" : "pagos"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
