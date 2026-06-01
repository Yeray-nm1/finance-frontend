"use client";

import { formatCurrency } from "@/lib/format";
import { BalanceDonut } from "./BalanceDonut";
import type { BalanceCardProps } from "@/types/dashboard";

export function BalanceCard({
  income,
  expenses,
  savings,
  available,
  balance,
  vsPreviousMonth,
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
          <div className="flex justify-between items-center text-sm">
            <span className="text-income font-medium">Ingresos</span>
            <span className="font-medium text-text-primary">{formatCurrency(income)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-expense font-medium">Gastos</span>
            <span className="font-medium text-text-primary">{formatCurrency(expenses)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-savings font-medium">Ahorro</span>
            <span className="font-medium text-text-primary">{formatCurrency(savings)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-available font-medium">Disponible</span>
            <span className="font-medium text-text-primary">{formatCurrency(available)}</span>
          </div>

          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase tracking-wider text-text-secondary">Balance</span>
              <span className={`font-semibold text-xl ${balance >= 0 ? "text-income" : "text-expense"}`}>
                {balance >= 0 ? "+" : ""}{formatCurrency(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {vsPreviousMonth !== undefined && (
        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="text-xs text-text-secondary">Diferencia respecto al mes anterior:</span>
          <span className={`text-xs font-medium ${vsPreviousMonth.percentage >= 0 ? "text-income" : "text-expense"}`}>
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
