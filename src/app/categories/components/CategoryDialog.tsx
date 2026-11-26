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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_TYPES } from "@/lib/constants";
import { MONTH_NAMES, typeLabels } from "@/lib/budget-constants";
import type { Category, CategoryType } from "@/types/categories";

interface CategoryDialogProps {
  readonly open: boolean;
  readonly category: Category | null;
  readonly defaultType?: CategoryType;
  readonly saving: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (name: string, type: CategoryType) => void;
}

export function CategoryDialog({
  open,
  category,
  defaultType = "needs",
  saving,
  onOpenChange,
  onSubmit,
}: Readonly<CategoryDialogProps>) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(defaultType);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setType(category?.type ?? defaultType);
  }, [open, category, defaultType]);

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed, type);
  }

  const typeChanged = category !== null && category.type !== type;
  const now = new Date();
  const currentMonth = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,.12)] sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-semibold">
            {category ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
          <DialogDescription>
            {category
              ? "Cambia el nombre o el tipo de la categoría"
              : "Ponle un nombre y elige dónde encaja"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nombre</Label>
            <Input
              id="category-name"
              placeholder="Ej: Supermercado"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-type">Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
              <SelectTrigger id="category-type" aria-label="Tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {typeLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {typeChanged && (
            <div className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] p-3.5 text-[13px] leading-relaxed text-[#9A3412]">
              Pasar de {typeLabels[category.type]} a {typeLabels[type]} cambia dónde cuenta
              «{category.name}» en el presupuesto desde {currentMonth}. Los meses anteriores no
              cambian.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Guardando..." : category ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
