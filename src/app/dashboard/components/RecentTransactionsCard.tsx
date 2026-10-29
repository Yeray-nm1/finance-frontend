"use client";

import { formatCurrency, formatShortDate, getAmountPrefix } from "@/lib/format";
import { getAmountColor } from "@/components/ui/variants/transactions.variants";
import { DashboardCard } from "./DashboardCard";
import type { RecentTransactionsCardProps } from "./types/RecentTransactionsCard.types";

export function RecentTransactionsCard({ transactions }: Readonly<RecentTransactionsCardProps>) {
  return (
    <DashboardCard
      title="Transacciones recientes"
      emptyText="No hay transacciones este mes"
      href="/transactions"
      linkText="Ver más"
      isEmpty={transactions.length === 0}
    >
      <div className="max-h-[200px] overflow-y-auto pr-2 space-y-0 scrollbar-thin">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex justify-between items-center py-2.5 border-b border-border last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text-primary truncate">{tx.description}</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {formatShortDate(tx.date)}
                {tx.category && ` · ${tx.category}`}
                {tx.account && ` · ${tx.account}`}
              </p>
            </div>
            <span
              className={`text-xs font-medium ml-4 whitespace-nowrap ${getAmountColor(tx.type)}`}
            >
              {getAmountPrefix(tx.type)} {formatCurrency(Math.abs(tx.amount))}
            </span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
