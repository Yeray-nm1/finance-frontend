"use client";

import type { MonthlyBudget, Category } from "@/types";
import { CATEGORY_CONFIGS } from "@/types";
import { CategoryTypeViewCard } from "@/components/budgets/CategoryTypeViewCard";

interface BudgetOverviewProps {
  budget: MonthlyBudget;
  categoriesByType: Record<string, Category[]>;
}

export function BudgetOverview({ budget, categoriesByType }: BudgetOverviewProps) {
  return (
    <div className="mt-8 space-y-4">
      <h2 className="font-display text-2xl font-light text-gray-800">
        Distribución Actual
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px",
        }}
      >
        {budget.typeAllocations.map((alloc, idx) => {
          const typeInfo = CATEGORY_CONFIGS.find(
            (t) => t.type === alloc.type
          );
          if (!typeInfo) return null;

          return (
            <CategoryTypeViewCard
              key={alloc.type + idx}
              allocation={alloc}
              config={typeInfo}
              categories={categoriesByType[alloc.type] || []}
              totalIncome={budget.totalIncome}
            />
          );
        })}
      </div>
    </div>
  );
}
