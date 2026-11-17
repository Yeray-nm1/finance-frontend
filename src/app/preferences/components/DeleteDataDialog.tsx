"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface DeleteDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteDataDialog({
  open,
  onOpenChange,
  onDeleted,
}: Readonly<DeleteDataDialogProps>) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (deleting) return;
    if (!nextOpen) setError(null);
    onOpenChange(nextOpen);
  }

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    try {
      await api.me.deleteData();
      onDeleted();
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron borrar los datos");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Borrar todos mis datos</DialogTitle>
          <DialogDescription>
            Se eliminarán tus cuentas, movimientos, metas, categorías,
            presupuestos, suscripciones y notificaciones.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-delete-bg text-expense rounded-lg px-4 py-3 text-sm font-medium">
          Esta acción no se puede deshacer. Tu usuario y tu contraseña se
          conservarán.
        </div>

        {error && (
          <div className="bg-delete-bg text-expense rounded-lg px-4 py-2.5 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            {deleting ? "Borrando..." : "Borrar datos"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
