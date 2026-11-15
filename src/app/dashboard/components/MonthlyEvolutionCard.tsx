"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MONTH_NAMES } from "@/lib/budget-constants";
import { formatCurrency } from "@/lib/format";
import { EvolutionTooltip } from "./EvolutionTooltip";
import type { MonthlyEvolutionCardProps } from "./types/MonthlyEvolutionCard.types";

function formatAxisValue(value: number): string {
  return `${Math.round(value).toLocaleString("es-ES")} €`;
}

export function MonthlyEvolutionCard({ data }: Readonly<MonthlyEvolutionCardProps>) {
  const chartData = data.map((item) => ({
    ...item,
    label: `${MONTH_NAMES[item.month - 1].slice(0, 3)} ${String(item.year).slice(2)}`,
  }));

  const hasData = data.some((item) => item.income > 0 || item.expenses > 0);

  return (
    <section className="bg-white border border-border rounded-lg p-5 lg:col-span-2">
      <h2 className="text-xs uppercase tracking-widest text-text-muted mb-5">
        Evolución mensual
      </h2>

      {hasData ? (
        <figure className="m-0">
          <figcaption className="sr-only">
            Evolución mensual de ingresos y gastos en los últimos 6 meses.{" "}
            {chartData
              .map(
                (item) =>
                  `${item.label}: ingresos ${formatCurrency(item.income)}, gastos ${formatCurrency(item.expenses)}.`,
              )
              .join(" ")}
          </figcaption>
          <div className="h-56" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={64}
                  tickFormatter={formatAxisValue}
                />
                <Tooltip content={<EvolutionTooltip />} />
                <Bar dataKey="income" name="Ingresos" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Gastos" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center gap-5 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-income" /> Ingresos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-expense" /> Gastos
            </span>
          </div>
        </figure>
      ) : (
        <p className="text-xs text-text-muted flex items-center justify-center min-h-32">
          Sin datos en los últimos 6 meses
        </p>
      )}
    </section>
  );
}
