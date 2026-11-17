import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  NotificationsProvider,
  useNotifications,
} from "../NotificationsContext";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import type { NotificationItem } from "@/types/notifications";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    notifications: {
      list: vi.fn(),
      markRead: vi.fn(),
      markAllRead: vi.fn(),
    },
  },
}));

const unreadItem: NotificationItem = {
  id: "n-1",
  type: "spending_summary",
  title: "Resumen de gastos",
  body: "Has gastado 50 € esta semana.",
  createdAt: new Date().toISOString(),
  readAt: null,
};

function Consumer() {
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  return (
    <div>
      <span data-testid="count">{unreadCount}</span>
      <span data-testid="items">{items.length}</span>
      <button onClick={() => void markRead("n-1")}>marcar una</button>
      <button onClick={() => void markAllRead()}>marcar todas</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <NotificationsProvider>
      <Consumer />
    </NotificationsProvider>
  );
}

const mockUseAuth = vi.mocked(useAuth);
const mockList = vi.mocked(api.notifications.list);
const mockMarkRead = vi.mocked(api.notifications.markRead);
const mockMarkAllRead = vi.mocked(api.notifications.markAllRead);

describe("NotificationsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    mockList.mockResolvedValue({ items: [unreadItem], unreadCount: 2 });
    mockMarkRead.mockResolvedValue(undefined);
    mockMarkAllRead.mockResolvedValue(undefined);
  });

  it("no consulta notificaciones cuando no hay sesión", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    renderWithProvider();

    expect(mockList).not.toHaveBeenCalled();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("carga notificaciones cuando está autenticado", async () => {
    renderWithProvider();

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("2")
    );
    expect(mockList).toHaveBeenCalledOnce();
    expect(screen.getByTestId("items")).toHaveTextContent("1");
  });

  it("marcar una como leída decrementa el contador", async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("2")
    );

    await user.click(screen.getByRole("button", { name: "marcar una" }));

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("1")
    );
    expect(mockMarkRead).toHaveBeenCalledWith("n-1");
  });

  it("marcar todas como leídas pone el contador a cero", async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("2")
    );

    await user.click(screen.getByRole("button", { name: "marcar todas" }));

    await waitFor(() =>
      expect(screen.getByTestId("count")).toHaveTextContent("0")
    );
    expect(mockMarkAllRead).toHaveBeenCalledOnce();
  });
});
