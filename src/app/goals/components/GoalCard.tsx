"use client";

import { Archive, ArchiveRestore, Pencil, Plus, Target, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoalProgressBar } from "@/components/GoalProgressBar";
import { formatCurrency } from "@/lib/format";
import { formatGoalDate, getGoalStatus } from "@/lib/goals";
import type { SavingsGoal } from "@/types/goals";

interface GoalCardProps {
  readonly goal: SavingsGoal;
  readonly onContribute: (goal: SavingsGoal) => void;
  readonly onEdit: (goal: SavingsGoal) => void;
  readonly onToggleArchive: (goal: SavingsGoal) => void;
  readonly onDelete: (goal: SavingsGoal) => void;
  readonly onViewContributions: (goal: SavingsGoal) => void;
}

export function GoalCard({
  goal,
  onContribute,
  onEdit,
  onToggleArchive,
  onDelete,
  onViewContributions,
}: GoalCardProps) {
  const done = getGoalStatus(goal) === "done";
  const targetDate = formatGoalDate(goal.targetDate);

  return (
    <section
      data-goal-card={goal.id}
      className="flex flex-col rounded-lg border border-border bg-white p-5"
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
          <p className="mt-1 text-xs text-text-muted">
            {goal.account ? goal.account.name : "Sin cuenta de ahorro"}
          </p>
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

      <div className="mt-4 flex items-center justify-between gap-2">
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
