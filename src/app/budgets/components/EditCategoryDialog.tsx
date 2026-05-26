"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditCategoryDialogProps } from "@/types/budgets";

export function EditCategoryDialog({
  open,
  category,
  onSave,
  onClose,
}: Readonly<EditCategoryDialogProps>) {
  const [editName, setEditName] = useState(category?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (open && category) {
      setEditName(category.name);
      setSaveError(null);
    }
  }, [open, category]);

  async function handleSave() {
    if (!editName.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(editName.trim());
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar categoría</DialogTitle>
          <DialogDescription>Cambia el nombre de la categoría</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{saveError}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nombre</Label>
            <Input
              id="cat-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              disabled={saving}
            />
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saving || !editName.trim()}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
