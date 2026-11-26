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
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { DetectCandidatesModalProps } from "./types/DetectCandidatesModal.types";
import type { SubscriptionCandidate } from "@/types/subscriptions";
import { formatCurrency } from "@/lib/format";
import { freqLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";

const VARIABLE_EXPENSE_WORDS = [
  "mercadona", "supermercado", "carrefour", "lidl", "aldi", "dia ", "alcampo",
];

function getWarning(candidate: SubscriptionCandidate): string | null {
  const name = candidate.name.toLowerCase();
  if (VARIABLE_EXPENSE_WORDS.some((word) => name.includes(word))) {
    return "Parece un gasto variable (supermercado)";
  }
  if (candidate.transactions.length < 3) {
    return "Pocos movimientos: confianza baja";
  }
  if (candidate.confidence < 0.6) {
    return "Confianza baja en la detección";
  }
  return null;
}

export function DetectCandidatesModal({ open, onOpenChange, onConfirm }: Readonly<DetectCandidatesModalProps>) {
  const [candidates, setCandidates] = useState<SubscriptionCandidate[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showExisting, setShowExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setCandidates([]);
    setSelected(new Set());
    setShowExisting(false);
    setError(null);
    setDetecting(true);

    api.subscriptions.detect()
      .then((res) => {
        if (!active) return;
        setCandidates(res.candidates);
        const firstNew = res.candidates.find((candidate) => !candidate.exists);
        setSelected(new Set(firstNew ? [firstNew.name] : []));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Error al detectar suscripciones");
      })
      .finally(() => {
        if (active) setDetecting(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  function toggleCandidate(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleSave() {
    const toSave = candidates.filter((candidate) => selected.has(candidate.name) && !candidate.exists);
    if (toSave.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await api.subscriptions.saveDetected(toSave.map((candidate) => ({
        name: candidate.name,
        amount: candidate.amount,
        frequency: candidate.frequency,
      })));
      onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar suscripciones");
    } finally {
      setSaving(false);
    }
  }

  const newCandidates = candidates.filter((candidate) => !candidate.exists);
  const existingCandidates = candidates.filter((candidate) => candidate.exists);
  const visibleCandidates = showExisting ? candidates : newCandidates;
  const plural = selected.size > 1 ? "s" : "";
  const saveLabel = saving
    ? "Guardando..."
    : `Guardar ${selected.size} seleccionada${plural}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,.12)] sm:max-w-[560px]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-[18px] font-semibold">Detectar suscripciones</DialogTitle>
          <DialogDescription className="mt-1 text-sm">
            {detecting
              ? "Analizando tus transacciones..."
              : `Hemos encontrado ${newCandidates.length} pagos nuevos que se repiten. Los ${existingCandidates.length} que ya tienes están ocultos.`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="shrink-0" role="alert">
            <p className="text-sm text-expense">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        )}

        {detecting && (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="size-5 animate-spin text-text-muted" />
            <p className="text-sm text-text-muted">Analizando transacciones...</p>
          </div>
        )}

        {!detecting && !error && (
          <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {visibleCandidates.map((candidate) => {
              const isSelected = selected.has(candidate.name);
              const warning = getWarning(candidate);
              return (
                <div
                  key={candidate.name}
                  className={cn(
                    "flex gap-3 rounded-xl border p-3.5",
                    candidate.exists
                      ? "border-border"
                      : isSelected
                        ? "border-primary"
                        : "border-border"
                  )}
                >
                  <input
                    type="checkbox"
                    aria-label={candidate.name}
                    checked={isSelected}
                    disabled={candidate.exists}
                    onChange={() => toggleCandidate(candidate.name)}
                    className="mt-1 size-[18px] shrink-0 accent-primary"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <strong className="text-[15px] font-semibold text-text-primary">
                        {candidate.name}
                      </strong>
                      {candidate.exists ? (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ color: "#9A3412", backgroundColor: "#FFF7ED" }}
                        >
                          Ya existe
                        </span>
                      ) : (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ color: "#0F766E", backgroundColor: "#E6F4F1" }}
                        >
                          Sugerido: pago recurrente
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[13px] text-text-muted">
                      {formatCurrency(candidate.amount)} · {freqLabels[candidate.frequency]} · {candidate.transactions.length} movimientos
                    </div>
                    {warning && (
                      <div className="mt-1 text-xs" style={{ color: "#9A3412" }}>
                        {warning}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!detecting && existingCandidates.length > 0 && (
          <button
            type="button"
            onClick={() => setShowExisting((current) => !current)}
            className="shrink-0 self-start text-[13px] text-text-muted hover:text-text-primary"
          >
            {showExisting
              ? `Ocultar las ${existingCandidates.length} que ya existen ▴`
              : `Mostrar las ${existingCandidates.length} que ya existen ▾`}
          </button>
        )}

        <div className="flex shrink-0 justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || selected.size === 0}
          >
            {saveLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
