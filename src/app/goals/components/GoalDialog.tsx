"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { describeReminder } from "@/lib/goals";
import { cn } from "@/lib/utils";
import type { Account } from "@/types/accounts";
import type {
  GoalInput,
  GoalReminderChannel,
  GoalReminderFrequency,
  GoalReminderIntervalUnit,
  ReminderSettings,
  SavingsGoal,
} from "@/types/goals";
import type { NotificationRules } from "@/types/notifications";

/** El backend usa 1 = Lunes … 7 = Domingo; en la fila de Figma se ven las iniciales. */
const WEEKDAYS = [
  { value: 1, short: "L", label: "Lunes" },
  { value: 2, short: "M", label: "Martes" },
  { value: 3, short: "X", label: "Miércoles" },
  { value: 4, short: "J", label: "Jueves" },
  { value: 5, short: "V", label: "Viernes" },
  { value: 6, short: "S", label: "Sábado" },
  { value: 7, short: "D", label: "Domingo" },
] as const;

const FREQUENCIES: { value: GoalReminderFrequency; label: string }[] = [
  { value: "WEEKLY", label: "Semanal" },
  { value: "MONTHLY", label: "Mensual" },
  { value: "CUSTOM", label: "Personalizada" },
];

const INTERVAL_UNITS: { value: GoalReminderIntervalUnit; label: string }[] = [
  { value: "DAYS", label: "días" },
  { value: "WEEKS", label: "semanas" },
  { value: "MONTHS", label: "meses" },
];

const CHANNELS: { value: GoalReminderChannel; label: string }[] = [
  { value: "APP_ONLY", label: "Solo en la app" },
  { value: "APP_AND_EMAIL", label: "App y email" },
];

/** Valores del nodo 8:91 de Figma (variante compacta recomendada). */
const FIELD_LABEL = "text-[12px] font-medium leading-[normal] text-[#0f172a]";
const FIELD_CONTROL =
  "h-auto rounded-[8px] border-[#e2e8f0] bg-white px-[12px] py-[9px] text-[13px] leading-[normal] text-[#0f172a] placeholder:text-[#94a3b8]";

const HINT_ID = "reminder-how-hint";
const HINT_TEXT =
  "El aviso llegará en la frecuencia elegida. Podrás decidir cuánto aportar al confirmarlo y, si quieres, actualizar la sugerencia para las próximas ocasiones.";

/**
 * El tooltip se monta en `document.body` con posicionamiento fijo: dentro del modal
 * quedaría recortado por el `overflow-hidden` de la tarjeta y por el scroll del cuerpo.
 */
