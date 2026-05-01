"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { DashboardResponse } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ok":
      return <Badge variant="secondary">🟢</Badge>;
    case "warning":
      return <Badge variant="default">🟡</Badge>;
    case "over":
      return <Badge variant="destructive">🔴</Badge>;
    default:
      return null;
  }
}

function getRecurringStatus(status: string) {
  switch (status) {
    case "stable":
      return <span className="text-mint text-sm">✔ pagado</span>;
    case "variable":
      return <span className="text-coral text-sm">⚠ variable</span>;
    default:
      return <span className="text-gray-400 text-sm">❓ {status}</span>;
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      api.dashboard
        .get()
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-serif text-xl text-gray-400">Cargando...</p>
      </main>
    );
  }

  if (loading || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-serif text-xl text-gray-400">Cargando dashboard...</p>
      </main>
    );
  }

  const { balance, budgets, recurring, transactions } = data;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold text-gray-800">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          ¿Cómo va tu economía este mes?
        </p>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-min">
        {/* Balance Card - Large */}
        <Card className="lg:col-span-1 card-delay-1">
          <CardHeader>
            <CardTitle>¿Cómo estoy este mes?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Ingresos</span>
                <span className="font-serif text-lg text-balance-income">
                  {formatCurrency(balance.income)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Gastos</span>
                <span className="font-serif text-lg text-balance-expense">
                  {formatCurrency(balance.expenses)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Ahorro</span>
                <span className="font-serif text-lg text-balance-savings">
                  {formatCurrency(balance.savings)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Disponible</span>
                <span className="font-serif text-lg text-balance-available">
                  {formatCurrency(balance.available)}
                </span>
              </div>
              <div className="border-t border-lavender-light pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Balance</span>
                  <span
                    className={`font-serif text-2xl font-semibold ${
                      balance.balance >= 0
                        ? "text-balance-income"
                        : "text-balance-expense"
                    }`}
                  >
                    {balance.balance >= 0 ? "+" : ""}
                    {formatCurrency(balance.balance)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budgets Card */}
        <Card className="lg:col-span-1 card-delay-2">
          <CardHeader>
            <CardTitle>¿Estoy cumpliendo mi plan?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgets.length === 0 && (
                <p className="text-gray-400 text-sm">No hay presupuestos configurados</p>
              )}
              {budgets.map((budget) => (
                <div key={budget.category} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{budget.category}</span>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(budget.status)}
                      <span className="text-gray-500">
                        {budget.progress}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>
                      {formatCurrency(budget.spent)} /{" "}
                      {formatCurrency(budget.budgeted)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(budget.progress, 100)}
                    className={
                      budget.status === "over"
                        ? "[&>div]:bg-coral"
                        : budget.status === "warning"
                          ? "[&>div]:bg-yellow-300"
                          : "[&>div]:bg-sage"
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recurring Card */}
        <Card className="lg:col-span-1 card-delay-3">
          <CardHeader>
            <CardTitle>¿Qué se repite en mi vida?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recurring.manual.length === 0 && recurring.detected.length === 0 && (
                <p className="text-gray-400 text-sm">No hay suscripciones detectadas</p>
              )}

              {recurring.manual.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center"
                >
                  <span className="font-medium text-sm">{item.name}</span>
                  <div className="text-right">
                    <div className="font-serif">
                      {formatCurrency(item.amount)}
                    </div>
                    <span className="text-mint text-sm">✔ pagado</span>
                  </div>
                </div>
              ))}

              {recurring.detected.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center"
                >
                  <span className="font-medium text-sm">{item.name}</span>
                  <div className="text-right">
                    <div className="font-serif">
                      {formatCurrency(item.amount)}
                    </div>
                    {getRecurringStatus(item.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transactions Card - Full Width */}
        <Card className="lg:col-span-3 card-delay-4">
          <CardHeader>
            <CardTitle>¿Qué ha pasado?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transactions.length === 0 && (
                <p className="text-gray-400 text-sm">No hay transacciones recientes</p>
              )}
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-2 border-b border-lavender-light last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{tx.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.date).toLocaleDateString("es-ES")}
                      {tx.category && ` · ${tx.category}`}
                      {tx.account && ` · ${tx.account}`}
                    </p>
                  </div>
                  <span
                    className={`font-serif font-medium ${
                      tx.type === "income"
                        ? "text-balance-income"
                        : tx.type === "expense"
                          ? "text-balance-expense"
                          : "text-balance-savings"
                    }`}
                  >
                    {tx.type === "income"
                      ? "+"
                      : tx.type === "expense"
                        ? "-"
                        : "↔"}{" "}
                    {formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
