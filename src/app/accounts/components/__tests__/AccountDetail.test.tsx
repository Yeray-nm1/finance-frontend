import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Account } from "@/types/accounts";
import type { SavingsGoal } from "@/types/goals";
import type { Transaction } from "@/types/transactions";
import { AccountDetail } from "../AccountDetail";

const account: Account = {
  id: "acc-1",
  userId: "u1",
  name: "Ahorro viaje",
  type: "savings",
  createdAt: "2026-01-02T00:00:00.000Z",
};

const goal = {
  id: "goal-1",
  name: "Viaje Japón",
  progress: 48,
  accountId: "acc-1",
} as SavingsGoal;

const movements = [
  { id: "t1", description: "NETFLIX COM", amount: -11.99, date: "2026-05-27T00:00:00.000Z" },
  { id: "t2", description: "NOMINA", amount: 2500, date: "2026-05-25T00:00:00.000Z" },
] as Transaction[];

function renderDetail(props: Record<string, unknown> = {}) {
  return render(
    <AccountDetail
      account={account}
      balance={500}
      goal={goal}
      movements={movements}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      onImport={vi.fn()}
      {...props}
    />
  );
}

describe("AccountDetail", () => {
  it("muestra nombre, tipo, saldo y acciones", () => {
    renderDetail();

    expect(screen.getByRole("heading", { name: "Ahorro viaje" })).toBeInTheDocument();
    expect(screen.getByText("Ahorro")).toBeInTheDocument();
    expect(screen.getByText("SALDO")).toBeInTheDocument();
    expect(screen.getByText("500,00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Más acciones" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importar extracto" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar Ahorro viaje" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver movimientos/ })).toHaveAttribute(
      "href",
      "/transactions?accountId=acc-1"
    );
  });

  it("muestra la meta vinculada con su progreso", () => {
    renderDetail();

    expect(screen.getByText("Meta vinculada")).toBeInTheDocument();
    expect(screen.getByText("Viaje Japón · 48 %")).toBeInTheDocument();
    expect(screen.getByTestId("goal-progress").style.width).toBe("48%");
  });

  it("oculta la meta cuando la cuenta no tiene ninguna", () => {
    renderDetail({ goal: null });

    expect(screen.queryByText("Meta vinculada")).not.toBeInTheDocument();
  });

  it("lista los últimos movimientos con fecha, concepto e importe", () => {
    renderDetail();

    expect(screen.getByText("Últimos movimientos")).toBeInTheDocument();
    expect(screen.getByText(/27 may 2026 · NETFLIX COM/)).toBeInTheDocument();
    expect(screen.getByText("− 11,99")).toBeInTheDocument();
    expect(screen.getByText("+ 2.500,00")).toBeInTheDocument();
  });

  it("publica editar, importar y eliminar", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onEdit = vi.fn();
    const onImport = vi.fn();
    const onDelete = vi.fn();
    renderDetail({ onEdit, onImport, onDelete });

    await user.click(screen.getByRole("button", { name: "Editar Ahorro viaje" }));
    await user.click(screen.getByRole("button", { name: "Importar extracto" }));
    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Eliminar cuenta" }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onImport).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
