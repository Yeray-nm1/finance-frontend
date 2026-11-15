import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api";
import { QuickExpenseDialog } from "../QuickExpenseDialog";
import { QuickExpenseButton } from "../QuickExpenseButton";
import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";
import type { Transaction } from "@/types/transactions";

vi.mock("@/lib/api", () => ({
  api: {
    accounts: { list: vi.fn() },
    categories: { list: vi.fn() },
    transactions: { create: vi.fn() },
  },
}));

const account: Account = {
  id: "acc-1",
  userId: "user-1",
  name: "Cuenta principal",
  type: "checking",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const category: Category = {
  id: "cat-1",
  userId: "user-1",
  name: "Comida",
  type: "needs",
};

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

beforeEach(() => {
  vi.mocked(api.accounts.list).mockResolvedValue([account]);
  vi.mocked(api.categories.list).mockResolvedValue([category]);
  vi.mocked(api.transactions.create).mockReset();
  vi.mocked(api.transactions.create).mockResolvedValue({} as Transaction);
});

describe("QuickExpenseDialog", () => {
  it("creates an expense dated today using the first account", async () => {
    const onCreated = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <QuickExpenseDialog
        open
        onOpenChange={onOpenChange}
        onCreated={onCreated}
      />
    );

    await waitFor(() => expect(api.accounts.list).toHaveBeenCalled());

    await userEvent.type(screen.getByLabelText("Importe"), "12.50");
    await userEvent.type(screen.getByLabelText("Descripción"), "Café");
    await userEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));

    await waitFor(() => {
      expect(api.transactions.create).toHaveBeenCalledWith({
        date: new Date().toISOString().split("T")[0],
        amount: 12.5,
        description: "Café",
        type: "expense",
        accountId: "acc-1",
      });
    });
    expect(onCreated).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByLabelText("Importe")).toHaveValue(null);
    expect(screen.getByLabelText("Descripción")).toHaveValue("");
  });

  it("clears the form when the dialog is closed without saving", async () => {
    const onOpenChange = vi.fn();

    const view = render(
      <QuickExpenseDialog open onOpenChange={onOpenChange} onCreated={vi.fn()} />
    );

    await waitFor(() => expect(api.accounts.list).toHaveBeenCalled());

    await userEvent.type(screen.getByLabelText("Importe"), "9");
    await userEvent.type(screen.getByLabelText("Descripción"), "Cena");

    view.rerender(
      <QuickExpenseDialog open={false} onOpenChange={onOpenChange} onCreated={vi.fn()} />
    );
    view.rerender(
      <QuickExpenseDialog open onOpenChange={onOpenChange} onCreated={vi.fn()} />
    );

    expect(screen.getByLabelText("Importe")).toHaveValue(null);
    expect(screen.getByLabelText("Descripción")).toHaveValue("");
  });

  it("keeps the dialog open and shows an error when the API fails", async () => {
    vi.mocked(api.transactions.create).mockRejectedValue(new Error("Sin conexión"));
    const onOpenChange = vi.fn();

    render(
      <QuickExpenseDialog open onOpenChange={onOpenChange} onCreated={vi.fn()} />
    );

    await waitFor(() => expect(api.accounts.list).toHaveBeenCalled());

    await userEvent.type(screen.getByLabelText("Importe"), "5");
    await userEvent.type(screen.getByLabelText("Descripción"), "Pan");
    await userEvent.click(screen.getByRole("button", { name: "Guardar gasto" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Sin conexión");
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("QuickExpenseButton", () => {
  it("renders an accessible floating action button", () => {
    render(<QuickExpenseButton onCreated={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Añadir gasto rápido" })
    ).toBeInTheDocument();
  });
});
