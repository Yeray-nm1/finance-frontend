"use client";

import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/format";
import { DONUT_COLORS } from "@/lib/constants";
import { CustomTooltip } from "./CustomTooltip";
import type { BalanceDonutProps } from "@/types/dashboard";

export function BalanceDonut({ income, expenses, savings, available, balance }: Readonly<BalanceDonutProps>) {
  if (income <= 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-text-muted">Sin datos de ingresos este mes</p>
      </div>
    );
  }

  const data = [
    { name: "Gastos", value: expenses, fill: DONUT_COLORS.expenses },
    { name: "Ahorro", value: savings, fill: DONUT_COLORS.savings },
    { name: "Disponible", value: available, fill: DONUT_COLORS.available },
  ].map((d) => ({
    ...d,
    percentage: income > 0 ? Math.min((d.value / income) * 100, 100) : 0,
  }));

  const balanceColor = balance >= 0 ? "text-income" : "text-expense";
  const prefix = balance >= 0 ? "+" : "-";
  const centerLabel = `${prefix}${formatCurrency(Math.abs(balance))}`;

  return (
    <div className="relative" style={{ width: 200, height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
            nameKey="name"
          />
          <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 9999 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
        <span className={`text-lg font-bold ${balanceColor}`}>{centerLabel}</span>
        <span className="text-[11px] text-text-muted">Balance</span>
      </div>
    </div>
  );
}
