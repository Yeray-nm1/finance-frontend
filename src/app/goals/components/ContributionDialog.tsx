"use client";

import { useEffect, useMemo, useState } from "react";
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
import { QuickAccountCreate } from "@/components/QuickAccountCreate";
import { formatCurrency } from "@/lib/format";
import { todayInputValue } from "@/lib/goals";
import type { Account } from "@/types/accounts";
import type { GoalContributionInput, SavingsGoal } from "@/types/goals";

interface ContributionDialogProps {
  readonly open: boolean;
  readonly goal: SavingsGoal | null;
  readonly accounts: Account[];
  readonly saving: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (input: GoalContributionInput) => void;
  readonly onAccountCreated: (account: Account) => void;
}

export function ContributionDialog({
  open,
  goal,
  accounts,
  saving,
  onOpenChange,
  onSubmit,
  onAccountCreated,
}: Readonly<ContributionDialogProps>) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [accountId, setAccountId] = useState("");

  const eligibleAccounts = useMemo(
    () => accounts.filter((account) => account.id !== goal?.accountId),
    [accounts, goal?.accountId]
  );

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setDate(todayInputValue());
    setAccountId("");
  }, [open, goal?.id]);

  useEffect(() => {
    if (!open || accountId) return;

    const preferred =
      eligibleAccounts.find((account) => account.type === "checking") ??
      eligibleAccounts[0];

    if (preferred) setAccountId(preferred.id);
  }, [open, accountId, eligibleAccounts]);

  const parsedAmount = Number(amount);
  const valid =
    parsedAmount > 0 &&
    Number.isFinite(parsedAmount) &&
    date.length > 0 &&
    accountId.length > 0;

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;

    onSubmit({ amount: parsedAmount, date, accountId });
  }

  function handleAccountCreated(account: Account) {
    onAccountCreated(account);
    setAccountId(account.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aportar a {goal?.name ?? "la meta"}</DialogTitle>
          <DialogDescription>
            {goal?.account
              ? `El importe se transferirá a ${goal.account.name}.`
              : "La meta no tiene una cuenta de ahorro asociada."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contribution-amount">Importe (€)</Label>
              <Input
                id="contribution-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contribution-date">Fecha</Label>
              <Input
                id="contribution-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contribution-account">Cuenta origen</Label>
            {eligibleAccounts.length === 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-text-muted">
                  Necesitas otra cuenta desde la que transferir.
                </p>
                <QuickAccountCreate
                  label="+ Nueva cuenta de origen"
                  nameLabel="Nombre de la cuenta de origen"
                  onCreated={handleAccountCreated}
                />
              </div>
            ) : (
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="contribution-account">
                  <SelectValue placeholder="Elige la cuenta origen" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {goal?.account && (
            <p className="rounded-md bg-bg-elevated px-3 py-2 text-xs text-text-muted">
              Destino: {goal.account.name} · Faltan {formatCurrency(goal.remaining)}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={saving || !valid}>
            {saving ? "Registrando..." : "Registrar aportación"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
