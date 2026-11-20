import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Sidebar } from "../Sidebar";
import { useIsMobile } from "@/hooks/useIsMobile";

const auth = vi.hoisted(() => ({
  user: { email: "user@example.com", name: null as string | null },
}));

const sidebar = vi.hoisted(() => ({ isCollapsed: false }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: auth.user, logout: vi.fn() }),
}));

vi.mock("@/contexts/SidebarContext", () => ({
  useSidebar: () => ({
    isCollapsed: sidebar.isCollapsed,
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

beforeEach(() => {
  vi.clearAllMocks();
  auth.user.email = "user@example.com";
  auth.user.name = null;
  sidebar.isCollapsed = false;
});

describe("Sidebar · campana de notificaciones", () => {
  it("mantiene la campana en el sidebar de escritorio", () => {
    mockIsMobile.mockReturnValue(false);

    render(<Sidebar />);

    expect(screen.getByRole("button", { name: "Campana del sidebar" })).toBeVisible();
  });

  it("oculta la campana del desplegable solo en móvil", () => {
    mockIsMobile.mockReturnValue(true);

    render(<Sidebar />);

    expect(
      screen.queryByRole("button", { name: /Campana del sidebar/ })
    ).not.toBeInTheDocument();
  });
});

describe("Sidebar · inicial del usuario", () => {
  beforeEach(() => {
    mockIsMobile.mockReturnValue(false);
    sidebar.isCollapsed = true;
  });

  it("usa la inicial del nombre cuando existe", () => {
    auth.user.name = "Ana";
    render(<Sidebar />);

    expect(screen.getByText("A", { exact: true })).toBeVisible();
    expect(screen.queryByText("U", { exact: true })).not.toBeInTheDocument();
  });

  it("cae a la inicial del email cuando no hay nombre", () => {
    auth.user.name = null;
    render(<Sidebar />);

    expect(screen.getByText("U", { exact: true })).toBeVisible();
  });

  it("cae a la inicial del email cuando el nombre solo tiene espacios", () => {
    auth.user.name = "   ";
    render(<Sidebar />);

    expect(screen.getByText("U", { exact: true })).toBeVisible();
  });
});
