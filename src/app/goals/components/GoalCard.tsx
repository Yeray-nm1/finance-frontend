"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoalProgressBar } from "@/components/GoalProgressBar";
import { formatCurrency } from "@/lib/format";
import { formatGoalDate, getGoalStatus } from "@/lib/goals";
import { cn } from "@/lib/utils";
import type { SavingsGoal } from "@/types/goals";

interface GoalCardProps {
  readonly goal: SavingsGoal;
  /** Estado del switch global de Preferencias, que manda sobre el de la meta. */
  readonly reminderGloballyEnabled: boolean;
  readonly onContribute: (goal: SavingsGoal) => void;
  readonly onEdit: (goal: SavingsGoal) => void;
  readonly onToggleArchive: (goal: SavingsGoal) => void;
  readonly onDelete: (goal: SavingsGoal) => void;
  readonly onViewContributions: (goal: SavingsGoal) => void;
}

export function GoalCard({
  goal,
  reminderGloballyEnabled,
  onContribute,
  onEdit,
  onToggleArchive,
  onDelete,
  onViewContributions,
}: GoalCardProps) {
  const done = getGoalStatus(goal) === "done";
  const targetDate = formatGoalDate(goal.targetDate);
  const reminderState = !goal.reminderEnabled
    ? "off"
    : reminderGloballyEnabled
      ? "on"
      : "pending";
  const [pausedTipOpen, setPausedTipOpen] = useState(false);
  const reminderLabel =
    reminderState === "on"
      ? "Avisos de la meta activos"
      : "Avisos de la meta desactivados";

  return (
    <section
      data-goal-card={goal.id}
      className="flex min-w-0 flex-col rounded-lg border border-border bg-white p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Target className="size-4 shrink-0 text-text-muted" />
            <h2 className="truncate text-sm font-semibold text-text-primary">
              {goal.name}
            </h2>
            {done && <Badge variant="secondary">Completada</Badge>}
            {goal.isArchived && <Badge variant="secondary">Archivada</Badge>}
          </div>
          <div className="mt-1">
            {reminderState === "pending" ? (
              <div
                className="relative inline-block"
                onMouseEnter={() => setPausedTipOpen(true)}
                onMouseLeave={() => setPausedTipOpen(false)}
                onFocus={() => setPausedTipOpen(true)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setPausedTipOpen(false);
                  }
                }}
              >
                <button
                  type="button"
                  data-reminder-state="pending"
                  aria-label="Avisos pausados"
                  aria-describedby={pausedTipOpen ? `goal-paused-tip-${goal.id}` : undefined}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  ⚠ Avisos pausados
                </button>
                {pausedTipOpen && (
                  <div
                    id={`goal-paused-tip-${goal.id}`}
                    role="tooltip"
                    className="absolute left-0 top-full z-20 mt-1 w-64 rounded-md border border-amber-200 bg-white p-3 text-xs leading-snug text-text-secondary shadow-lg"
                  >
                    <p>
                      Esta meta tiene el aviso encendido, pero el interruptor global de
                      Preferencias está apagado.
                    </p>
                    <Link
                      href="/preferences?focus=goalReminder"
                      className="mt-2 inline-block font-medium text-primary underline hover:no-underline"
                    >
                      Abrir Preferencias →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <span
                role="status"
                data-reminder-state={reminderState}
                aria-label={reminderLabel}
                title={reminderLabel}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  reminderState === "on" && "bg-green-50 text-green-700",
                  reminderState === "off" && "bg-bg-elevated text-text-muted"
                )}
              >
                {reminderState === "on" ? "Avisos activos" : "Avisos desactivados"}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar ${goal.name}`}
            onClick={() => onEdit(goal)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              goal.isArchived ? `Reactivar ${goal.name}` : `Archivar ${goal.name}`
            }
            onClick={() => onToggleArchive(goal)}
          >
            {goal.isArchived ? (
              <ArchiveRestore className="size-4" />
            ) : (
              <Archive className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Eliminar ${goal.name}`}
            onClick={() => onDelete(goal)}
          >
            <Trash2 className="size-4 text-expense" />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <p className="text-sm font-semibold text-text-primary">
          <span className="font-medium text-text-secondary">
            {goal.account ? goal.account.name : "Sin cuenta de ahorro"}
          </span>
          <span className="text-text-muted">: </span>
          {formatCurrency(goal.saved)}{" "}
          <span className="text-xs font-normal text-text-muted">
            de {formatCurrency(goal.targetAmount)}
          </span>
        </p>
        <span className="text-xs font-medium text-text-secondary">
          {Math.round(goal.progress)}%
        </span>
      </div>

      <div className="mt-2">
        <GoalProgressBar value={goal.progress} done={done} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
        {goal.remaining > 0 ? (
          <span>Faltan {formatCurrency(goal.remaining)}</span>
        ) : (
          <span>Objetivo alcanzado</span>
        )}
        {goal.monthlyNeeded !== null && (
          <span>{formatCurrency(goal.monthlyNeeded)}/mes</span>
        )}
        {targetDate && <span>{targetDate}</span>}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button
          size="sm"
          onClick={() => onContribute(goal)}
          disabled={!goal.accountId || goal.isArchived}
          title={!goal.accountId ? "Asocia una cuenta de ahorro para aportar" : undefined}
        >
          <Plus className="size-4" /> Aportar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewContributions(goal)}
        >
          Aportaciones ({goal.contributionsCount})
        </Button>
      </div>
    </section>
  );
}
