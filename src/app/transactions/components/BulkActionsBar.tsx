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
    <div className="mb-3 flex flex-col gap-2 rounded-lg border border-border bg-white p-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex items-center justify-between gap-2 sm:contents">
        <span className="text-sm font-medium text-text-primary">
          {selectedCount} {selectedCount === 1 ? "seleccionada" : "seleccionadas"}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="size-10 shrink-0 sm:order-last sm:size-8"
          onClick={onClear}
          aria-label="Quitar seleccion"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full shrink-0 sm:w-44">
          <Select value={categoryId} onValueChange={onCategoryChange}>
            <SelectTrigger
              className={`h-10 sm:h-8 ${categoryId ? "pr-8" : ""}`}
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
              className="absolute right-1 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded text-text-muted hover:bg-bg-elevated hover:text-expense"
              aria-label="Limpiar categoria"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="relative w-full shrink-0 sm:w-44">
          <Select value={accountId} onValueChange={onAccountChange}>
            <SelectTrigger
              className={`h-10 sm:h-8 ${accountId ? "pr-8" : ""}`}
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
              className="absolute right-1 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded text-text-muted hover:bg-bg-elevated hover:text-expense"
              aria-label="Limpiar cuenta"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-1 sm:items-center">
          <Button size="sm" className="h-10 w-full sm:h-8 sm:w-auto" onClick={onApply} disabled={!canApply || applying}>
            Aplicar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 w-full border-expense/30 text-expense hover:bg-expense/5 sm:ml-auto sm:h-8 sm:w-auto"
            onClick={onDelete}
            disabled={applying}
            aria-label={`Eliminar ${selectedCount} ${selectedCount === 1 ? "transaccion seleccionada" : "transacciones seleccionadas"}`}
          >
            <Trash2 className="size-4" /> Eliminar ({selectedCount})
          </Button>
        </div>
      </div>
    </div>
  );
}
