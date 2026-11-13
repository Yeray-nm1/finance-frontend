"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { SavingsGoal } from "@/types/goals";
import { Trash2 } from "lucide-react";

interface ContributionsDialogProps {
  readonly open: boolean;
  readonly goal: SavingsGoal | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onChanged: () => void;
}

export function ContributionsDialog({
  open,
  goal,
  onOpenChange,
  onChanged,
}: Readonly<ContributionsDialogProps>) {
  const [detail, setDetail] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!goal) return;

    setLoading(true);
    setError(null);

    try {
      setDetail(await api.goals.get(goal.id));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las aportaciones");
    } finally {
      setLoading(false);
    }
  }, [goal]);

  useEffect(() => {
    if (!open) {
      setDetail(null);
      setPendingDelete(null);
      return;
    }

    void loadDetail();
  }, [open, loadDetail]);

  async function handleDelete(contributionId: string) {
    if (!goal) return;

    setDeletingId(contributionId);

    try {
      await api.goals.deleteContribution(goal.id, contributionId);
      await loadDetail();
      onChanged();
      toast({ title: "Aportación eliminada" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "No se pudo eliminar la aportación",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  const contributions = detail?.contributions ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aportaciones de {goal?.name ?? "la meta"}</DialogTitle>
          <DialogDescription>
            {detail
              ? `${formatCurrency(detail.saved)} de ${formatCurrency(detail.targetAmount)}`
              : "Historial de aportaciones"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-6 text-center text-sm text-text-muted">Cargando...</p>
        ) : error ? (
          <p className="py-6 text-center text-sm text-expense" role="alert">
            {error}
          </p>
        ) : contributions.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            Todavía no hay aportaciones.
          </p>
        ) : (
          <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1 scrollbar-thin">
            {contributions.map((contribution) => (
              <div
                key={contribution.id}
                className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {formatCurrency(contribution.amount)}
                  </p>
                  <p className="truncate text-xs text-text-muted">
                    {formatShortDate(contribution.date)} ·{" "}
                    {contribution.account?.name ?? "Sin cuenta"} →{" "}
                    {contribution.transferAccount?.name ?? "—"}
                  </p>
                </div>

                {pendingDelete === contribution.id ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deletingId === contribution.id}
                      onClick={() => void handleDelete(contribution.id)}
                    >
                      {deletingId === contribution.id ? "Eliminando..." : "Eliminar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deletingId === contribution.id}
                      onClick={() => setPendingDelete(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar aportación de ${formatCurrency(contribution.amount)}`}
                    onClick={() => setPendingDelete(contribution.id)}
                  >
                    <Trash2 className="size-4 text-expense" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
