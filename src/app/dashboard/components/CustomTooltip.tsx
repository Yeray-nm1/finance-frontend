"use client";

import { formatCurrency } from "@/lib/format";
import type { CustomTooltipProps } from "@/types/dashboard";

export function CustomTooltip({ active, payload }: Readonly<CustomTooltipProps>) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="bg-white border border-border rounded-lg shadow-sm px-3 py-2 text-xs" style={{ zIndex: 9999, position: 'relative' }}>
      <p className="font-medium text-text-primary">{entry.name}</p>
      <p className="text-text-muted">{formatCurrency(entry.value)}</p>
      <p className="text-text-muted">{entry.payload.percentage.toFixed(1)}%</p>
    </div>
  );
}
