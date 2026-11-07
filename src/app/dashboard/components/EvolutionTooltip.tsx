"use client";

import { formatCurrency } from "@/lib/format";
import type { EvolutionTooltipProps } from "./types/EvolutionTooltip.types";

export function EvolutionTooltip({ active, label, payload }: Readonly<EvolutionTooltipProps>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm px-3 py-2 text-xs">
      <p className="font-medium text-text-primary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-text-muted">
          <span style={{ color: entry.color }}>{entry.name}: </span>
          {formatCurrency(entry.value ?? 0)}
        </p>
      ))}
    </div>
  );
}
