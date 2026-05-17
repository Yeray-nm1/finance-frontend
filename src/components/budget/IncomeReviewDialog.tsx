"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { formatCurrency } from "@/lib/budget-constants";
import type { IncomeGroup } from "@/types";
import { MONTH_NAMES } from "@/types";

interface IncomeReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: IncomeGroup[];
  onConfirm: (selectedTotal: number) => void;
}

export function IncomeReviewDialog({
  open,
  onOpenChange,
  groups,
  onConfirm,
}: Readonly<IncomeReviewDialogProps>) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useMemo(() => {
    if (open) {
      setChecked(new Set(groups.map((g) => g.label)));
      setExpanded(new Set());
      setSearch("");
    }
  }, [open, groups]);

  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const monthName = MONTH_NAMES[prevMonth - 1];

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter((g) => g.label.toLowerCase().includes(q));
  }, [groups, search]);

  const selectedTotal = useMemo(() => {
    return groups
      .filter((g) => checked.has(g.label))
      .reduce((sum, g) => sum + g.totalAmount, 0);
  }, [groups, checked]);

  function toggleGroup(label: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  function toggleExpand(label: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  function handleConfirm() {
    onConfirm(selectedTotal);
  }

  const isEmpty = groups.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ingresos de {monthName}</DialogTitle>
          <DialogDescription>
            {monthName} de {prevYear} &middot; Selecciona los grupos de ingresos que quieras incluir
          </DialogDescription>
        </DialogHeader>

        {!isEmpty && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No se encontraron ingresos en {monthName} de {prevYear}
            </p>
          ) : filteredGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ningún grupo coincide con la búsqueda
            </p>
          ) : (
            filteredGroups.map((group) => {
              const isChecked = checked.has(group.label);
              const isExpanded = expanded.has(group.label);

              return (
                <div key={group.label} className="border rounded-lg">
                  <div className="flex items-center gap-3 p-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(group.label)}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={isExpanded ? "Colapsar grupo" : "Expandir grupo"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>

                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleGroup(group.label)}
                      className="size-4 shrink-0 accent-primary"
                      aria-label={`Incluir ${group.label}`}
                    />

                    <span className="flex-1 text-sm font-medium truncate">
                      {group.label}
                    </span>

                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {group.count} {group.count === 1 ? "transacción" : "transacciones"}
                    </span>

                    <span className="text-sm font-semibold whitespace-nowrap w-24 text-right">
                      {formatCurrency(group.totalAmount)}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-3 py-2 space-y-1">
                      {group.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center gap-3 text-xs text-muted-foreground pl-9"
                        >
                          <span className="w-20 shrink-0">
                            {new Date(tx.date).toLocaleDateString("es-ES")}
                          </span>
                          <span className="flex-1 truncate">{tx.description}</span>
                          <span className="w-20 text-right">
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {!isEmpty && (
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm font-medium">
              Total seleccionado: {formatCurrency(selectedTotal)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={selectedTotal === 0}
              >
                Aplicar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
