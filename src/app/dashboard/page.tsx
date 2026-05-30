"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DashboardResponse } from "@/types/dashboard";
import { api } from "@/lib/api";
import type { MonthOption } from "@/lib/api/dashboard";
import { MONTH_NAMES } from "@/lib/budget-constants";
import { BalanceCard } from "./components/BalanceCard";
import { BudgetsCard } from "./components/BudgetsCard";
import { RecurringCard } from "./components/RecurringCard";
import { RecentTransactionsCard } from "./components/RecentTransactionsCard";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { DashboardError } from "./components/DashboardError";

function hasBalanceData(data: DashboardResponse): boolean {
  return (
    data.balance.income > 0 ||
    data.balance.expenses > 0 ||
    data.balance.savings > 0 ||
    data.balance.balance !== 0 ||
    (Array.isArray(data.budgets) && data.budgets.length > 0) ||
    (Array.isArray(data.recurring?.manual) && data.recurring.manual.length > 0) ||
    (Array.isArray(data.transactions) && data.transactions.length > 0)
  );
}

export default function DashboardPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentValue = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
  const [viewValue, setViewValue] = useState(currentValue);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const viewYear = Number(viewValue.split("-")[0]);
  const viewMonth = Number(viewValue.split("-")[1]);

  useEffect(() => {
    const controller = new AbortController();
    api.dashboard.months(controller.signal)
      .then(setAvailableMonths)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const loadDashboard = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    api.dashboard.get(viewYear, viewMonth, controller.signal)
      .then(setData)
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, [viewYear, viewMonth]);

  useEffect(() => {
    loadDashboard();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [loadDashboard]);

  const monthOptions = (() => {
    const seen = new Set<string>();
    const result: Array<{ value: string; label: string }> = [];

    for (const m of availableMonths) {
      const value = `${m.year}-${String(m.month).padStart(2, "0")}`;
      if (!seen.has(value)) {
        seen.add(value);
        result.push({ value, label: `${MONTH_NAMES[m.month - 1]} ${m.year}` });
      }
    }

    if (!seen.has(currentValue)) {
      result.push({ value: currentValue, label: `${MONTH_NAMES[currentMonth - 1]} ${currentYear}` });
    }

    result.sort((a, b) => {
      const [ay, am] = a.value.split("-").map(Number);
      const [by, bm] = b.value.split("-").map(Number);
      return ay - by || am - bm;
    });

    return result;
  })();

  const selectedMonthLabel = `${MONTH_NAMES[viewMonth - 1]} ${viewYear}`;
  const isCurrentMonth = viewValue === currentValue;

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
            <p className="text-sm text-text-muted mt-1">Cargando...</p>
          </header>
          <DashboardSkeleton />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
          </header>
          <DashboardError error={error ?? "Error al cargar datos"} onRetry={loadDashboard} />
        </div>
      </main>
    );
  }

  const headerContent = (
    <header className="mb-8 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
        <div className="flex items-center gap-2">
          <select
            aria-label="Mes y año"
            value={viewValue}
            onChange={(e) => setViewValue(e.target.value)}
            className="text-sm border border-border rounded-md px-2 py-1 bg-white text-text-primary"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {!isCurrentMonth && (
            <button
              onClick={() => setViewValue(currentValue)}
              className="text-sm bg-primary text-white font-bold rounded-md px-2 py-1 hover:bg-primary/90 transition-colors"
            >
              Volver a día actual
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-text-muted mt-1">{selectedMonthLabel}</p>
    </header>
  );

  if (!hasBalanceData(data)) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {headerContent}
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <p className="text-sm text-text-muted">No hay datos disponibles para {selectedMonthLabel}</p>
          </div>
        </div>
      </main>
    );
  }

  const balance = data.balance ?? { income: 0, expenses: 0, savings: 0, available: 0, balance: 0 };
  const budgets = Array.isArray(data.budgets) ? data.budgets : [];
  const rawRecurring = data.recurring ?? {};
  const subscriptions = Array.isArray(rawRecurring.manual) ? rawRecurring.manual : [];
  const transactions = Array.isArray(data.transactions) ? data.transactions : [];

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {headerContent}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <BalanceCard
            income={balance.income}
            expenses={balance.expenses}
            savings={balance.savings}
            available={balance.available}
            balance={balance.balance}
            vsPreviousMonth={balance.vsPreviousMonth}
          />
          <BudgetsCard budgets={budgets} />
          <RecurringCard subscriptions={subscriptions} />
          <RecentTransactionsCard transactions={transactions} />
        </div>
      </div>
    </main>
  );
}
