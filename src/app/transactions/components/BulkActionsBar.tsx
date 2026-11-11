"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, X } from "lucide-react";
import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import { NO_ACCOUNT_SENTINEL, NO_CATEGORY_SENTINEL } from "@/lib/transactions-utils";

interface BulkActionsBarProps {
  selectedCount: number;
  categories: Category[];
  accounts: Account[];
  categoryId: string;
  accountId: string;
  applying: boolean;
  onCategoryChange: (value: string) => void;
  onAccountChange: (value: string) => void;
  onApply: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BulkActionsBar({
  selectedCount,
  categories,
  accounts,
  categoryId,
  accountId,
  applying,
  onCategoryChange,
  onAccountChange,
  onApply,
  onDelete,
  onClear,
}: Readonly<BulkActionsBarProps>) {
  if (selectedCount === 0) return null;

  const canApply = Boolean(categoryId || accountId);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white p-3">
      <span className="text-sm font-medium text-text-primary">
        {selectedCount} {selectedCount === 1 ? "seleccionada" : "seleccionadas"}
      </span>

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-44 shrink-0">
          <Select value={categoryId} onValueChange={onCategoryChange}>
            <SelectTrigger
              className={`h-8 ${categoryId ? "pr-8" : ""}`}
              aria-label="Categoria"
            >
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY_SENTINEL}>Sin categoria</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categoryId && (
            <button
              type="button"
              onClick={() => onCategoryChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense z-10"
              aria-label="Limpiar categoria"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="relative w-44 shrink-0">
          <Select value={accountId} onValueChange={onAccountChange}>
            <SelectTrigger
              className={`h-8 ${accountId ? "pr-8" : ""}`}
              aria-label="Cuenta"
            >
              <SelectValue placeholder="Cuenta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ACCOUNT_SENTINEL}>Sin cuenta</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {accountId && (
            <button
              type="button"
              onClick={() => onAccountChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense z-10"
              aria-label="Limpiar cuenta"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Button size="sm" className="h-8" onClick={onApply} disabled={!canApply || applying}>
          Aplicar
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1 border-l border-border pl-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-expense/30 text-expense hover:bg-expense/5"
          onClick={onDelete}
          disabled={applying}
          aria-label={`Eliminar ${selectedCount} ${selectedCount === 1 ? "transaccion seleccionada" : "transacciones seleccionadas"}`}
        >
          <Trash2 className="size-4" /> Eliminar ({selectedCount})
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8"
          onClick={onClear}
          aria-label="Quitar seleccion"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
