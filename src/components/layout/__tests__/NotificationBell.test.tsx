import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationBell } from "../NotificationBell";
import { useNotifications } from "@/contexts/NotificationsContext";
import type { NotificationItem } from "@/types/notifications";

vi.mock("@/contexts/NotificationsContext", () => ({
  useNotifications: vi.fn(),
}));

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { /* noop */ }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  };
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

const mockUseNotifications = vi.mocked(useNotifications);

const unreadItem: NotificationItem = {
  id: "n-1",
  type: "subscription_due",
  title: "Próximo cobro: Netflix",
  body: "12,99 € el 20 de noviembre.",
  createdAt: new Date().toISOString(),
  readAt: null,
};

function setup(overrides: {
  items?: NotificationItem[];
  unreadCount?: number;
} = {}) {
  const refresh = vi.fn().mockResolvedValue(undefined);
  const markRead = vi.fn().mockResolvedValue(undefined);
  const markAllRead = vi.fn().mockResolvedValue(undefined);
  mockUseNotifications.mockReturnValue({
    items: overrides.items ?? [],
    unreadCount: overrides.unreadCount ?? 0,
    refresh,
    markRead,
    markAllRead,
  });
  return { refresh, markRead, markAllRead };
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el contador de no leídas en la campana", () => {
    setup({ unreadCount: 3 });

    render(<NotificationBell />);

    const bell = screen.getByRole("button", {
      name: "Notificaciones, 3 sin leer",
    });
    expect(bell).toBeInTheDocument();
    expect(bell).toHaveTextContent("3");
  });

  it("no muestra contador cuando no hay notificaciones sin leer", () => {
    setup();

    render(<NotificationBell />);

    expect(
      screen.getByRole("button", { name: "Notificaciones" })
    ).toBeInTheDocument();
  });

  it("muestra el estado vacío y refresca al abrir", async () => {
    const { refresh } = setup();
    const user = userEvent.setup();

    render(<NotificationBell />);
    await user.click(screen.getByRole("button", { name: "Notificaciones" }));

    expect(await screen.findByText("No tienes notificaciones")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("lista las notificaciones y permite marcar una como leída", async () => {
    const { markRead } = setup({ items: [unreadItem], unreadCount: 1 });
    const user = userEvent.setup();

    render(<NotificationBell />);
    await user.click(
      screen.getByRole("button", { name: "Notificaciones, 1 sin leer" })
    );

    expect(
      await screen.findByText("Próximo cobro: Netflix")
    ).toBeInTheDocument();
    expect(screen.getByText(/12,99 € el 20 de noviembre/)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Marcar como leída: Próximo cobro: Netflix",
      })
    );
    expect(markRead).toHaveBeenCalledWith("n-1");
  });

  it("permite marcar todas como leídas", async () => {
    const { markAllRead } = setup({
      items: [unreadItem],
      unreadCount: 1,
    });
    const user = userEvent.setup();

    render(<NotificationBell />);
    await user.click(
      screen.getByRole("button", { name: "Notificaciones, 1 sin leer" })
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Marcar todas como leídas",
      })
    );

    expect(markAllRead).toHaveBeenCalledOnce();
  });

  it("oculta la acción de marcar todas cuando no hay no leídas", async () => {
    const readItem = { ...unreadItem, readAt: new Date().toISOString() };
    setup({ items: [readItem], unreadCount: 0 });
    const user = userEvent.setup();

    render(<NotificationBell />);
    await user.click(screen.getByRole("button", { name: "Notificaciones" }));

    expect(await screen.findByText("Próximo cobro: Netflix")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Marcar todas como leídas" })
    ).not.toBeInTheDocument();
  });
});
