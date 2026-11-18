export type NotificationType =
  | "subscription_due"
  | "spending_summary"
  | "goal_reminder"
  | "goal_contribution";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

export type DaysBefore = 1 | 3 | 7;
export type SummaryFrequency = "weekly" | "monthly";

export interface NotificationRules {
  subscriptionDue: {
    enabled: boolean;
    emailEnabled: boolean;
    daysBefore: DaysBefore;
  };
  spendingSummary: {
    enabled: boolean;
    emailEnabled: boolean;
    frequency: SummaryFrequency;
  };
  goalReminder: {
    enabled: boolean;
    emailEnabled: boolean;
  };
}
