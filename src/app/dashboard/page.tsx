"use client";

import { useState } from "react";
import type { DashboardResponse } from "@/types";
import { MOCK_DASHBOARD } from "@/lib/mock-data";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function BalanceRow({
  label,
  amount,
  color,
}: {
  label: string;
  amount: number;
  color: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-text-secondary uppercase tracking-wider">
        {label}
      </span>
      <span className={`text-sm font-medium ${color}`}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [data] = useState<DashboardResponse>(MOCK_DASHBOARD);

  const { balance, budgets, recurring, transactions } = data;

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 animate-fade-in">
          <h1 className="text-xl font-semibold text-text-primary">
            Dashboard
          </h1>
          <p className="text-sm text-text-muted mt-1">
            ¿Cómo va tu economía este mes?
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Balance Card */}
          <section className="bg-white border border-border rounded-lg p-5 animate-fade-in stagger-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs uppercase tracking-widest text-text-muted">
                Balance
              </h2>
              {balance.vsPreviousMonth !== undefined && (
                <span
                  className={`text-xs ${
                    balance.vsPreviousMonth >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {formatPercent(balance.vsPreviousMonth)} vs mes anterior
                </span>
              )}
            </div>

            <div className="space-y-3">
              <BalanceRow label="Ingresos" amount={balance.income} color="text-income" />
              <BalanceRow label="Gastos" amount={balance.expenses} color="text-expense" />
              <BalanceRow label="Ahorro" amount={balance.savings} color="text-savings" />
              <BalanceRow label="Disponible" amount={balance.available} color="text-available" />

              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider text-text-secondary">
                    Balance
                  </span>
                  <span
                    className={`font-semibold text-xl ${
                      balance.balance >= 0 ? "text-income" : "text-expense"
                    }`}
                  >
                    {balance.balance >= 0 ? "+" : ""}
                    {formatCurrency(balance.balance)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Budgets Card */}
          <section className="bg-white border border-border rounded-lg p-5 animate-fade-in stagger-2">
            <h2 className="text-xs uppercase tracking-widest text-text-muted mb-5">
              Presupuestos
            </h2>

            <div className="space-y-4">
              {budgets.map((budget) => {
                const isOver = budget.progress > 100;
                return (
                  <div key={budget.category} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-primary">{budget.category}</span>
                      <span className={isOver ? "text-expense" : "text-income"}>
                        {budget.progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-[#e5e7eb] rounded-sm overflow-hidden h-1.5">
                      <div
                        className={`h-full rounded-sm transition-all ${
                          isOver ? "bg-expense" : "bg-income"
                        }`}
                        style={{ width: `${Math.min(budget.progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-end text-[11px] text-text-muted">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.budgeted)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recurring Card */}
          <section className="bg-white border border-border rounded-lg p-5 animate-fade-in stagger-3">
            <h2 className="text-xs uppercase tracking-widest text-text-muted mb-5">
              Recurrentes
            </h2>

            <div className="space-y-3">
              {recurring.manual.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="text-text-primary">{item.name}</span>
                  <div className="text-right">
                    <div className="text-text-primary font-medium">
                      {formatCurrency(item.amount)}
                    </div>
                    <span className="text-income text-[11px]">pagado</span>
                  </div>
                </div>
              ))}

              {recurring.detected.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="text-text-primary">{item.name}</span>
                  <div className="text-right">
                    <div className="text-text-primary font-medium">
                      {formatCurrency(item.amount)}
                    </div>
                    <span className="text-[#d97706] text-[11px]">
                      requiere accion
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Transactions Card */}
          <section className="bg-white border border-border rounded-lg p-5 animate-fade-in stagger-4">
            <h2 className="text-xs uppercase tracking-widest text-text-muted mb-5">
              Transacciones recientes
            </h2>

            <div className="space-y-0 max-h-80 overflow-y-auto pr-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-2.5 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary truncate">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {new Date(tx.date).toLocaleDateString("es-ES")}
                      {tx.category && ` · ${tx.category}`}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium ml-4 whitespace-nowrap ${
                      tx.type === "income"
                        ? "text-income"
                        : tx.type === "expense"
                        ? "text-expense"
                        : "text-savings"
                    }`}
                  >
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "↔"}{" "}
                    {formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
