"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { freqLabels } from "@/lib/constants";
import { LinkTransactionsStep } from "./LinkTransactionsStep";
import type { SearchTx, PendingLink, CreateSubscriptionDialogProps } from "@/types/subscriptions";

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
  const [searchResults, setSearchResults] = useState<SearchTx[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  function resetForm() {
    setStep(1);
    setName("");
    setAmount("");
    setFrequency("monthly");
    setSearchResults([]);
    setSearchLoading(false);
    setSearchError(null);
    setPendingLinks([]);
    setSaving(false);
    setError(null);
    setDuplicateError(null);
  }

  function handleOpenChange(open: boolean) {
    if (!open) resetForm();
    onOpenChange(open);
  }

  function handleNameChange(value: string) {
    setName(value);
    if (duplicateError) setDuplicateError(null);
  }

  function handleNext() {
    if (!name.trim() || !amount) return;
    const normalized = name.trim().toUpperCase();
    const isDuplicate = existingNames.some((n) => {
      const existing = n.toUpperCase();
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
    setStep(2);
  }

  async function handleSearch() {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/v1/transactions?search=${encodeURIComponent(name.trim())}&limit=20`
      );
      if (!res.ok) throw new Error('Error al buscar transacciones');
      const data = await res.json();
      const all = (data.data || []) as SearchTx[];
      const linkedIds = new Set(pendingLinks.map((l) => l.id));
      setSearchResults(all.filter((tx) => !tx.subscriptionId && !linkedIds.has(tx.id)));
    } catch {
      setSearchError("Error al buscar transacciones");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  function handleAddPending(txId: string, txDescription: string, txAmount: number, txDate: string) {
    setPendingLinks((prev) => [...prev, { id: txId, description: txDescription, amount: txAmount, date: txDate }]);
    setSearchResults((prev) => prev.filter((tx) => tx.id !== txId));
    setName(txDescription);
  }

  function handleLinkAll() {
    const remaining = [...searchResults];
    setSearchResults([]);
    setPendingLinks((prev) => [...prev, ...remaining.map((tx) => ({ id: tx.id, description: tx.description, amount: tx.amount, date: tx.date }))]);
    if (remaining.length > 0) {
      setName(remaining.at(-1)!.description);
    }
  }

  function handleRemovePending(txId: string) {
    setPendingLinks((prev) => prev.filter((l) => l.id !== txId));
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const finalAmount = pendingLinks.length > 0
        ? Math.abs([...pendingLinks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].amount)
        : Number(amount);

      const sub = await api.subscriptions.create({
        name: name.trim(),
        amount: finalAmount,
        frequency,
      });

      for (const link of pendingLinks) {
        await api.subscriptions.confirmMatch(sub.id, link.description, link.id);
      }

      onCreated();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear suscripcion");
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    setStep(1);
  }

  const canGoNext = name.trim().length > 0 && amount.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Nueva Suscripcion</DialogTitle>
              <DialogDescription>Crea un pago recurrente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Ej: Netflix"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
                {duplicateError && (
                  <p className="text-sm text-expense">{duplicateError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Importe</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Frecuencia</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(freqLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleNext} disabled={!canGoNext}>
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <LinkTransactionsStep
            name={name}
            pendingLinks={pendingLinks}
            searchResults={searchResults}
            searchLoading={searchLoading}
            searchError={searchError}
            error={error}
            saving={saving}
            saveLabel="Crear"
            savingLabel="Creando..."
            onSearch={handleSearch}
            onLinkAll={handleLinkAll}
            onAddPending={handleAddPending}
            onRemovePending={handleRemovePending}
            onBack={handleBack}
            onSave={handleCreate}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
