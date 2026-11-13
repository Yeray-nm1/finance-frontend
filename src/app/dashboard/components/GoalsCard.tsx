"use client";

import { useEffect, useState } from "react";
import { GoalProgressBar } from "@/components/GoalProgressBar";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { getGoalStatus } from "@/lib/goals";
import type { SavingsGoal } from "@/types/goals";

export function GoalsCard() {
  const [goals, setGoals] = useState<SavingsGoal[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    api.goals
      .list(false, controller.signal)
      .then((list) => setGoals(list.slice(0, 3)))
      .catch((err: Error) => {
        if (err.name !== "AbortError") setGoals([]);
      });

    return () => controller.abort();
  }, []);

  if (goals === null) return null;

  if (goals.length === 0) {
    return (
      <p className="text-xs text-text-muted flex-1 flex items-center justify-center">
        Aún no tienes metas de ahorro
      </p>
    );
  }

  return (
    <div className="mb-4 min-h-0 flex-1 space-y-3 overflow-y-scroll pr-1 scrollbar-thin [scrollbar-gutter:stable]">
      {goals.map((goal) => {
        const done = getGoalStatus(goal) === "done";

        return (
          <div key={goal.id}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-xs text-text-primary">{goal.name}</span>
              <span className="shrink-0 text-[11px] text-text-muted">
                {Math.round(goal.progress)}%
              </span>
            </div>
            <div className="mt-1.5">
              <GoalProgressBar value={goal.progress} done={done} />
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              {formatCurrency(goal.saved)} de {formatCurrency(goal.targetAmount)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
