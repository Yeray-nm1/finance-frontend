"use client";

import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  type: "category" | "budget";
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  type,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-2xl mb-4">
          {type === "category" ? "¿Eliminar categoría?" : "¿Eliminar presupuesto?"}
        </h3>
        <p className="text-gray-600 mb-6">
          {type === "category"
            ? "Esta acción no se puede deshacer."
            : "Se eliminará todo el presupuesto del mes actual."}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-full"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1 rounded-full"
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
