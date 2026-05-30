"use client";

import { formatCurrency, formatShortDate } from "@/lib/format";
import { DashboardCard } from "./DashboardCard";
import type { RecurringCardProps } from "@/types/dashboard";

export function RecurringCard({ subscriptions }: Readonly<RecurringCardProps>) {
  return (
    <DashboardCard
      title="Recurrentes"
      emptyText="No hay suscripciones registradas"
      href="/subscriptions"
      linkText="Gestionar suscripciones"
      isEmpty={subscriptions.length === 0}
    >
      <div className="max-h-[200px] overflow-y-auto pr-1 space-y-0 scrollbar-thin"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
        {subscriptions.map((item, i) => (
          <div
            key={item.name}
            className={`flex justify-between items-start py-2.5 ${i < subscriptions.length - 1 ? 'border-b border-border' : ''}`}
          >
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-text-primary truncate">{item.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {item.status === "pending" && item.nextChargeDate && (
                  <span className="text-[11px] text-text-muted">
                    Próximo cobro: {formatShortDate(item.nextChargeDate)}
                  </span>
                )}
                {item.status === "paid" && item.lastChargeDate && (
                  <span className="text-[11px] text-text-muted">
                    Último cobro: {formatShortDate(item.lastChargeDate)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0 ml-3">
              <span className={`text-[11px] leading-none mb-1 ${item.status === "paid" ? "text-income bg-income/10" : "text-expense bg-expense/10"} px-2 py-0.5 rounded-full`}>
                {item.status === "paid" ? "Pagada" : "Pendiente"}
              </span>
              <span className="text-xs font-medium text-text-primary">
                {formatCurrency(item.amount)}
              </span>
              {item.status === "pending" && item.lastChargeDate && (
                <span className="text-[11px] text-text-muted">{formatShortDate(item.lastChargeDate)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
