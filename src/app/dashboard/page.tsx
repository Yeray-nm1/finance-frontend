"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { DashboardResponse } from "@/types";
import { CsvDropZone } from "@/components/CsvDropZone";

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
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    api.dashboard
      .get()
      .then((res) => {
        setData(res);
        setHasData(
          res.transactions.length > 0 ||
            res.budgets.length > 0 ||
            res.recurring.manual.length > 0 ||
            res.recurring.detected.length > 0
        );
      })
      .catch(() => setHasData(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated, fetchDashboard]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg-primary">
        <p className="text-text-muted text-sm animate-flicker">
          CARGANDO...
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg-primary">
        <p className="text-text-muted text-sm animate-flicker">
          CARGANDO DASHBOARD...
        </p>
      </main>
    );
  }

  if (!hasData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
              FINANCE
            </h1>
            <p className="text-text-muted text-xs uppercase tracking-widest">
              Sube tu primer CSV para empezar
            </p>
          </div>
          <CsvDropZone onImported={fetchDashboard} />
        </div>
      </main>
    );
  }

  const { balance, budgets, recurring, transactions } = data!;

  return (
    <main className="min-h-screen bg-bg-primary p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8 animate-slide-up">
          <h1 className="font-display text-3xl font-bold text-text-primary">
            DASHBOARD
          </h1>
          <p className="text-text-muted text-xs uppercase tracking-widest mt-1">
            ¿Cómo va tu economía este mes?
          </p>
        </header>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Balance Card */}
          <section className="terminal-card p-5 animate-slide-up stagger-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs uppercase tracking-widest text-text-muted">
                Balance
              </h2>
              {balance.vsPreviousMonth !== undefined && (
                <span
                  className={`text-xs ${
                    balance.vsPreviousMonth >= 0 ? "text-acid" : "text-red"
                  }`}
                >
                  {formatPercent(balance.vsPreviousMonth)} vs mes anterior
                </span>
              )}
            </div>

            <div className="space-y-3">
              <BalanceRow label="Ingresos" amount={balance.income} color="text-acid" />
              <BalanceRow label="Gastos" amount={balance.expenses} color="text-red" />
              <BalanceRow label="Ahorro" amount={balance.savings} color="text-blue" />
              <BalanceRow label="Disponible" amount={balance.available} color="text-purple" />

              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-wider text-text-secondary">
                    Balance
                  </span>
                  <span
                    className={`font-display text-xl font-bold ${
                      balance.balance >= 0 ? "text-acid" : "text-red"
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
          <section className="terminal-card p-5 animate-slide-up stagger-2">
            <h2 className="text-xs uppercase tracking-widest text-text-muted mb-5">
              Presupuestos
            </h2>

            {budgets.length === 0 ? (
              <p className="text-text-muted text-xs py-4">No hay presupuestos configurados</p>
            ) : (
              <div className="space-y-4">
                {budgets.map((budget) => {
                  const isOver = budget.progress > 100;
                  const barColor = isOver ? "progress-fill-red" : "progress-fill-green";
                  return (
                    <div key={budget.category} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-text-primary">{budget.category}</span>
                        <span className={isOver ? "text-red" : "text-acid"}>
                          {budget.progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-track w-full">
                        <div
                          className={`progress-fill ${barColor}`}
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
            )}
          </section>

          {/* Recurring Card */}
          <section className="terminal-card p-5 animate-slide-up stagger-3">
            <h2 className="text-xs uppercase tracking-widest text-text-muted mb-5">
              Recurrentes
            </h2>

            {recurring.manual.length === 0 && recurring.detected.length === 0 ? (
              <p className="text-text-muted text-xs py-4">No hay suscripciones</p>
            ) : (
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
                      <span className="text-acid text-[11px]">✔ pagado</span>
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
                      <span className="text-amber text-[11px]">
                        ⚠ requiere acción
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Transactions Card */}
          <section className="terminal-card p-5 animate-slide-up stagger-4">
            <h2 className="text-xs uppercase tracking-widest text-text-muted mb-5">
              Transacciones
            </h2>

            {transactions.length === 0 ? (
              <p className="text-text-muted text-xs py-4">No hay transacciones</p>
            ) : (
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
                          ? "text-acid"
                          : tx.type === "expense"
                          ? "text-red"
                          : "text-blue"
                      }`}
                    >
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "↔"}{" "}
                      {formatCurrency(Math.abs(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

