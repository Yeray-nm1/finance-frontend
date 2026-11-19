import type { NotificationRules } from "@/types/notifications";

/** Reglas por defecto, compartidas por Preferencias y Metas. */
export const DEFAULT_NOTIFICATION_RULES: NotificationRules = {
  subscriptionDue: { enabled: false, emailEnabled: false, daysBefore: 3 },
  spendingSummary: { enabled: false, emailEnabled: false, frequency: "weekly" },
  goalReminder: { enabled: false, emailEnabled: false },
};

/** Las reglas guardadas antes de existir un aviso pueden no traer alguna clave. */
export function normalizeNotificationRules(
  loaded: Partial<NotificationRules>
): NotificationRules {
  return {
    subscriptionDue: loaded.subscriptionDue ?? DEFAULT_NOTIFICATION_RULES.subscriptionDue,
    spendingSummary: loaded.spendingSummary ?? DEFAULT_NOTIFICATION_RULES.spendingSummary,
    goalReminder: loaded.goalReminder ?? DEFAULT_NOTIFICATION_RULES.goalReminder,
  };
}
