"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import type { NotificationRules } from "@/types/notifications";

/** `goalReminder.enabled` es el maestro: el correo se activa con él, nunca sin él. */
type Channel = "app" | "both";

function channelLabel(channel: Channel): string {
  return channel === "app" ? "Solo en la app" : "En la app y por email";
}

interface GoalDialogProps {
  readonly open: boolean;
  readonly goal: SavingsGoal | null;
  readonly accounts: Account[];
  readonly saving: boolean;
  /** Reglas globales de Preferencias: el switch de la meta está subordinado a ellas. */
  readonly notificationRules: NotificationRules;
  readonly onSaveNotificationRules: (rules: NotificationRules) => Promise<void>;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (input: GoalInput) => void;
  readonly onAccountCreated: (account: Account) => void;
}

export function GoalDialog({
  open,
  goal,
  accounts,
  saving,
  notificationRules,
  onSaveNotificationRules,
  onOpenChange,
  onSubmit,
  onAccountCreated,
}: Readonly<GoalDialogProps>) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [reminderDay, setReminderDay] = useState("");
  const [reminderAmount, setReminderAmount] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel>("both");
  const [savingRules, setSavingRules] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? "");
    setTargetAmount(goal ? String(goal.targetAmount) : "");
    setTargetDate(goal?.targetDate ? goal.targetDate.slice(0, 10) : "");
    setAccountId(goal?.accountId ?? "");
    setReminderDay(goal?.reminderDay == null ? "" : String(goal.reminderDay));
    setReminderAmount(goal?.reminderAmount == null ? "" : String(goal.reminderAmount));
    setReminderEnabled(goal?.reminderEnabled ?? false);
    setSelectedChannel(
      notificationRules.goalReminder.enabled && !notificationRules.goalReminder.emailEnabled
        ? "app"
        : "both"
    );
    setSaveError(null);
  }, [open, goal, notificationRules.goalReminder.enabled, notificationRules.goalReminder.emailEnabled]);

  useEffect(() => {
    if (!open || accountId) return;
    if (accounts.length === 1) setAccountId(accounts[0].id);
  }, [open, accountId, accounts]);

  const amount = Number(targetAmount);
  const reminderDayValue = reminderDay === "" ? null : Number(reminderDay);
  const reminderAmountValue = reminderAmount === "" ? null : Number(reminderAmount);
  const dayValid =
    reminderDayValue === null ||
    (Number.isInteger(reminderDayValue) && reminderDayValue >= 1 && reminderDayValue <= 28);
  const amountValid =
    reminderAmountValue === null ||
    (Number.isFinite(reminderAmountValue) && reminderAmountValue > 0);
  const reminderValid = reminderEnabled
    ? reminderDayValue !== null && dayValid && amountValid
    : true;
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(amount) &&
    amount > 0 &&
    accountId.length > 0 &&
    reminderValid;

  function handleReminderToggle(checked: boolean) {
    setReminderEnabled(checked);
    setSelectedChannel(
      notificationRules.goalReminder.enabled && !notificationRules.goalReminder.emailEnabled
        ? "app"
        : "both"
    );
    setSaveError(null);
  }

  function handleChannel(channel: Channel) {
    setSelectedChannel(channel);
    setSaveError(null);
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid || saving) return;

    // El cambio global se aplica al crear/guardar la meta, no al cerrar el sub-modal.
    const nextEmailEnabled = selectedChannel !== "app";
    const needsGlobalSave =
      reminderEnabled &&
      (!notificationRules.goalReminder.enabled ||
        notificationRules.goalReminder.emailEnabled !== nextEmailEnabled);

    if (needsGlobalSave) {
      setSavingRules(true);
      setSaveError(null);
      try {
        await onSaveNotificationRules({
          ...notificationRules,
          goalReminder: {
            enabled: true,
            // `enabled` sigue siendo el maestro: el correo se activa con él.
            emailEnabled: nextEmailEnabled,
          },
        });
      } catch {
        setSaveError("No se pudo activar el aviso global. Revisa tus preferencias.");
        setReminderEnabled(false);
        setSavingRules(false);
        return;
      }
      setSavingRules(false);
    }

    onSubmit({
      name: name.trim(),
      targetAmount: amount,
      targetDate: targetDate || null,
      accountId,
      reminderDay: reminderDayValue,
      reminderAmount: reminderAmountValue,
      reminderEnabled,
    });
  }

  function handleAccountCreated(account: Account) {
    onAccountCreated(account);
    setAccountId(account.id);
  }

  return (
    <>
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

            <div className="space-y-3 rounded-lg border border-border bg-bg-elevated/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium" id="goal-reminder-label">
                  Aviso mensual de esta meta
                </span>
                <Switch
                  id="goal-reminder-enabled"
                  aria-label="Aviso mensual de esta meta"
                  checked={reminderEnabled}
                  onCheckedChange={handleReminderToggle}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-text-secondary">
                  ¿Dónde quieres recibir el aviso?
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Canales del aviso">
                  {(["app", "both"] as Channel[]).map((channel) => {
                    const selected = selectedChannel === channel;
                    return (
                      <Button
                        key={channel}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        size="sm"
                        aria-pressed={selected}
                        disabled={!reminderEnabled}
                        onClick={() => handleChannel(channel)}
                        className="gap-1.5"
                      >
                        {selected && <Check className="size-3" aria-hidden="true" />}
                        {channelLabel(channel)}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="goal-reminder-day">Día del aviso</Label>
                  <Input
                    id="goal-reminder-day"
                    type="number"
                    min="1"
                    max="28"
                    step="1"
                    placeholder="1-28"
                    value={reminderDay}
                    onChange={(e) => setReminderDay(e.target.value)}
                    disabled={!reminderEnabled}
                    required={reminderEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-reminder-amount">Importe sugerido (€)</Label>
                  <Input
                    id="goal-reminder-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Opcional"
                    value={reminderAmount}
                    onChange={(e) => setReminderAmount(e.target.value)}
                    disabled={!reminderEnabled}
                  />
                </div>
              </div>

              {saveError && (
                <p
                  role="alert"
                  aria-label="Error al activar los avisos"
                  className="text-xs font-medium text-expense"
                >
                  {saveError}
                </p>
              )}

              <details className="text-xs text-text-muted">
                <summary className="cursor-pointer font-medium text-text-secondary">
                  Cómo funciona
                </summary>
                <p className="mt-1 leading-snug">
                  El día elegido recibirás un aviso sin importe. Podrás decidir cuánto aportar
                  al confirmarlo y, si quieres, actualizar la sugerencia para los próximos meses.
                </p>
              </details>
            </div>

            <Button type="submit" className="w-full" disabled={saving || savingRules || !valid}>
              {saving ? "Guardando..." : goal ? "Guardar cambios" : "Crear meta"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
