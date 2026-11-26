import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api";
import AccountsPage from "../page";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

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
    transactions: {
      listAll: vi.fn(),
      updateMany: vi.fn(),
    },
    goals: {
      list: vi.fn(),
    },
  },
}));

vi.mock("@/components/CsvUploadDialog", () => ({
  CsvUploadDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="csv-upload-dialog" /> : null,
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
    vi.mocked(api.transactions.listAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    vi.mocked(api.transactions.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ updated: 1 });
    vi.mocked(api.goals.list as ReturnType<typeof vi.fn>).mockResolvedValue([]);
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
    expect((await screen.findAllByText("Cuenta principal")).length).toBeGreaterThan(0);
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
    expect((await screen.findAllByText("Nómina")).length).toBeGreaterThan(0);
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

  it("muestra lista lateral, detalle y aviso de movimientos sin cuenta", async () => {
    vi.mocked(api.accounts.list).mockResolvedValue([account]);
    vi.mocked(api.transactions.listAll as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "t-1",
        userId: "user-1",
        accountId: null,
        transferAccountId: null,
        categoryId: null,
        date: "2026-05-27T00:00:00.000Z",
        amount: -11.99,
        description: "NETFLIX COM",
        type: "expense",
        isSubscription: false,
        createdAt: "2026-05-27T00:00:00.000Z",
      },
    ]);
    render(<AccountsPage />);

    expect(await screen.findByText("Tu dinero por cuenta")).toBeInTheDocument();
    expect(screen.getByText("1 movimientos sin cuenta asignada")).toBeInTheDocument();

    const layout = screen.getByTestId("accounts-layout");
    expect(layout.className).toContain("max-w-[1000px]");
    expect(layout.className).toContain("grid-cols-[340px_1fr]");
    expect(screen.getByTestId("account-list")).toBeInTheDocument();
    expect(screen.getByTestId("account-detail")).toBeInTheDocument();
  });

  it("lleva el botón Asignar a transacciones filtradas por movimientos sin cuenta", async () => {
    const user = userEvent.setup();
    vi.mocked(api.accounts.list).mockResolvedValue([account]);
    vi.mocked(api.transactions.listAll as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "t-1",
        userId: "user-1",
        accountId: null,
        transferAccountId: null,
        categoryId: null,
        date: "2026-05-27T00:00:00.000Z",
        amount: -11.99,
        description: "NETFLIX COM",
        type: "expense",
        isSubscription: false,
        createdAt: "2026-05-27T00:00:00.000Z",
      },
    ]);
    render(<AccountsPage />);

    await user.click(await screen.findByRole("button", { name: /Asignar/ }));

    expect(pushMock).toHaveBeenCalledWith("/transactions?account=Sin+cuenta");
  });

  it("abre el importador de extractos desde la cabecera", async () => {
    const user = userEvent.setup();
    vi.mocked(api.accounts.list).mockResolvedValue([account]);
    render(<AccountsPage />);

    await user.click(
      (await screen.findAllByRole("button", { name: "Importar extracto" }))[0]
    );

    expect(screen.getByTestId("csv-upload-dialog")).toBeInTheDocument();
  });
});
