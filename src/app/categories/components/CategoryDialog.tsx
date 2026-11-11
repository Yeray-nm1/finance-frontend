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
import { typeLabels } from "@/lib/budget-constants";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
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
              <SelectTrigger id="category-type">
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

          <Button type="submit" className="w-full" disabled={saving || !name.trim()}>
            {saving ? "Guardando..." : category ? "Guardar cambios" : "Crear categoría"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
