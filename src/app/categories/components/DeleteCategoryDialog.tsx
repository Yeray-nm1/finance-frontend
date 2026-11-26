"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types/categories";

interface DeleteCategoryDialogProps {
  readonly open: boolean;
  readonly category: Category | null;
  readonly categories: readonly Category[];
  readonly saving: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: (targetCategoryId?: string) => void | Promise<void>;
}

export function DeleteCategoryDialog({
  open,
  category,
  categories,
  saving,
  onOpenChange,
  onConfirm,
}: Readonly<DeleteCategoryDialogProps>) {
  const [moveToCategory, setMoveToCategory] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState("");

  useEffect(() => {
    if (!open) return;
    setMoveToCategory(false);
    setTargetCategoryId("");
  }, [open, category?.id]);

  const count = category?.transactionCount ?? 0;
  const targets = categories.filter((item) => item.id !== category?.id);

  function handleConfirm() {
    void onConfirm(moveToCategory ? targetCategoryId || undefined : undefined);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,.12)] sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">
            Eliminar categoría «{category?.name ?? ""}»
          </DialogTitle>
          <DialogDescription>
            Tiene {count} movimiento{count === 1 ? "" : "s"}. ¿Qué hacemos con ellos?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="radio"
                name="delete-category-option"
                checked={!moveToCategory}
                onChange={() => setMoveToCategory(false)}
                className="accent-primary"
              />
              Dejarlos sin categoría
            </label>
            <label className="flex items-center gap-2 text-sm text-text-primary">
              <input
                type="radio"
                name="delete-category-option"
                checked={moveToCategory}
                onChange={() => setMoveToCategory(true)}
                className="accent-primary"
              />
              Moverlos a otra categoría
            </label>
          </div>

          {moveToCategory && (
            <div className="space-y-2">
              <Label htmlFor="delete-category-target">Categoría</Label>
              <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
                <SelectTrigger id="delete-category-target" aria-label="Categoría">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <p className="text-[13px] text-text-muted">También se quitará de los presupuestos.</p>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={saving || (moveToCategory && !targetCategoryId)}
            >
              {saving ? "Eliminando..." : "Eliminar categoría"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
