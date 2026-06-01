"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { ProgressBar } from "./ProgressBar";
import type { BudgetTypeSectionHeaderProps } from "@/types/dashboard";

export function BudgetTypeSectionHeader({
  label,
  icon,
  collapsible,
  barProgress,
  progressAccent,
  isExpanded,
  spent = 0,
  budgeted = 0,
}: Readonly<BudgetTypeSectionHeaderProps>) {
  return (
    <div className="flex items-center gap-2 p-3">
      <span className="shrink-0">{icon}</span>
      <span className={`text-xs font-medium text-text-primary flex-1${collapsible ? '' : ' ml-2'}`}>{label}</span>
      <div className={`flex items-center ${collapsible ? 'gap-2' : 'gap-3'}`}>
        <ProgressBar value={barProgress} color={progressAccent} />
        {collapsible ? (
          <>
            <span className="text-[11px] text-text-muted font-medium w-10 text-right">
              {Math.round(barProgress)}%
            </span>
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </>
        ) : (
          <span className="text-[11px] text-text-muted whitespace-nowrap">
            {formatCurrency(spent)} / {formatCurrency(budgeted)}
            <span className="ml-1 font-medium">{Math.round(barProgress)}%</span>
          </span>
        )}
      </div>
    </div>
  );
}
