"use client";

import type { BudgetTypeAllocation, Category, CategoryTypeConfig } from "@/types";
import { Card } from "@/components/ui/card";

interface CategoryTypeViewCardProps {
  allocation: BudgetTypeAllocation;
  config: CategoryTypeConfig;
  categories: Category[];
  totalIncome: number;
}

export function CategoryTypeViewCard({
  allocation,
  config,
  categories,
  totalIncome,
}: CategoryTypeViewCardProps) {
  const amount = (allocation.percentage / 100) * totalIncome;

  return (
    <Card className="border border-gray-200 shadow-md overflow-hidden">
      <div
        className={`h-1.5 bg-gradient-to-r ${config.accent.replace("bg-", "from-")} ${config.accent.replace("bg-", "to-").replace("-600", "-400")}`}
      />
      <div className="p-5 space-y-4">
        <h3 className="font-display text-base font-medium text-gray-800">
          {config.label}
        </h3>

        <div className="flex items-baseline justify-center gap-4 py-3 px-4 bg-gray-50/80 rounded-xl border border-gray-200">
          <span className={`text-3xl font-display font-light ${config.textAccent}`}>
            {allocation.percentage}
            <span className="text-lg text-gray-400 ml-1">%</span>
          </span>
          <span className="text-gray-300 text-xl">|</span>
          <span className="text-lg font-semibold text-gray-800">{amount.toFixed(2)}€</span>
        </div>

        {categories.length > 0 && (
          <div className="space-y-1.5 pt-3 border-t border-gray-100">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="block px-3 py-1.5 rounded-lg bg-gray-100 text-sm text-gray-600"
              >
                {cat.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
