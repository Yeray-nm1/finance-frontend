import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TransactionForm } from "../TransactionForm";
import type { TransactionFormProps } from "../types/TransactionForm.types";

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

function buildProps(overrides: Partial<TransactionFormProps> = {}): TransactionFormProps {
  return {
    newDate: "2026-11-04",
    newType: "expense",
    newTransferKind: "internal",
    newTransferDirection: "out",
    newAmount: "100",
    newDescription: "Prueba",
    newAccountId: "__no_account__",
    newTransferAccountId: "__no_account__",
    newCategoryId: "__none__",
    newIsSubscription: false,
    editTxId: null,
    accounts: [],
    categories: [],
    saving: false,
    onDateChange: vi.fn(),
    onTypeChange: vi.fn(),
    onTransferKindChange: vi.fn(),
    onTransferDirectionChange: vi.fn(),
    onAmountChange: vi.fn(),
    onDescriptionChange: vi.fn(),
    onAccountIdChange: vi.fn(),
    onTransferAccountIdChange: vi.fn(),
    onAccountCreated: vi.fn(),
    onCategoryIdChange: vi.fn(),
    onIsSubscriptionChange: vi.fn(),
    onSubmit: vi.fn((e: React.SyntheticEvent) => e.preventDefault()),
    ...overrides,
  };
}

describe("TransactionForm transfer kind", () => {
  it("no muestra el selector de movimiento si el tipo no es transferencia", () => {
    render(<TransactionForm {...buildProps()} />);

    expect(screen.queryByLabelText("Movimiento")).not.toBeInTheDocument();
  });

  it("muestra el selector con 'Entre mis cuentas' y 'Salida' por defecto al crear una transferencia", () => {
    render(<TransactionForm {...buildProps({ newType: "transfer" })} />);

    expect(screen.getByLabelText("Movimiento")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Movimiento" })).toHaveTextContent(
      "Entre mis cuentas"
    );
    expect(screen.getByLabelText("Dirección")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Dirección" })).toHaveTextContent(
      "Salida"
    );
  });

  it("muestra el selector al cambiar el tipo a transferencia", async () => {
    const user = userEvent.setup();
    const onTypeChange = vi.fn();
    render(<TransactionForm {...buildProps({ onTypeChange })} />);

    await user.click(screen.getByRole("combobox", { name: "Tipo" }));
    await user.click(screen.getByRole("option", { name: "Transferencia" }));

    expect(onTypeChange).toHaveBeenCalledWith("transfer");
  });

  it("notifica el tipo de transferencia elegido", async () => {
    const user = userEvent.setup();
    const onTransferKindChange = vi.fn();
    render(
      <TransactionForm
        {...buildProps({ newType: "transfer", onTransferKindChange })}
      />
    );

    await user.click(screen.getByRole("combobox", { name: "Movimiento" }));
    await user.click(screen.getByRole("option", { name: "Con un tercero" }));

    expect(onTransferKindChange).toHaveBeenCalledWith("external");
  });

  it("notifica la dirección de la transferencia elegida", async () => {
    const user = userEvent.setup();
    const onTransferDirectionChange = vi.fn();
    render(
      <TransactionForm
        {...buildProps({ newType: "transfer", onTransferDirectionChange })}
      />
    );

    await user.click(screen.getByRole("combobox", { name: "Dirección" }));
    await user.click(screen.getByRole("option", { name: "Entrada" }));

    expect(onTransferDirectionChange).toHaveBeenCalledWith("in");
  });

  it("muestra la cuenta destino solo en transferencias internas", () => {
    const { rerender } = render(<TransactionForm {...buildProps({ newType: "transfer" })} />);
    expect(screen.getByLabelText("Cuenta destino")).toBeInTheDocument();

    rerender(
      <TransactionForm {...buildProps({ newType: "transfer", newTransferKind: "external" })} />
    );
    expect(screen.queryByLabelText("Cuenta destino")).not.toBeInTheDocument();

    rerender(<TransactionForm {...buildProps({ newType: "expense" })} />);
    expect(screen.queryByLabelText("Cuenta destino")).not.toBeInTheDocument();
  });

  it("oculta la cuenta origen entre las opciones de cuenta destino", async () => {
    const user = userEvent.setup();
    const accounts = [
      { id: "acc-1", userId: "user-1", name: "Corriente", type: "checking" as const, createdAt: "" },
      { id: "acc-2", userId: "user-1", name: "Ahorro", type: "savings" as const, createdAt: "" },
    ];
    render(
      <TransactionForm
        {...buildProps({
          newType: "transfer",
          newAccountId: "acc-1",
          accounts,
        })}
      />
    );

    await user.click(screen.getByRole("combobox", { name: "Cuenta destino" }));

    expect(screen.queryByRole("option", { name: "Corriente" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Ahorro" })).toBeInTheDocument();
  });

  it("mantiene los selectores visibles al editar una transferencia", () => {
    render(
      <TransactionForm
        {...buildProps({
          newType: "transfer",
          newTransferKind: "external",
          newTransferDirection: "in",
          editTxId: "tx-1",
        })}
      />
    );

    expect(screen.getByLabelText("Movimiento")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Movimiento" })).toHaveTextContent(
      "Con un tercero"
    );
    expect(screen.getByLabelText("Dirección")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Dirección" })).toHaveTextContent(
      "Entrada"
    );
  });
});
