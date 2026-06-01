"use client";

import { formatCurrency } from "@/lib/format";
import { getProgressAccent, DOT_COLORS } from "@/lib/budget-constants";
import { BudgetTypeSectionHeader } from "./BudgetTypeSectionHeader";
import type { BudgetTypeSectionProps } from "@/types/dashboard";

export function BudgetTypeSection({
  label,
  icon,
  budgets,
  isExpanded,
  onToggle,
  collapsible = true,
  typeProgress,
}: Readonly<BudgetTypeSectionProps>) {
  const barProgress = typeProgress ?? (budgets.length > 0
    ? budgets.reduce((sum, b) => sum + b.progress, 0) / budgets.length
    : 0)

  const progressAccent = getProgressAccent(barProgress);
  const firstBudget = collapsible ? null : budgets[0];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {collapsible ? (
        <button
          onClick={onToggle}
          className="w-full hover:bg-gray-50 transition-colors text-left"
        >
          <BudgetTypeSectionHeader
            label={label}
            icon={icon}
            collapsible
            barProgress={barProgress}
            progressAccent={progressAccent}
            isExpanded={isExpanded}
          />
          {isExpanded && (
            <div className="border-t border-border px-3 py-2 space-y-2 bg-gray-50/50">
              {budgets.map((b, idx) => (
                <div key={`${b.categoryType}-${b.category}-${idx}`} className="flex justify-between items-center text-xs pl-8">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${DOT_COLORS[b.status] ?? "bg-gray-300"}`} />
                    <span className="text-text-primary truncate">{b.category}</span>
                  </div>
                  <span className="text-text-muted whitespace-nowrap shrink-0 ml-3">
                    {b.spent.toFixed(2).replace('.', ',')} / {formatCurrency(b.budgeted)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </button>
      ) : (
        <BudgetTypeSectionHeader
          label={label}
          icon={icon}
          collapsible={false}
          barProgress={barProgress}
          progressAccent={progressAccent}
          isExpanded={false}
          spent={firstBudget?.spent}
          budgeted={firstBudget?.budgeted}
        />
      )}
    </div>
  );
}
