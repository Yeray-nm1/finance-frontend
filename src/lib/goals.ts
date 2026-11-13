const GOAL_DATE_FORMAT = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(100, Math.max(0, progress));
}

export function formatGoalDate(iso: string | null): string | null {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return GOAL_DATE_FORMAT.format(date);
}

export type GoalStatus = "active" | "done" | "archived";

export function getGoalStatus(goal: {
  progress: number;
  isArchived: boolean;
}): GoalStatus {
  if (goal.isArchived) return "archived";
  return clampProgress(goal.progress) >= 100 ? "done" : "active";
}

export function todayInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