function ReminderHint() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  function show() {
    const box = triggerRef.current?.getBoundingClientRect();
    if (box) setPosition({ top: box.top - 8, left: box.left + box.width / 2 });
    setOpen(true);
  }

  return (
    <>
      <span
        ref={triggerRef}
        role="img"
        tabIndex={0}
        aria-label="Cómo funciona"
        aria-describedby={HINT_ID}
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        onFocus={show}
        onBlur={() => setOpen(false)}
        className="inline-flex size-4 items-center justify-center rounded-[8px] border border-[#94a3b8] text-[10px] font-semibold leading-[normal] text-[#94a3b8] outline-none focus-visible:ring-2 focus-visible:ring-[#2b6cb0]"
      >
        i
      </span>
      {typeof document !== "undefined" &&
        createPortal(
          <span
            id={HINT_ID}
            role="tooltip"
            style={{ top: position.top, left: position.left, transform: "translate(-50%, -100%)" }}
            className={cn(
              "pointer-events-none fixed z-[100] w-64 rounded-[8px] bg-[#0f172a] px-2.5 py-1.5 text-center text-xs leading-snug text-white shadow-lg transition-opacity duration-150",
              open ? "opacity-100" : "opacity-0"
            )}
          >
            {HINT_TEXT}
          </span>,
          document.body
        )}
    </>
  );
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

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [frequency, setFrequency] = useState<GoalReminderFrequency>("MONTHLY");
  const [channel, setChannel] = useState<GoalReminderChannel>("APP_AND_EMAIL");
  const [weekday, setWeekday] = useState<number | null>(null);
  const [day, setDay] = useState("");
  const [interval, setInterval] = useState("");
  const [unit, setUnit] = useState<GoalReminderIntervalUnit>("WEEKS");
  const [startDate, setStartDate] = useState("");
  const [reminderAmount, setReminderAmount] = useState("");

  const [savingRules, setSavingRules] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const globalGoalEmailEnabled = notificationRules.goalReminder.emailEnabled;

  useEffect(() => {
    if (!open) return;
    setName(goal?.name ?? "");
    setTargetAmount(goal ? String(goal.targetAmount) : "");
    setTargetDate(goal?.targetDate ? goal.targetDate.slice(0, 10) : "");
    setAccountId(goal?.accountId ?? "");
    setReminderEnabled(goal?.reminderEnabled ?? false);
    setFrequency(goal?.reminderFrequency ?? "MONTHLY");
    setChannel(
      goal?.reminderChannel ?? (globalGoalEmailEnabled ? "APP_AND_EMAIL" : "APP_ONLY")
    );
    setWeekday(goal?.reminderWeekday ?? null);
    setDay(goal?.reminderDay == null ? "" : String(goal.reminderDay));
    setInterval(goal?.reminderInterval == null ? "" : String(goal.reminderInterval));
    setUnit(goal?.reminderIntervalUnit ?? "WEEKS");
    setStartDate(goal?.reminderStartDate ? goal.reminderStartDate.slice(0, 10) : "");
    setReminderAmount(goal?.reminderAmount == null ? "" : String(goal.reminderAmount));
    setSaveError(null);
  }, [open, goal, globalGoalEmailEnabled]);

  useEffect(() => {
    if (!open || accountId) return;
    if (accounts.length === 1) setAccountId(accounts[0].id);
  }, [open, accountId, accounts]);

  const amount = Number(targetAmount);
  const reminderAmountValue = reminderAmount === "" ? null : Number(reminderAmount);
  const dayValue = day === "" ? null : Number(day);
  const intervalValue = interval === "" ? null : Number(interval);

  /** Única fuente de verdad para el resumen y para el payload enviado al backend. */
  const settings: ReminderSettings = {
    reminderEnabled,
    reminderFrequency: frequency,
    reminderChannel: channel,
    reminderWeekday: frequency === "WEEKLY" ? weekday : null,
    reminderDay: frequency === "MONTHLY" ? dayValue : null,
    reminderLastDay: false,
    reminderInterval: frequency === "CUSTOM" ? intervalValue : null,
    reminderIntervalUnit:
      frequency === "CUSTOM" && intervalValue !== null ? unit : null,
    reminderStartDate:
      frequency === "CUSTOM" && startDate ? `${startDate}T00:00:00.000Z` : null,
  };

  const amountValid =
    reminderAmountValue === null ||
    (Number.isFinite(reminderAmountValue) && reminderAmountValue > 0);
  const dayValid =
    settings.reminderDay !== null &&
    Number.isInteger(settings.reminderDay) &&
    settings.reminderDay >= 1 &&
    settings.reminderDay <= 31;
  const intervalValid =
    settings.reminderInterval !== null &&
    Number.isInteger(settings.reminderInterval) &&
    settings.reminderInterval > 0 &&
    settings.reminderStartDate !== null;
  const scheduleValid =
    frequency === "WEEKLY"
      ? settings.reminderWeekday !== null
      : frequency === "MONTHLY"
        ? dayValid
        : intervalValid;
  const reminderValid = !reminderEnabled || (scheduleValid && amountValid);
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(amount) &&
    amount > 0 &&
    accountId.length > 0 &&
    reminderValid;

  function clearError() {
    if (saveError) setSaveError(null);
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || saving || savingRules) return;

    const nextEmailEnabled = channel === "APP_AND_EMAIL";
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
      ...settings,
      reminderAmount: reminderAmountValue,
    });
  }

  function handleAccountCreated(account: Account) {
    onAccountCreated(account);
    setAccountId(account.id);
  }

  const dayField = (
    <div className="space-y-[4px]">
      <Label htmlFor="goal-reminder-day" className={FIELD_LABEL}>
        Día del mes
      </Label>
      <Input
        id="goal-reminder-day"
        className={FIELD_CONTROL}
        type="number"
        min="1"
        max="31"
        step="1"
        placeholder="1-31"
        value={day}
        onChange={(event) => setDay(event.target.value)}
      />
    </div>
  );

  const amountField = (
    <div className="space-y-[4px]">
      <Label htmlFor="goal-reminder-amount" className={FIELD_LABEL}>
        Importe sugerido (€)
      </Label>
      <Input
        id="goal-reminder-amount"
        className={FIELD_CONTROL}
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Opcional"
        value={reminderAmount}
        onChange={(event) => setReminderAmount(event.target.value)}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="flex w-[515px] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white p-0 shadow-lg sm:max-w-[515px] sm:p-0"
      >
        <DialogHeader className="shrink-0 gap-0 bg-white px-[20px] pb-0 pr-12 pt-[20px] text-left">
          <DialogTitle className="text-[18px] font-semibold leading-[normal] text-[#0f172a]">
            {goal ? "Editar meta" : "Nueva meta de ahorro"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-[14px] overflow-y-auto px-[20px] pb-[14px] pt-[14px]">
            <div className="space-y-[4px]">
              <Label htmlFor="goal-name" className={FIELD_LABEL}>
                Nombre
              </Label>
              <Input
                id="goal-name"
                className={FIELD_CONTROL}
                placeholder="Viaje a Japón"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-[12px]">
              <div className="space-y-[4px]">
                <Label htmlFor="goal-amount" className={FIELD_LABEL}>
                  Objetivo (€)
                </Label>
                <Input
                  id="goal-amount"
                  className={FIELD_CONTROL}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-[4px]">
                <Label htmlFor="goal-date" className={FIELD_LABEL}>
                  Fecha objetivo
                </Label>
                <Input
                  id="goal-date"
                  className={FIELD_CONTROL}
                  type="date"
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-[4px]">
              <Label htmlFor="goal-account" className={FIELD_LABEL}>
                Cuenta de ahorro
              </Label>
              {accounts.length === 0 ? (
                <div className="space-y-[8px]">
                  <p className="text-[12px] text-[#64748b]">
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
                  <SelectTrigger id="goal-account" className={FIELD_CONTROL}>
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

            <section className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-[14px] py-[12px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[6px]">
                  <span className="text-[14px] font-medium leading-[normal] text-[#0f172a]">
                    Recordatorio de aportación
                  </span>
                  <ReminderHint />
                </div>
                <Switch
                  aria-label="Recordatorio de aportación"
                  checked={reminderEnabled}
                  onCheckedChange={(checked) => {
                    setReminderEnabled(checked);
                    clearError();
                  }}
                />
              </div>

              {reminderEnabled && (
                <div className="mt-[12px] space-y-[12px]">
                  <div className="grid grid-cols-2 gap-[12px]">
                    <div className="space-y-[4px]">
                      <Label htmlFor="goal-reminder-channel" className={FIELD_LABEL}>
                        Canal
                      </Label>
                      <Select
                        value={channel}
                        onValueChange={(value) => {
                          setChannel(value as GoalReminderChannel);
                          clearError();
                        }}
                      >
                        <SelectTrigger
                          id="goal-reminder-channel"
                          aria-label="Canal"
                          className={FIELD_CONTROL}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANNELS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-[4px]">
                      <Label htmlFor="goal-reminder-frequency" className={FIELD_LABEL}>
                        Frecuencia
                      </Label>
                      <Select
                        value={frequency}
                        onValueChange={(value) => {
                          setFrequency(value as GoalReminderFrequency);
                          clearError();
                        }}
                      >
                        <SelectTrigger
                          id="goal-reminder-frequency"
                          aria-label="Frecuencia"
                          className={FIELD_CONTROL}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIES.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {frequency === "WEEKLY" && (
                    <div className="space-y-[4px]">
                      <p className={FIELD_LABEL}>Día de la semana</p>
                      <div className="flex flex-wrap gap-[8px]">
                        {WEEKDAYS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            aria-label={option.label}
                            aria-pressed={weekday === option.value}
                            onClick={() => {
                              setWeekday(option.value);
                              clearError();
                            }}
                            className={cn(
                              "flex size-9 items-center justify-center rounded-[18px] border text-[13px] font-medium leading-[normal] transition-colors",
                              weekday === option.value
                                ? "border-[#2b6cb0] bg-[#2b6cb0] text-white"
                                : "border-[#e2e8f0] bg-white text-[#334155] hover:bg-[#eaf2fb]"
                            )}
                          >
                            {option.short}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {frequency === "MONTHLY" && (
                    <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
                      {dayField}
                      {amountField}
                    </div>
                  )}

                  {frequency === "CUSTOM" && (
                    <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
                      <div className="space-y-[4px]">
                        <Label htmlFor="goal-reminder-interval" className={FIELD_LABEL}>
                          Repetir cada
                        </Label>
                        <div className="flex min-w-0 gap-[8px]">
                          <Input
                            id="goal-reminder-interval"
                            className={FIELD_CONTROL}
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            value={interval}
                            onChange={(event) => setInterval(event.target.value)}
                          />
                          <Select
                            value={unit}
                            onValueChange={(value) =>
                              setUnit(value as GoalReminderIntervalUnit)
                            }
                          >
                            <SelectTrigger
                              aria-label="Unidad del intervalo"
                              className={FIELD_CONTROL}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {INTERVAL_UNITS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-[4px]">
                        <Label htmlFor="goal-reminder-start" className={FIELD_LABEL}>
                          Empezar el
                        </Label>
                        <Input
                          id="goal-reminder-start"
                          className={FIELD_CONTROL}
                          type="date"
                          value={startDate}
                          onChange={(event) => setStartDate(event.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {frequency !== "MONTHLY" && amountField}

                  <p className="text-[12px] leading-[17px] text-[#1e4e80]">
                    {describeReminder(settings)}
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="shrink-0 space-y-[8px] bg-white px-[20px] pb-[20px] pt-[14px]">
            {saveError && (
              <p
                role="alert"
                aria-label="Error al activar los avisos"
                className="text-[12px] font-medium text-[#b91c1c]"
              >
                {saveError}
              </p>
            )}
            <Button
              type="submit"
              className="h-auto w-full rounded-[10px] bg-[#2b6cb0] px-[24px] py-[12px] text-[14px] font-semibold text-white hover:bg-[#245a94]"
              disabled={saving || savingRules || !valid}
            >
              {saving ? "Guardando..." : goal ? "Guardar cambios" : "Crear meta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
