import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Sidebar } from "../Sidebar";
import { useIsMobile } from "@/hooks/useIsMobile";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { email: "user@example.com" }, logout: vi.fn() }),
}));

vi.mock("@/contexts/SidebarContext", () => ({
  useSidebar: () => ({
    isCollapsed: false,
    toggleCollapsed: vi.fn(),
    isMobileOpen: true,
    closeMobile: vi.fn(),
    openMobile: vi.fn(),
  }),
}));

vi.mock("@/hooks/useIsMobile", () => ({ useIsMobile: vi.fn() }));

vi.mock("@/components/CsvUploadDialog", () => ({
  CsvUploadDialog: () => null,
}));

vi.mock("@/components/layout/NotificationBell", () => ({
  NotificationBell: () => <button type="button" aria-label="Campana del sidebar" />,
}));

const mockIsMobile = vi.mocked(useIsMobile);

describe("Sidebar · campana de notificaciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mantiene la campana en el sidebar de escritorio", () => {
    mockIsMobile.mockReturnValue(false);

    render(<Sidebar />);

    expect(screen.getByRole("button", { name: "Campana del sidebar" })).toBeVisible();
  });

  it("oculta la campana del desplegable solo en móvil", () => {
    mockIsMobile.mockReturnValue(true);

    render(<Sidebar />);

    expect(
      screen.queryByRole("button", { name: "Campana del sidebar" })
    ).not.toBeInTheDocument();
  });
});
