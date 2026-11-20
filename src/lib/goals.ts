import type { ReminderSettings } from "@/types/goals";

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

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
] as const;

const INTERVAL_LABELS: Record<string, string> = {
  DAYS: "días",
  WEEKS: "semanas",
  MONTHS: "meses",
};

function formatStartDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

/** Resumen de una línea del bloque de avisos, con las etiquetas exactas de Figma. */
export function describeReminder(settings: ReminderSettings): string {
  if (!settings.reminderEnabled) return "Avisos desactivados";

  const channel =
    settings.reminderChannel === "APP_ONLY" ? "solo en la app" : "en la app y por email";

  if (settings.reminderFrequency === "WEEKLY") {
    const weekday =
      settings.reminderWeekday !== null && WEEKDAYS[settings.reminderWeekday]
        ? WEEKDAYS[settings.reminderWeekday]
        : "lunes";
    return `Te avisaremos cada ${weekday}, ${channel}.`;
  }

  if (settings.reminderFrequency === "CUSTOM") {
    const interval = settings.reminderInterval ?? 1;
    const unit = INTERVAL_LABELS[settings.reminderIntervalUnit ?? "WEEKS"] ?? "semanas";
    return `Te avisaremos cada ${interval} ${unit} desde el ${formatStartDate(
      settings.reminderStartDate
    )}, ${channel}.`;
  }

  if (settings.reminderLastDay) {
    return `Te avisaremos el último día de cada mes, ${channel}.`;
  }

  return `Te avisaremos el día ${settings.reminderDay ?? 1} de cada mes, ${channel}.`;
}
