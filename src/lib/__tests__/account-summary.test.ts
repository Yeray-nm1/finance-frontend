import { describe, expect, it } from "vitest";
import type { Transaction } from "@/types/transactions";
import type { SavingsGoal } from "@/types/goals";
import { buildAccountSummary, formatMovementDate, getLinkedGoal } from "@/lib/account-summary";

function tx(overrides: Partial<Transaction> & Pick<Transaction, "id" | "accountId" | "amount" | "date">): Transaction {
  return {
    userId: "user-1",
    transferAccountId: null,
    categoryId: null,
    description: overrides.id,
    type: overrides.amount >= 0 ? "income" : "expense",
    isSubscription: false,
    createdAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

const transactions: Transaction[] = [
  tx({ id: "t1", accountId: "acc-1", amount: 2500, date: "2026-05-25T00:00:00.000Z", description: "NOMINA" }),
  tx({ id: "t2", accountId: "acc-1", amount: -11.99, date: "2026-05-27T00:00:00.000Z", description: "NETFLIX" }),
  tx({ id: "t3", accountId: "acc-1", amount: -35, date: "2026-05-27T00:00:00.000Z", description: "MERCADONA" }),
  tx({ id: "t4", accountId: "acc-1", amount: -3.99, date: "2026-05-15T00:00:00.000Z", description: "AMAZON" }),
  tx({ id: "t5", accountId: "acc-2", amount: 500, date: "2026-05-01T00:00:00.000Z", description: "APORTACION" }),
  tx({ id: "t6", accountId: null, amount: -8, date: "2026-05-10T00:00:00.000Z", description: "GITHUB" }),
  tx({ id: "t7", accountId: null, amount: -4.99, date: "2026-05-03T00:00:00.000Z", description: "SPOTIFY" }),
];

describe("buildAccountSummary", () => {
  it("suma los importes firmados por cuenta", () => {
    const summary = buildAccountSummary(transactions);

    expect(summary.balances["acc-1"]).toBeCloseTo(2449.02, 2);
    expect(summary.balances["acc-2"]).toBe(500);
  });

  it("recoge los movimientos sin cuenta ordenados por fecha descendente", () => {
    const summary = buildAccountSummary(transactions);

    expect(summary.unassigned.map((item) => item.id)).toEqual(["t6", "t7"]);
  });

  it("devuelve los tres últimos movimientos de cada cuenta", () => {
    const summary = buildAccountSummary(transactions);

    expect(summary.recentByAccount["acc-1"].map((item) => item.id)).toEqual(["t2", "t3", "t1"]);
    expect(summary.recentByAccount["acc-2"].map((item) => item.id)).toEqual(["t5"]);
  });
});

describe("formatMovementDate", () => {
  it("muestra día, mes abreviado y año", () => {
    expect(formatMovementDate("2026-05-27T00:00:00.000Z")).toBe("27 may 2026");
  });
});

describe("getLinkedGoal", () => {
  const goals = [
    { id: "g1", accountId: null, name: "Sin cuenta", isArchived: false },
    { id: "g2", accountId: "acc-2", name: "Viaje Japón", isArchived: false, progress: 48 },
    { id: "g3", accountId: "acc-2", name: "Archivada", isArchived: true },
  ] as unknown as SavingsGoal[];

  it("devuelve la primera meta activa vinculada a la cuenta", () => {
    expect(getLinkedGoal(goals, "acc-2")?.name).toBe("Viaje Japón");
  });

  it("devuelve null si la cuenta no tiene meta activa", () => {
    expect(getLinkedGoal(goals, "acc-1")).toBeNull();
  });
});
