"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { NotificationItem } from "@/types/notifications";

interface NotificationsContextType {
  items: NotificationItem[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(
  undefined
);

export function NotificationsProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, isLoading } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await api.notifications.list();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      // Las notificaciones son auxiliares: si falla la carga, se conserva
      // el último estado conocido sin interrumpir la navegación.
    }
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    void refresh();
  }, [isAuthenticated, isLoading, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      const target = items.find((item) => item.id === id);
      if (!target || target.readAt) return;

      await api.notifications.markRead(id);
      const readAt = new Date().toISOString();
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, readAt } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [items]
  );

  const markAllRead = useCallback(async () => {
    await api.notifications.markAllRead();
    const readAt = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) => (item.readAt ? item : { ...item, readAt }))
    );
    setUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({ items, unreadCount, refresh, markRead, markAllRead }),
    [items, unreadCount, refresh, markRead, markAllRead]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  }
  return context;
}
