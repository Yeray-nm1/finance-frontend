"use client";

import { useState } from "react";
import type { Category } from "@/types/categories";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { typeLabels, typeIcons, formatCurrency } from "@/lib/budget-constants";

interface BudgetReadOnlyViewProps {
  totalIncome: number;
  typeAllocations: readonly { readonly type: string; readonly percentage: number }[];
  categories: readonly Category[];
}

export function BudgetReadOnlyView({
  totalIncome,
  typeAllocations,
  categories,
}: BudgetReadOnlyViewProps) {
  const totalAllocated = typeAllocations.reduce((s, a) => s + a.percentage, 0);
  const isValidTotal = Math.abs(totalAllocated - 100) < 0.15;

  const categoriesByType = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  function toggleType(type: string) {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <span className="text-sm text-text-muted">Presupuesto total</span>
          <span className="text-2xl font-semibold text-text-primary">
            {formatCurrency(totalIncome)}
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 items-start">
        {typeAllocations.map((alloc) => {
          const amount = totalIncome * (alloc.percentage / 100);
          const typeCats = categoriesByType[alloc.type] ?? [];
          const TypeIcon = typeIcons[alloc.type];
          const isExpanded = expandedTypes.has(alloc.type);

          return (
            <Card key={alloc.type}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg ${TypeIcon.bg} ${TypeIcon.color} flex items-center justify-center shrink-0`}>
                    {TypeIcon.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-base font-semibold text-gray-800">
                      {typeLabels[alloc.type]}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {alloc.percentage}% &middot; {formatCurrency(amount)}
                    </p>
                  </div>
                </div>
                {typeCats.length > 0 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleType(alloc.type)}
                      className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
                    >
                      <ChevronDown
                        className={`size-4 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                      {isExpanded ? "Ocultar categorías" : `${typeCats.length} categorías`}
                    </button>
                    {isExpanded && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {typeCats.map((cat) => (
                          <span
                            key={cat.id}
                            className="px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-text-primary"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-text-muted">Sin categorías</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-5">
          <p className={`text-sm text-center font-medium ${
            isValidTotal ? "text-green-700" : "text-red-600"
          }`}>
            {isValidTotal
              ? "✓ Distribución correcta (100%)"
              : `Los porcentajes suman ${totalAllocated.toFixed(1)}% — deben sumar 100%`
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
