"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/contexts/NotificationsContext";
import { cn } from "@/lib/utils";

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date);
}

type NotificationBellProps = {
  variant?: "topbar" | "sidebar";
  collapsed?: boolean;
  className?: string;
};

export function NotificationBell({
  variant = "topbar",
  collapsed = false,
  className,
}: Readonly<NotificationBellProps>) {
  const { items, unreadCount, refresh, markRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const inSidebar = variant === "sidebar";
  // En el sidebar los iconos van a juego con «Subir extracto» y la flecha:
  // 14 px con la barra expandida y 18 px en el rail colapsado.
  const iconSize = inSidebar ? (collapsed ? 18 : 14) : 18;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) void refresh();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            unreadCount > 0
              ? `Notificaciones, ${unreadCount} sin leer`
              : "Notificaciones"
          }
          className={cn(
            "flex items-center rounded-md text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary",
            inSidebar
              ? collapsed
                ? "w-full justify-center py-2.5 px-3"
                : "w-full justify-start gap-3 py-2.5 px-3 text-[13px]"
              : "size-9 justify-center",
            className
          )}
        >
          <span className="relative flex shrink-0 items-center justify-center">
            <Bell size={iconSize} strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-2 -right-2 flex min-w-4 items-center justify-center rounded-full bg-expense px-1 text-[10px] font-bold leading-4 text-white"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </span>
          {inSidebar && !collapsed && <span>Notificaciones</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-text-primary">
            Notificaciones
          </span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-xs text-primary transition-colors hover:underline"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-muted">
            No tienes notificaciones
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex gap-3 px-4 py-3",
                  !item.readAt && "bg-primary-light/40"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-text-primary">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {item.body}
                  </p>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {formatRelative(item.createdAt)}
                  </p>
                </div>
                {!item.readAt && (
                  <button
                    type="button"
                    aria-label={`Marcar como leída: ${item.title}`}
                    title="Marcar como leída"
                    onClick={() => void markRead(item.id)}
                    className="size-6 shrink-0 rounded-md text-text-muted transition-colors hover:bg-bg-elevated hover:text-primary"
                  >
                    <Check size={14} className="mx-auto" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
