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
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Check, TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import type { SubscriptionCandidate, DetectCandidatesModalProps } from "@/types/subscriptions";
import { formatCurrency } from "@/lib/format";
import { freqLabels } from "@/lib/constants";

export function DetectCandidatesModal({ open, onOpenChange, onConfirm }: Readonly<DetectCandidatesModalProps>) {
  const [candidates, setCandidates] = useState<SubscriptionCandidate[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCandidates([]);
      setDetecting(false);
      setSaving(false);
      setSelected(new Set());
      setError(null);
    }
  }, [open]);

  async function handleDetect() {
    setDetecting(true);
    setError(null);
    try {
      const res = await api.subscriptions.detect();
      setCandidates(res.candidates);
      setSelected(new Set(res.candidates.filter((c) => !c.exists).map((c) => c.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al detectar suscripciones");
    } finally {
      setDetecting(false);
    }
  }

  function toggleCandidate(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleSave() {
    const toSave = candidates.filter((c) => selected.has(c.name));
    if (toSave.length === 0) return;
    setSaving(true);
    try {
      await api.subscriptions.saveDetected(toSave.map((c) => ({
        name: c.name,
        amount: c.amount,
        frequency: c.frequency,
      })));
      onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar suscripciones");
    } finally {
      setSaving(false);
    }
  }

  const plural = selected.size > 1 ? "s" : "";
  const saveLabel = saving
    ? "Guardando..."
    : `Guardar ${selected.size} seleccionada${plural}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detectar Suscripciones</DialogTitle>
          <DialogDescription>
            Analiza tus transacciones para encontrar pagos recurrentes
          </DialogDescription>
        </DialogHeader>

        {!detecting && candidates.length === 0 && !error && (
          <div className="flex flex-col items-center py-8 gap-4">
            <p className="text-sm text-text-muted text-center">
              Pulsa el boton para analizar tus transacciones y encontrar posibles suscripciones
            </p>
            <Button onClick={handleDetect}>
              Analizar transacciones
            </Button>
          </div>
        )}

        {detecting && (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="size-5 animate-spin text-text-muted" />
            <p className="text-sm text-text-muted">Analizando transacciones...</p>
          </div>
        )}

        {error && (
          <div className="py-4">
            <p className="text-sm text-expense">{error}</p>
            <Button variant="outline" size="sm" onClick={handleDetect} className="mt-2">
              Reintentar
            </Button>
          </div>
        )}

        {candidates.length > 0 && !detecting && (
          <>
            <div className="space-y-2">
              {candidates.map((c) => {
                const isSelected = selected.has(c.name);
                const existingAmount = c.existingAmount ?? 0;
                const hasVariance = c.exists && existingAmount > 0 && c.amount !== existingAmount;
                const canToggle = !c.exists || hasVariance;
                return (
                  <Card key={c.name} className="transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm text-text-primary">{c.name}</h3>
                            {hasVariance && (
                              <TriangleAlert className="size-4 text-amber-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">
                            {formatCurrency(c.amount)} · {freqLabels[c.frequency]}
                          </p>
                          {c.transactions.length > 0 && (
                            <p className="text-xs text-text-muted mt-0.5">
                              Basado en {c.transactions.length} transaccion{c.transactions.length > 1 ? "es" : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {c.exists && !hasVariance && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700">
                              Ya existe
                            </span>
                          )}
                          {canToggle && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleCandidate(c.name)}
                              className={`size-8 rounded-full ${
                                isSelected ? "bg-income text-white hover:bg-income/90" : ""
                              }`}
                              title={isSelected ? "Quitar seleccion" : "Seleccionar para guardar"}
                            >
                              {isSelected ? <Check className="size-4" /> : <Plus className="size-4" />}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Button className="w-full mt-4" onClick={handleSave} disabled={saving || selected.size === 0}>
              {saveLabel}
            </Button>

          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
