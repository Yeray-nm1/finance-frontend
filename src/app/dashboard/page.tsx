"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DashboardResponse } from "@/types/dashboard";
import { api } from "@/lib/api";
import type { MonthOption } from "@/lib/api/dashboard";
import { MONTH_NAMES } from "@/lib/budget-constants";
import { BalanceCard } from "./components/BalanceCard";
import { MonthlyEvolutionCard } from "./components/MonthlyEvolutionCard";
import { BudgetOverviewCard } from "./components/BudgetOverviewCard";
import { RecurringCard } from "./components/RecurringCard";
import { RecentTransactionsCard } from "./components/RecentTransactionsCard";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { DashboardError } from "./components/DashboardError";
import { OnboardingChecklist } from "./components/OnboardingChecklist";
import {
  getCurrentMonthValue,
  isValidMonthValue,
  readStoredMonth,
  writeStoredMonth,
} from "@/lib/selected-month";

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
  const currentValue = getCurrentMonthValue();
  const [viewValue, setViewValue] = useState(currentValue);
  const [monthReady, setMonthReady] = useState(false);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const viewYear = Number(viewValue.split("-")[0]);
  const viewMonth = Number(viewValue.split("-")[1]);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("month");
    const nextValue = isValidMonthValue(fromUrl)
      ? fromUrl
      : readStoredMonth() ?? currentValue;

    setViewValue(nextValue);
    writeStoredMonth(nextValue);
    setMonthReady(true);
  }, [currentValue]);

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
        console.error(e);
        setError("No se pudieron cargar los datos");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, [viewYear, viewMonth]);

  useEffect(() => {
    if (!monthReady) return;
    loadDashboard();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [loadDashboard, monthReady]);

  const handleMonthChange = useCallback((value: string) => {
    if (!isValidMonthValue(value)) return;
    setViewValue(value);
    writeStoredMonth(value);

    const url = new URL(window.location.href);
    url.searchParams.set("month", value);
    window.history.replaceState(null, "", url);
  }, []);

  const goToCurrentMonth = useCallback(() => {
    const value = getCurrentMonthValue();
    setViewValue(value);
    writeStoredMonth(value);

    const url = new URL(window.location.href);
    url.searchParams.delete("month");
    window.history.replaceState(null, "", url);
  }, []);

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
      const [currentYearValue, currentMonthValue] = currentValue.split("-").map(Number);
      seen.add(currentValue);
      result.push({
        value: currentValue,
        label: `${MONTH_NAMES[currentMonthValue - 1]} ${currentYearValue}`,
      });
    }

    if (!seen.has(viewValue)) {
      seen.add(viewValue);
      result.push({ value: viewValue, label: `${MONTH_NAMES[viewMonth - 1]} ${viewYear}` });
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
            onChange={(e) => handleMonthChange(e.target.value)}
            className="text-sm border border-border rounded-md px-2 py-1 bg-white text-text-primary"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {!isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
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
          <OnboardingChecklist />
          <div className="bg-white border border-border rounded-lg p-8 text-center">
            <p className="text-sm text-text-muted">No hay datos disponibles para {selectedMonthLabel}</p>
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BudgetOverviewCard budgets={[]} spending={[]} monthValue={viewValue} fillRow={false} />
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
  const categorySpending = Array.isArray(data.categorySpending) ? data.categorySpending : [];
  const monthlyEvolution = Array.isArray(data.monthlyEvolution) ? data.monthlyEvolution : [];

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {headerContent}
        <OnboardingChecklist />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BalanceCard
            income={balance.income}
            expenses={balance.expenses}
            savings={balance.savings}
            available={balance.available}
            balance={balance.balance}
            vsPreviousMonth={balance.vsPreviousMonth}
            monthValue={viewValue}
          />
          <BudgetOverviewCard
            budgets={budgets}
            spending={categorySpending}
            monthValue={viewValue}
          />
          <MonthlyEvolutionCard data={monthlyEvolution} />
          <RecurringCard subscriptions={subscriptions} />
          <RecentTransactionsCard transactions={transactions} monthValue={viewValue} />
        </div>
      </div>
    </main>
  );
}
