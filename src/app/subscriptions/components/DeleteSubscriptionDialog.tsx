"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DeleteSubscriptionDialogProps } from "@/types/subscriptions";

export function DeleteSubscriptionDialog({
  open,
  subscriptionName,
  onConfirm,
  onOpenChange,
}: Readonly<DeleteSubscriptionDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar suscripcion</DialogTitle>
          <DialogDescription>
            Se eliminara &quot;{subscriptionName}&quot; y se desvincularan sus
            transacciones. Esta accion no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
