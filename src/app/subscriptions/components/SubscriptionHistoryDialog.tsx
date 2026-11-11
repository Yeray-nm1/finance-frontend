"use client";

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

  const payments = subscription.recentTransactions
    ?? (subscription.lastTransaction ? [subscription.lastTransaction] : []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historial · {subscription.name}</DialogTitle>
          <DialogDescription>Ultimos pagos vinculados</DialogDescription>
        </DialogHeader>

        {payments.length === 0 ? (
          <p className="text-sm text-text-muted py-6 text-center">
            Sin pagos vinculados.
          </p>
        ) : (
          <div className="divide-y rounded-lg border border-border">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="text-text-primary truncate">{payment.description}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(payment.date).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <p className="font-medium text-text-primary shrink-0">
                  {formatCurrency(Math.abs(payment.amount))}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
