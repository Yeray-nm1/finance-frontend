import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api";
import AccountsPage from "../page";

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { void 0; }
    unobserve() { void 0; }
    disconnect() { void 0; }
  };
});

vi.mock("@/lib/api", () => ({
  api: {
    accounts: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

const account = {
  id: "account-1",
  userId: "user-1",
  name: "Cuenta principal",
  type: "checking" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("AccountsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.accounts.list).mockResolvedValue([]);
    vi.mocked(api.accounts.create).mockResolvedValue(account);
    vi.mocked(api.accounts.update).mockResolvedValue({ ...account, name: "Nómina" });
    vi.mocked(api.accounts.delete).mockResolvedValue(undefined);
  });

  it("muestra el estado vacío y permite crear la primera cuenta", async () => {
    const user = userEvent.setup();
    render(<AccountsPage />);

    expect(await screen.findByText("Aún no tienes cuentas")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Crear mi primera cuenta" }));
    await user.type(screen.getByLabelText("Nombre"), "Cuenta principal");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(api.accounts.create).toHaveBeenCalledWith({
        name: "Cuenta principal",
        type: "checking",
      });
    });
    expect(await screen.findByText("Cuenta principal")).toBeInTheDocument();
    expect(screen.queryByText("Aún no tienes cuentas")).not.toBeInTheDocument();
  });

  it("permite editar el nombre de una cuenta", async () => {
    vi.mocked(api.accounts.list).mockResolvedValue([account]);
    const user = userEvent.setup();
    render(<AccountsPage />);

    await user.click(await screen.findByRole("button", { name: "Editar Cuenta principal" }));
    const input = screen.getByLabelText("Nombre");
    await user.clear(input);
    await user.type(input, "Nómina");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(api.accounts.update).toHaveBeenCalledWith("account-1", {
        name: "Nómina",
        type: "checking",
      });
    });
    expect(await screen.findByText("Nómina")).toBeInTheDocument();
  });

  it("elimina una cuenta avisando de que los movimientos se conservan", async () => {
    vi.mocked(api.accounts.list).mockResolvedValue([account]);
    const user = userEvent.setup();
    render(<AccountsPage />);

    await user.click(await screen.findByRole("button", { name: "Eliminar Cuenta principal" }));

    expect(screen.getByText(/se quedarán sin cuenta asignada/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(api.accounts.delete).toHaveBeenCalledWith("account-1");
    });
    expect(await screen.findByText("Aún no tienes cuentas")).toBeInTheDocument();
  });
});
