"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DeleteCategoryDialogProps } from "@/types/budgets";

export function DeleteCategoryDialog({
  open,
  categoryName,
  onConfirm,
  onClose,
}: Readonly<DeleteCategoryDialogProps>) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handling is done by the parent
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar categoría</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar la categoría <strong>{categoryName}</strong>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            className="bg-expense text-white hover:bg-red-700"
            onClick={handleConfirm}
            disabled={deleting}
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
