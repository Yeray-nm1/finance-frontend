"use client";

import { useState, useEffect } from "react";
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
import { TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import type { SearchTx, PendingLink, EditSubscriptionDialogProps } from "@/types/subscriptions";
import { freqLabels } from "@/lib/constants";
import { LinkTransactionsStep } from "./LinkTransactionsStep";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<SearchTx[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [showRenameWarning, setShowRenameWarning] = useState(false);
  const [shouldUnlink, setShouldUnlink] = useState(false);

  useEffect(() => {
    setName(subscription.name);
    setAmount(String(subscription.amount));
    setFrequency(subscription.frequency);
    setStep(1);
    setSearchResults([]);
    setPendingLinks([]);
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
    for (const md of (subscription.matchDescriptions ?? [])) {
      const normMd = md.toUpperCase();
      if (
        normalized === normMd ||
        (normalized.length >= 3 && normMd.includes(normalized)) ||
        (normMd.length >= 3 && normalized.includes(normMd))
      ) {
        return true;
      }
    }
    return false;
  }

  function handleNext() {
    if (!name.trim() || !amount) return;

    const normalized = name.trim().toUpperCase();
    const isDuplicate = existingNames.some((n) => {
      if (n.toUpperCase() === subscription.name.toUpperCase()) return false;
      const existing = n.toUpperCase();
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

    const nameChanged = name.trim().toUpperCase() !== subscription.name.toUpperCase();
    if (nameChanged && !nameMatchesLinkedTxs()) {
      setShowRenameWarning(true);
      return;
    }

    setStep(2);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updateData: Parameters<typeof api.subscriptions.update>[1] & { matchDescriptions?: string[] } = {
        name: name.trim(),
        amount: Number(amount),
        frequency,
      };

      if (shouldUnlink) {
        await api.subscriptions.unlinkTransactions(subscription.id);
        updateData.matchDescriptions = [];
      }

      if (pendingLinks.length > 0) {
        const newest = [...pendingLinks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        updateData.amount = Math.abs(newest.amount);
      }

      await api.subscriptions.update(subscription.id, updateData);

      for (const link of pendingLinks) {
        await api.subscriptions.confirmMatch(subscription.id, link.description, link.id);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  }

  async function handleSearch() {
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/v1/transactions?search=${encodeURIComponent(name.trim())}&limit=20`);
      if (!res.ok) throw new Error('Error al buscar transacciones');
      const data = await res.json();
      const all = (data.data || []) as typeof searchResults;
      const linkedIds = new Set(pendingLinks.map((l) => l.id));
      setSearchResults(all.filter((tx) => !tx.subscriptionId && !linkedIds.has(tx.id)));
    } catch {
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

  function handleBack() {
    setStep(1);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>Editar Suscripcion</DialogTitle>
              <DialogDescription>Modifica los datos de la suscripcion</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={name} onChange={(e) => handleNameChange(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Importe</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
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

              {showRenameWarning && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <TriangleAlert className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Nombre no coincide</p>
                      <p className="text-xs text-amber-700 mt-1">
                        &quot;{name.trim()}&quot; no coincide con las transacciones vinculadas. 
                        Se desvincularan las transacciones actuales y se vincularan las del nuevo nombre (si las hay).
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowRenameWarning(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={() => { setShouldUnlink(true); setShowRenameWarning(false); setStep(2); }}>
                      Si, continuar
                    </Button>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-expense">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleNext}>
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
            searchError={null}
            error={error}
            saving={saving}
            saveLabel="Guardar"
            savingLabel="Guardando..."
            onSearch={handleSearch}
            onLinkAll={handleLinkAll}
            onAddPending={handleAddPending}
            onRemovePending={handleRemovePending}
            onBack={handleBack}
            onSave={handleSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
