"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
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
import { QuickAccountCreate } from "@/components/QuickAccountCreate";
import type { Account } from "@/types/accounts";
import type { GoalInput, SavingsGoal } from "@/types/goals";

interface GoalDialogProps {
  readonly open: boolean;
  readonly goal: SavingsGoal | null;
  readonly accounts: Account[];
  readonly saving: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (input: GoalInput) => void;
  readonly onAccountCreated: (account: Account) => void;
}

export function GoalDialog({
  open,
  goal,
  accounts,
  saving,
  onOpenChange,
  onSubmit,
  onAccountCreated,
}: Readonly<GoalDialogProps>) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? "");
    setTargetAmount(goal ? String(goal.targetAmount) : "");
    setTargetDate(goal?.targetDate ? goal.targetDate.slice(0, 10) : "");
    setAccountId(goal?.accountId ?? "");
  }, [open, goal]);

  useEffect(() => {
    if (!open || accountId) return;
    if (accounts.length === 1) setAccountId(accounts[0].id);
  }, [open, accountId, accounts]);

  const amount = Number(targetAmount);
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(amount) &&
    amount > 0 &&
    accountId.length > 0;

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;

    onSubmit({
      name: name.trim(),
      targetAmount: amount,
      targetDate: targetDate || null,
      accountId,
    });
  }

  function handleAccountCreated(account: Account) {
    onAccountCreated(account);
    setAccountId(account.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nueva meta de ahorro"}</DialogTitle>
          <DialogDescription>
            {goal
              ? "Cambia el objetivo, la fecha o la cuenta asociada"
              : "Define cuánto quieres ahorrar y para cuándo"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Nombre</Label>
            <Input
              id="goal-name"
              placeholder="Ej: Viaje a Japón"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="goal-amount">Objetivo (€)</Label>
              <Input
                id="goal-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="goal-date">Fecha objetivo</Label>
                <span className="group relative inline-flex">
                  <span
                    role="img"
                    tabIndex={0}
                    aria-label="Más información sobre la fecha objetivo"
                    aria-describedby="goal-date-hint"
                    className="inline-flex cursor-help items-center rounded-sm text-text-muted outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Info className="size-3.5" aria-hidden="true" />
                  </span>
                  <span
                    id="goal-date-hint"
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 translate-y-1 rounded-md bg-text-primary px-2.5 py-1.5 text-center text-xs leading-snug text-white opacity-0 shadow-lg transition-[opacity,transform] duration-150 delay-100 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
                  >
                    Opcional: si la dejas vacía, la meta no tendrá fecha límite.
                  </span>
                </span>
              </div>
              <Input
                id="goal-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-account">Cuenta de ahorro</Label>
            {accounts.length === 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-text-muted">
                  Necesitas una cuenta de ahorro para asociar la meta.
                </p>
                <QuickAccountCreate
                  type="savings"
                  label="+ Nueva cuenta de ahorro"
                  nameLabel="Nombre de la cuenta de ahorro"
                  placeholder="Ej: Ahorro viaje"
                  onCreated={handleAccountCreated}
                />
              </div>
            ) : (
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="goal-account">
                  <SelectValue placeholder="Elige una cuenta de ahorro" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={saving || !valid}>
            {saving ? "Guardando..." : goal ? "Guardar cambios" : "Crear meta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
