"use client";

import { useState } from "react";
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
import { api } from "@/lib/api";
import { freqLabels } from "@/lib/constants";
import {
  getNextChargeDateFromPayments,
  toDateInputValue,
} from "@/lib/subscriptions";
import { SubscriptionSteps } from "./SubscriptionSteps";
import { LinkTransactionsStep } from "./LinkTransactionsStep";
import type { CreateSubscriptionDialogProps } from "./types/CreateSubscriptionDialog.types";
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

function initialDate(): string {
  return toDateInputValue(new Date());
}

function formatChargeLabel(date: Date | null): string | null {
  if (!date) return null;
  return format(date, "d MMM yyyy", { locale: es });
}

export function CreateSubscriptionDialog({
  open,
  onOpenChange,
  onCreated,
  existingNames,
}: Readonly<CreateSubscriptionDialogProps>) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [kind, setKind] = useState<SubscriptionKind>("subscription");
  const [estimated, setEstimated] = useState(false);
  const [nextChargeDate, setNextChargeDate] = useState(initialDate);
  const [nextChargeDateTouched, setNextChargeDateTouched] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchTx[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  function resetForm() {
    setStep(1);
    setName("");
    setAmount("");
    setFrequency("monthly");
    setKind("subscription");
    setEstimated(false);
    setNextChargeDate(initialDate());
    setNextChargeDateTouched(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedIds([]);
    setSearchLoading(false);
    setSearchError(null);
    setSaving(false);
    setError(null);
    setDuplicateError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function handleNameChange(value: string) {
    setName(value);
    if (duplicateError) setDuplicateError(null);
  }

  function isSameAmount(tx: SearchTx): boolean {
    const expected = Number(amount);
    return Boolean(expected) && Math.abs(Math.abs(tx.amount) - expected) <= 0.01;
  }

  async function handleSearch(query: string = searchQuery) {
    const term = query.trim();
    if (!term) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/v1/transactions?search=${encodeURIComponent(term)}&limit=20`
      );
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
      setSearchError("Error al buscar transacciones");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleNext() {
    if (!name.trim() || !amount || !nextChargeDate) return;
    const normalized = name.trim().toUpperCase();
    const isDuplicate = existingNames.some((existingName) => {
      const existing = existingName.toUpperCase();
      return (
        normalized === existing ||
        (normalized.length >= 3 && existing.includes(normalized)) ||
        (existing.length >= 3 && normalized.includes(existing))
      );
    });
    if (isDuplicate) {
      setDuplicateError("Ya existe una suscripcion con ese nombre");
      return;
    }
    setSearchQuery(name.trim());
    setStep(2);
    await handleSearch(name.trim());
  }

  function handleToggle(tx: SearchTx) {
    const wasSelected = selectedIds.includes(tx.id);
    const ids = wasSelected
      ? selectedIds.filter((id) => id !== tx.id)
      : [...selectedIds, tx.id];
    setSelectedIds(ids);
    if (!nextChargeDateTouched) {
      const chosen = searchResults.filter((candidate) => ids.includes(candidate.id));
      const next = getNextChargeDateFromPayments(chosen, frequency as Subscription["frequency"]);
      if (next) setNextChargeDate(toDateInputValue(next));
    }
  }

  async function handleCreate(ids: string[] = selectedIds) {
    setSaving(true);
    setError(null);
    try {
      const chosen = searchResults.filter((tx) => ids.includes(tx.id));
      const sub = await api.subscriptions.create({
        name: name.trim(),
        amount: Number(amount),
        frequency,
        kind,
        estimated,
        nextChargeDate,
      });

      for (const tx of chosen) {
        await api.subscriptions.confirmMatch(sub.id, tx.description, tx.id);
      }

      onCreated();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear suscripcion");
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Nueva suscripción</DialogTitle>
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
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Ej: Disney+"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                />
                {duplicateError && (
                  <p className="text-xs text-expense">{duplicateError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="amount">Importe</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger id="frequency">
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
                  id="estimated"
                  aria-label="Importe estimado"
                  checked={estimated}
                  onCheckedChange={(checked) => setEstimated(checked === true)}
                />
                <Label htmlFor="estimated">Importe estimado</Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nextChargeDate">Próximo cobro</Label>
                <Input
                  id="nextChargeDate"
                  type="date"
                  value={nextChargeDate}
                  onChange={(event) => {
                    setNextChargeDate(event.target.value);
                    setNextChargeDateTouched(true);
                  }}
                />
                <p className="text-xs text-text-muted">
                  Indica cuándo te cobran. Si vinculas pagos, se ajustará desde el más reciente.
                </p>
              </div>

              <div className="flex justify-between gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleNext()}
                  disabled={!name.trim() || !amount || !nextChargeDate}
                >
                  Siguiente: pagos anteriores &rarr;
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <LinkTransactionsStep
            title="Nueva suscripción"
            name={name}
            searchQuery={searchQuery}
            searchResults={searchResults}
            selectedIds={selectedIds}
            searchLoading={searchLoading}
            searchError={searchError}
            error={error}
            saving={saving}
            saveLabel={saveLabel}
            savingLabel="Creando..."
            referenceAmount={Number(amount)}
            nextChargeLabel={nextChargeLabel}
            onSearchQueryChange={setSearchQuery}
            onSearch={() => void handleSearch()}
            onToggle={handleToggle}
            onBack={() => setStep(1)}
            onSave={() => void handleCreate()}
            onSaveWithoutLinks={() => void handleCreate([])}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
