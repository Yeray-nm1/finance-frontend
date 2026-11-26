import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Account } from "@/types/accounts";
import { AccountList } from "../AccountList";

const accounts: Account[] = [
  { id: "acc-1", userId: "u1", name: "Cuenta principal", type: "checking", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "acc-2", userId: "u1", name: "Ahorro viaje", type: "savings", createdAt: "2026-01-02T00:00:00.000Z" },
];

const balances = { "acc-1": 1833.74, "acc-2": 500 };

function renderList(props: Record<string, unknown> = {}) {
  return render(
    <AccountList
      accounts={accounts}
      balances={balances}
      selectedId="acc-2"
      onSelectAccount={vi.fn()}
      {...props}
    />
  );
}

describe("AccountList", () => {
  it("muestra búsqueda, tipos y saldos de las cuentas", () => {
    renderList();

    expect(screen.getByRole("textbox", { name: "Buscar cuenta" })).toBeInTheDocument();
    expect(screen.getByText("Cuenta principal")).toBeInTheDocument();
    expect(screen.getByText("Cuenta corriente")).toBeInTheDocument();
    expect(screen.getByText("Ahorro viaje")).toBeInTheDocument();
    expect(screen.getByText("Ahorro")).toBeInTheDocument();
    expect(screen.getByText(/1\.833,74/)).toBeInTheDocument();
  });

  it("tiene scroll propio en la lista de cuentas", () => {
    const { container } = renderList();

    const scroll = container.querySelector('[data-testid="account-list-scroll"]');
    expect(scroll?.className).toContain("max-h-[520px]");
    expect(scroll?.className).toContain("overflow-y-auto");
  });

  it("marca la cuenta seleccionada", () => {
    renderList();

    expect(screen.getByRole("button", { name: /Ahorro viaje/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /Cuenta principal/ })).not.toHaveAttribute("aria-current");
  });

  it("filtra cuentas por nombre", async () => {
    const user = userEvent.setup();
    renderList();

    await user.type(screen.getByRole("textbox", { name: "Buscar cuenta" }), "ahorro");

    expect(screen.getByText("Ahorro viaje")).toBeInTheDocument();
    expect(screen.queryByText("Cuenta principal")).not.toBeInTheDocument();
  });
});
