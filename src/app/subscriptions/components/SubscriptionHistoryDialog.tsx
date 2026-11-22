"use client";

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
import { formatCurrency } from "@/lib/format";
import type { SubscriptionHistoryDialogProps } from "./types/SubscriptionHistoryDialog.types";

export function SubscriptionHistoryDialog({
  subscription,
  open,
  onOpenChange,
}: Readonly<SubscriptionHistoryDialogProps>) {
  if (!subscription) return null;

  const payments = [...(
    subscription.recentTransactions
      ?? (subscription.lastTransaction ? [subscription.lastTransaction] : [])
  )].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = payments.reduce((sum, payment) => sum + Math.abs(payment.amount), 0);
  const average = payments.length > 0 ? total / payments.length : 0;
  const lastPayment = payments[0];
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 6);
  const isStale = Boolean(lastPayment && new Date(lastPayment.date) < cutoff);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col overflow-hidden [&>button:last-child]:hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>Historial · {subscription.name}</DialogTitle>
              <DialogDescription>Últimos pagos vinculados</DialogDescription>
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

        {isStale && (
          <div className="shrink-0 rounded-lg border border-warning/30 bg-warning/5 px-3.5 py-2.5 text-sm text-warning">
            Sin cobros desde el {format(new Date(lastPayment.date), "d MMM", { locale: es })}
          </div>
        )}

        {payments.length > 0 && (
          <div className="grid shrink-0 grid-cols-3 gap-2">
            <div className="rounded-lg bg-bg-elevated p-3">
              <p className="text-xs text-text-muted">Pagos</p>
              <p className="mt-0.5 text-base font-bold text-text-primary">{payments.length}</p>
            </div>
            <div className="rounded-lg bg-bg-elevated p-3">
              <p className="text-xs text-text-muted">En total</p>
              <p className="mt-0.5 text-base font-bold text-text-primary">{formatCurrency(total)}</p>
            </div>
            <div className="rounded-lg bg-bg-elevated p-3">
              <p className="text-xs text-text-muted">Importe medio</p>
              <p className="mt-0.5 text-base font-bold text-text-primary">{formatCurrency(average)}</p>
            </div>
          </div>
        )}

        {payments.length === 0 ? (
          <p className="text-sm text-text-muted py-6 text-center">
            Sin pagos vinculados.
          </p>
        ) : (
          <div
            data-testid="history-payment-list"
            className="scrollbar-thin max-h-[280px] min-h-0 flex-1 overflow-y-auto"
          >
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 border-t border-border px-1 py-3 text-sm"
              >
                <span className="text-text-primary">
                  {format(new Date(payment.date), "d MMM yyyy", { locale: es })}
                </span>
                <strong className="shrink-0 font-semibold text-text-primary">
                  {formatCurrency(Math.abs(payment.amount))}
                </strong>
              </div>
            ))}
          </div>
        )}

        <div className="flex shrink-0 justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
