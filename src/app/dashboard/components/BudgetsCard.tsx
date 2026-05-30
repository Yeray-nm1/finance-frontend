"use client";

import { useState } from "react";
import { typeLabels, typeIcons } from "@/lib/budget-constants";
import { BudgetTypeSection } from "./BudgetTypeSection";
import { DashboardCard } from "./DashboardCard";
import type { BudgetsCardProps } from "@/types/dashboard";

export function BudgetsCard({ budgets }: Readonly<BudgetsCardProps>) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const grouped: Record<string, typeof budgets> = {};
  for (const b of budgets) {
    if (!grouped[b.categoryType]) grouped[b.categoryType] = [];
    grouped[b.categoryType].push(b);
  }

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const typeOrder = ["needs", "leisure", "savings", "other"];

  return (
    <DashboardCard
      title="Presupuestos"
      emptyText="No hay presupuestos este mes"
      href="/budgets"
      linkText="Gestionar presupuesto"
      isEmpty={budgets.length === 0}
    >
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
        {typeOrder.map((type) => {
          const typeBudgets = grouped[type];
          if (!typeBudgets) return null;
          const iconData = typeIcons[type];
          const typeLabel = typeLabels[type] ?? type;
          const isTypeLevel = typeBudgets.every((b) => b.category === typeLabel);
          const totalSpent = typeBudgets.reduce((sum, b) => sum + b.spent, 0)
          const totalBudgeted = typeBudgets[0]?.budgeted ?? 0
          const typeProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
          return (
            <BudgetTypeSection
              key={type}
              type={type}
              label={typeLabel}
              icon={iconData?.icon ?? null}
              budgets={typeBudgets}
              isExpanded={expandedTypes.has(type)}
              onToggle={() => toggleType(type)}
              collapsible={!isTypeLevel}
              typeProgress={typeProgress}
            />
          );
        })}
      </div>
    </DashboardCard>
  );
}
