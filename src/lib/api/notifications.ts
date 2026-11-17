import { request } from "./client";
import type {
  NotificationRules,
  NotificationsResponse,
} from "@/types/notifications";

export const notifications = {
  list: (signal?: AbortSignal) =>
    request<NotificationsResponse>("/notifications", { signal }),
  rules: {
    get: (signal?: AbortSignal) =>
      request<NotificationRules>("/notifications/rules", { signal }),
    save: (rules: NotificationRules) =>
      request<NotificationRules>("/notifications/rules", {
        method: "PUT",
        body: JSON.stringify(rules),
      }),
  },
  markRead: (id: string) =>
    request<void>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () =>
    request<void>("/notifications/read-all", { method: "POST" }),
};
