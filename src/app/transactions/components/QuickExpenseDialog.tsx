"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { NO_ACCOUNT_SENTINEL, NO_CATEGORY_SENTINEL } from "@/lib/transactions-utils";
import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import type { QuickExpenseDialogProps } from "./types/QuickExpense.types";

export function QuickExpenseDialog({
  open,
  onOpenChange,
  onCreated,
}: Readonly<QuickExpenseDialogProps>) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState(NO_ACCOUNT_SENTINEL);
  const [categoryId, setCategoryId] = useState(NO_CATEGORY_SENTINEL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setDescription("");
      setCategoryId(NO_CATEGORY_SENTINEL);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoadingOptions(true);
    setOptionsError(null);

    Promise.all([
      api.accounts.list(controller.signal),
      api.categories.list(undefined, controller.signal),
    ])
      .then(([nextAccounts, nextCategories]) => {
        if (controller.signal.aborted) return;
        setAccounts(nextAccounts);
        setCategories(nextCategories);
        setAccountId((current) =>
          current !== NO_ACCOUNT_SENTINEL
            ? current
            : nextAccounts[0]?.id ?? NO_ACCOUNT_SENTINEL,
        );
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return;
        console.error(err);
        setOptionsError("No se pudieron cargar las cuentas y categorías.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingOptions(false);
      });

    return () => controller.abort();
  }, [open]);

  function resetForm() {
    setAmount("");
    setDescription("");
    setCategoryId(NO_CATEGORY_SENTINEL);
    setError(null);
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Escribe una descripción.");
      return;
    }

    const parsedAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("El importe debe ser mayor que 0.");
      return;
    }

    setSaving(true);
    try {
      await api.transactions.create({
        date: new Date().toISOString().split("T")[0],
        amount: parsedAmount,
        description: description.trim(),
        type: "expense",
        ...(accountId !== NO_ACCOUNT_SENTINEL ? { accountId } : {}),
        ...(categoryId !== NO_CATEGORY_SENTINEL ? { categoryId } : {}),
      });
      resetForm();
      onOpenChange(false);
      toast({ title: "Gasto añadido" });
      onCreated();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el gasto.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gasto rápido</DialogTitle>
          <DialogDescription>Se guarda hoy como gasto.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-expense-amount">Importe</Label>
            <Input
              id="quick-expense-amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-expense-description">Descripción</Label>
            <Input
              id="quick-expense-description"
              placeholder="Ej. Café"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quick-expense-category">Categoría</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => { if (value) setCategoryId(value); }}
                disabled={loadingOptions}
              >
                <SelectTrigger
                  id="quick-expense-category"
                  aria-label="Categoría"
                  className="px-3"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY_SENTINEL}>Sin categoría</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-expense-account">Cuenta</Label>
              <Select
                value={accountId}
                onValueChange={(value) => { if (value) setAccountId(value); }}
                disabled={loadingOptions || accounts.length === 0}
              >
                <SelectTrigger
                  id="quick-expense-account"
                  aria-label="Cuenta"
                  className="px-3"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length === 0 ? (
                    <SelectItem value={NO_ACCOUNT_SENTINEL}>Sin cuentas</SelectItem>
                  ) : (
                    <>
                      <SelectItem value={NO_ACCOUNT_SENTINEL}>Sin cuenta</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {optionsError && (
            <p className="text-xs text-text-muted" role="status">
              {optionsError}
            </p>
          )}
          {error && (
            <p className="text-sm text-expense" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Guardar gasto
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
