"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { getBalanceColor } from "@/components/ui/variants/dashboard.variants";
import { BalanceDonut } from "./BalanceDonut";
import type { BalanceCardProps } from "./types/BalanceCard.types";

function transactionsHref(flow: "income" | "expense" | "savings", monthValue?: string): string {
  const params = new URLSearchParams({ flow });
  if (monthValue) params.set("month", monthValue);
  return `/transactions?${params.toString()}`;
}

export function BalanceCard({
  income,
  expenses,
  savings,
  available,
  balance,
  vsPreviousMonth,
  monthValue,
}: Readonly<BalanceCardProps>) {
  return (
    <section className="bg-white border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs uppercase tracking-widest text-text-muted">Balance</h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="shrink-0">
          <BalanceDonut
            income={income}
            expenses={expenses}
            savings={savings}
            available={available}
            balance={balance}
          />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <Link
            href={transactionsHref("income", monthValue)}
            className="flex justify-between items-center text-sm rounded-md -mx-2 px-2 py-1 hover:bg-bg-elevated transition-colors group"
          >
            <span className="text-income font-medium group-hover:underline">Ingresos</span>
            <span className="font-medium text-text-primary">{formatCurrency(income)}</span>
          </Link>
          <Link
            href={transactionsHref("expense", monthValue)}
            className="flex justify-between items-center text-sm rounded-md -mx-2 px-2 py-1 hover:bg-bg-elevated transition-colors group"
          >
            <span className="text-expense font-medium group-hover:underline">Gastos</span>
            <span className="font-medium text-text-primary">{formatCurrency(expenses)}</span>
          </Link>
          <Link
            href={transactionsHref("savings", monthValue)}
            className="flex justify-between items-center text-sm rounded-md -mx-2 px-2 py-1 hover:bg-bg-elevated transition-colors group"
          >
            <span className="text-savings font-medium group-hover:underline">Ahorro</span>
            <span className="font-medium text-text-primary">{formatCurrency(savings)}</span>
          </Link>
          <div className="flex justify-between items-center text-sm -mx-2 px-2 py-1">
            <span className="text-available font-medium">Disponible</span>
            <span className="font-medium text-text-primary">{formatCurrency(available)}</span>
          </div>

          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider text-text-secondary">Balance</span>
              <span className={`font-semibold text-xl ${getBalanceColor(balance)}`}>
                {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {vsPreviousMonth !== undefined && (
        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="text-xs text-text-secondary">Diferencia respecto al mes anterior:</span>
          <span className={`text-xs font-medium ${getBalanceColor(vsPreviousMonth.percentage)}`}>
            {vsPreviousMonth.percentage >= 0 ? "+" : ""}{vsPreviousMonth.percentage.toFixed(1)}%
          </span>
          <span className="text-xs text-text-muted">
            ({vsPreviousMonth.percentage >= 0 ? "+" : ""}{formatCurrency(vsPreviousMonth.amountDiff)})
          </span>
        </div>
      )}
    </section>
  );
}
