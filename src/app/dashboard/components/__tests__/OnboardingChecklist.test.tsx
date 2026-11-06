import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { OnboardingChecklist } from "../OnboardingChecklist";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    accounts: { list: vi.fn() },
    transactions: { list: vi.fn() },
    budgets: { monthly: { get: vi.fn() } },
  },
}));

const account = {
  id: "account-1",
  userId: "user-1",
  name: "Cuenta principal",
  type: "checking" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("OnboardingChecklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.accounts.list).mockResolvedValue([]);
    vi.mocked(api.transactions.list).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 1,
    });
    vi.mocked(api.budgets.monthly.get).mockResolvedValue(null);
  });

  it("muestra el resumen y despliega los tres pasos", async () => {
    vi.mocked(api.accounts.list).mockResolvedValue([account]);
    vi.mocked(api.transactions.list).mockResolvedValue({
      data: [],
      total: 12,
      page: 1,
      limit: 1,
    });

    render(<OnboardingChecklist />);

    expect(await screen.findByText("Primeros pasos")).toBeInTheDocument();
    expect(screen.getByText("2 de 3 completados")).toBeInTheDocument();
    expect(screen.queryByText("Crea tu cuenta")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Desplegar primeros pasos" }));

    expect(screen.getByText("Crea tu cuenta")).toBeInTheDocument();
    expect(screen.getByText("Añade o importa un movimiento")).toBeInTheDocument();
    expect(screen.getByText("Define tu presupuesto")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Definir presupuesto/ })).toHaveAttribute(
      "href",
      "/budgets"
    );
  });

  it("se puede desplegar y plegar", async () => {
    render(<OnboardingChecklist />);

    expect(await screen.findByText("Primeros pasos")).toBeInTheDocument();
    expect(screen.queryByText("Crea tu cuenta")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Desplegar primeros pasos" }));
    expect(screen.getByText("Crea tu cuenta")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Contraer primeros pasos" }));

    expect(screen.queryByText("Crea tu cuenta")).not.toBeInTheDocument();
    expect(screen.getByText("0 de 3 completados")).toBeInTheDocument();
  });

  it("no se muestra cuando los tres pasos están completos", async () => {
    vi.mocked(api.accounts.list).mockResolvedValue([account]);
    vi.mocked(api.transactions.list).mockResolvedValue({
      data: [],
      total: 1,
      page: 1,
      limit: 1,
    });
    vi.mocked(api.budgets.monthly.get).mockResolvedValue({
      id: "budget-1",
      userId: "user-1",
      month: 11,
      year: 2026,
      totalIncome: 2000,
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: "2026-11-01T00:00:00.000Z",
      typeAllocations: [],
      categoryAllocations: [],
    });

    const { container } = render(<OnboardingChecklist />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
