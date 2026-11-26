"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import { freqLabels } from "@/lib/constants";
import {
  getNextChargeDate,
  getNextChargeDateFromPayments,
  toDateInputValue,
} from "@/lib/subscriptions";
import { SubscriptionSteps } from "./SubscriptionSteps";
import { LinkTransactionsStep } from "./LinkTransactionsStep";
import type { EditSubscriptionDialogProps } from "./types/EditSubscriptionDialog.types";
import type { SearchTx, Subscription, SubscriptionKind } from "@/types/subscriptions";

const KIND_OPTIONS: Array<{
  value: SubscriptionKind;
  label: string;
  description: string;
}> = [
  {
    value: "subscription",
    label: "Suscripción",
    description: "Servicio que contratas y puedes cancelar.",
  },
  {
    value: "recurring",
    label: "Pago recurrente",
    description: "Pago periódico que debes afrontar.",
  },
];

function initialNextChargeDate(subscription: Subscription): string {
  return toDateInputValue(getNextChargeDate(subscription) ?? new Date());
}

function formatChargeLabel(date: Date | null): string | null {
  if (!date) return null;
  return format(date, "d MMM yyyy", { locale: es });
}

export function EditSubscriptionDialog({
  subscription,
  existingNames,
  open,
  onOpenChange,
  onSaved,
}: Readonly<EditSubscriptionDialogProps>) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(subscription.name);
  const [amount, setAmount] = useState(String(subscription.amount));
  const [frequency, setFrequency] = useState<string>(subscription.frequency);
  const [kind, setKind] = useState<SubscriptionKind>(subscription.kind ?? "subscription");
  const [estimated, setEstimated] = useState(subscription.estimated ?? false);
  const [nextChargeDate, setNextChargeDate] = useState(() => initialNextChargeDate(subscription));
  const [nextChargeDateTouched, setNextChargeDateTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchTx[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showRenameWarning, setShowRenameWarning] = useState(false);
  const [shouldUnlink, setShouldUnlink] = useState(false);

  useEffect(() => {
    setName(subscription.name);
    setAmount(String(subscription.amount));
    setFrequency(subscription.frequency);
    setKind(subscription.kind ?? "subscription");
    setEstimated(subscription.estimated ?? false);
    setNextChargeDate(initialNextChargeDate(subscription));
    setNextChargeDateTouched(false);
    setStep(1);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedIds([]);
    setError(null);
    setShowRenameWarning(false);
    setShouldUnlink(false);
  }, [subscription]);

  function handleNameChange(value: string) {
    setName(value);
    if (error) setError(null);
    if (showRenameWarning) setShowRenameWarning(false);
  }

  function nameMatchesLinkedTxs(): boolean {
    const normalized = name.trim().toUpperCase();
    if (!normalized) return false;
    for (const description of subscription.matchDescriptions ?? []) {
      const other = description.toUpperCase();
      if (
        normalized === other ||
        (normalized.length >= 3 && other.includes(normalized)) ||
        (other.length >= 3 && normalized.includes(other))
      ) {
        return true;
      }
    }
    return false;
  }

  function isSameAmount(tx: SearchTx): boolean {
    const expected = Number(amount);
    return Boolean(expected) && Math.abs(Math.abs(tx.amount) - expected) <= 0.01;
  }

  async function handleSearch(query: string = searchQuery) {
    const term = query.trim();
    if (!term) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/v1/transactions?search=${encodeURIComponent(term)}&limit=20`);
      if (!res.ok) throw new Error("Error al buscar transacciones");
      const data = await res.json();
      const all = ((data.data || []) as SearchTx[]).filter((tx) => !tx.subscriptionId);
      setSearchResults(all);
      const matching = all.filter(isSameAmount);
      setSelectedIds(matching.map((tx) => tx.id));
      if (!nextChargeDateTouched) {
        const next = getNextChargeDateFromPayments(
          matching,
          frequency as Subscription["frequency"]
        );
        if (next) setNextChargeDate(toDateInputValue(next));
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function goToSecondStep(query: string = name.trim()) {
    setSearchQuery(query);
    setStep(2);
    await handleSearch(query);
  }

  function handleNext() {
    if (!name.trim() || !amount || !nextChargeDate) return;

    const normalized = name.trim().toUpperCase();
    const isDuplicate = existingNames.some((existingName) => {
      if (existingName.toUpperCase() === subscription.name.toUpperCase()) return false;
      const existing = existingName.toUpperCase();
      return (
        normalized === existing ||
        (normalized.length >= 3 && existing.includes(normalized)) ||
        (existing.length >= 3 && normalized.includes(existing))
      );
    });
    if (isDuplicate) {
      setError("Ya existe otra suscripcion con un nombre similar");
      return;
    }

    const nameChanged = normalized !== subscription.name.toUpperCase();
    if (nameChanged && !nameMatchesLinkedTxs()) {
      setShowRenameWarning(true);
      return;
    }

    void goToSecondStep();
  }

  function handleToggle(tx: SearchTx) {
    const ids = selectedIds.includes(tx.id)
      ? selectedIds.filter((id) => id !== tx.id)
      : [...selectedIds, tx.id];
    setSelectedIds(ids);
    if (!nextChargeDateTouched) {
      const chosen = searchResults.filter((candidate) => ids.includes(candidate.id));
      const next = getNextChargeDateFromPayments(chosen, frequency as Subscription["frequency"]);
      if (next) setNextChargeDate(toDateInputValue(next));
    }
  }

  async function handleSave(ids: string[] = selectedIds) {
    setSaving(true);
    setError(null);
    try {
      const updateData: Parameters<typeof api.subscriptions.update>[1] & { matchDescriptions?: string[] } = {
        name: name.trim(),
        amount: Number(amount),
        frequency,
        kind,
        estimated,
        nextChargeDate,
      };

      if (shouldUnlink) {
        await api.subscriptions.unlinkTransactions(subscription.id);
        updateData.matchDescriptions = [];
      }

      await api.subscriptions.update(subscription.id, updateData);

      const chosen = searchResults.filter((tx) => ids.includes(tx.id));
      for (const tx of chosen) {
        await api.subscriptions.confirmMatch(subscription.id, tx.description, tx.id);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  }

  const chosen = searchResults.filter((tx) => selectedIds.includes(tx.id));
  const previewDate = getNextChargeDateFromPayments(
    chosen,
    frequency as Subscription["frequency"]
  ) ?? (nextChargeDate ? new Date(`${nextChargeDate}T00:00:00`) : null);
  const nextChargeLabel = formatChargeLabel(previewDate);
  const saveLabel = chosen.length === 0
    ? "Guardar"
    : `Guardar con ${chosen.length} ${chosen.length === 1 ? "pago" : "pagos"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Editar suscripción</DialogTitle>
              <DialogDescription>Paso 1 de 2</DialogDescription>
            </DialogHeader>

            <SubscriptionSteps current={1} />

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[13px] font-medium text-text-primary">Tipo</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {KIND_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer gap-2 rounded-xl border border-border bg-white p-3.5 has-[:checked]:border-primary has-[:checked]:bg-primary-light/20"
                    >
                      <input
                        type="radio"
                        name="kind"
                        value={option.value}
                        checked={kind === option.value}
                        onChange={() => setKind(option.value)}
                        className="mt-0.5 size-4 shrink-0 accent-primary"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-text-primary">
                          {option.label}
                        </span>
                        <span className="mt-1 block text-xs leading-normal text-text-muted">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                />
                {(subscription.matchDescriptions ?? []).length > 0 && (
                  <p className="text-xs text-text-muted">
                    En tu banco aparece como {subscription.matchDescriptions![0]}.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-amount">Importe</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-frequency">Frecuencia</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger id="edit-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(freqLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-estimated"
                  aria-label="Importe estimado"
                  checked={estimated}
                  onCheckedChange={(checked) => setEstimated(checked === true)}
                />
                <Label htmlFor="edit-estimated">Importe estimado</Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-next-charge">Próximo cobro</Label>
                <Input
                  id="edit-next-charge"
                  type="date"
                  value={nextChargeDate}
                  onChange={(event) => {
                    setNextChargeDate(event.target.value);
                    setNextChargeDateTouched(true);
                  }}
                />
              </div>

              {showRenameWarning && (
                <div className="rounded-lg border border-warning/20 bg-warning/10 p-3.5 space-y-3">
                  <div className="flex items-start gap-2">
                    <TriangleAlert className="size-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-warning">Nombre no coincide</p>
                      <p className="mt-1 text-xs text-warning/80">
                        &quot;{name.trim()}&quot; no coincide con las transacciones vinculadas.
                        Se desvincularán las actuales y se buscarán las del nuevo nombre.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowRenameWarning(false)}>
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setShouldUnlink(true);
                        setShowRenameWarning(false);
                        void goToSecondStep();
                      }}
                    >
                      Sí, continuar
                    </Button>
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-expense">{error}</p>}

              <div className="flex justify-between gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleNext}>
                  Siguiente: pagos anteriores &rarr;
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <LinkTransactionsStep
            title="Editar suscripción"
            name={name}
            searchQuery={searchQuery}
            searchResults={searchResults}
            selectedIds={selectedIds}
            searchLoading={searchLoading}
            searchError={null}
            error={error}
            saving={saving}
            saveLabel={saveLabel}
            savingLabel="Guardando..."
            referenceAmount={Number(amount)}
            nextChargeLabel={nextChargeLabel}
            onSearchQueryChange={setSearchQuery}
            onSearch={() => void handleSearch()}
            onToggle={handleToggle}
            onBack={() => setStep(1)}
            onSave={() => void handleSave()}
            onSaveWithoutLinks={() => void handleSave([])}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
