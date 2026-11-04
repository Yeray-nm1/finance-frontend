import type { BudgetCategoryDetailsProps } from "./types/BudgetCategoryDetails.types";
import type { Category } from "@/types/categories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { typeLabels } from "@/lib/budget-constants";
import { typeIcons } from "@/components/ui/variants/budget.variants";
import { formatCurrency } from "@/lib/format";
import { getAllocation, roundCurrency } from "@/lib/budget-allocation";

export function BudgetCategoryDetails({
  categories,
  selectedType,
  typeAllocations,
  categoryAllocations,
  onPercentageChange,
  onCategoryAmountChange,
  totalIncome,
  remaining,
  saveError,
  onOpenEditCategory,
  onDeleteCategory,
  onAddCategory,
}: Readonly<BudgetCategoryDetailsProps>) {
  const categoriesByType = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  const currentCategories = selectedType ? categoriesByType[selectedType] ?? [] : [];
  const selectedAllocation = typeAllocations.find((a) => a.type === selectedType);
  const typeAmount = totalIncome * ((selectedAllocation?.percentage ?? 0) / 100);

  const isBalanced = Math.abs(remaining) < 0.005;
  const remainingMessage = isBalanced
    ? "✓ Reparto completo"
    : remaining > 0
      ? `Te quedan ${formatCurrency(remaining)} por repartir`
      : `Te has pasado en ${formatCurrency(Math.abs(remaining))}`;

  return (
    <Card className="h-full">
      <CardContent className="p-5 h-full flex flex-col">
        {selectedType ? (
          <div className="flex flex-col flex-1 min-h-0 gap-5">
            <div className="shrink-0 grid gap-x-3 gap-y-4" style={{ gridTemplateColumns: "40px 1fr" }}>
              <div className={`w-10 h-10 rounded-lg ${typeIcons[selectedType].bg} ${typeIcons[selectedType].color} flex items-center justify-center shrink-0 self-center`}>
                {typeIcons[selectedType].icon}
              </div>
              <div className="flex items-center justify-between min-w-0 self-center">
                <h2 className="font-serif text-lg font-semibold text-text-primary">
                  {typeLabels[selectedType]}
                </h2>
                <span className="text-sm font-semibold text-text-primary whitespace-nowrap shrink-0 ml-4">
                  {selectedAllocation?.percentage ?? 0}% &middot; {formatCurrency(typeAmount)}
                </span>
              </div>
              <div className="col-span-2">
                <Slider
                  value={[selectedAllocation?.percentage ?? 0]}
                  onValueChange={([v]) => onPercentageChange(selectedType, v)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {saveError && (
              <p className="shrink-0 text-sm text-expense bg-expense/5 p-3 rounded-lg">{saveError}</p>
            )}

            {currentCategories.length === 0 ? (
              <p className="shrink-0 text-sm text-text-muted text-center py-4">
                Sin categorías en este tipo de gasto
              </p>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="space-y-2">
                  {currentCategories.map((cat) => {
                    const amount = getAllocation(categoryAllocations, cat.id);
                    const percentage = typeAmount > 0 ? (amount / typeAmount) * 100 : 0;
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {cat.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {percentage.toFixed(1)}% del tipo
                          </p>
                        </div>
                        <div className="relative w-28 shrink-0">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                            aria-label={`Importe de ${cat.name}`}
                            value={amount || ""}
                            onChange={(e) =>
                              onCategoryAmountChange(cat.id, roundCurrency(Number(e.target.value)))
                            }
                            className="pr-6 text-right"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">
                            €
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${cat.name}`}
                            onClick={() => onOpenEditCategory(cat)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Eliminar ${cat.name}`}
                            onClick={() => onDeleteCategory(cat)}
                          >
                            <Trash2 className="size-4 text-expense" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div
              className={`shrink-0 p-3 rounded-lg text-sm text-center font-medium ${
                isBalanced ? "bg-income/5 text-income" : "bg-expense/5 text-expense"
              }`}
            >
              {remainingMessage}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2 shrink-0"
              onClick={onAddCategory}
            >
              <Plus className="size-4" /> Añadir categoría
            </Button>
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-12">
            Selecciona un tipo en la columna izquierda
          </p>
        )}
      </CardContent>
    </Card>
  );
}
