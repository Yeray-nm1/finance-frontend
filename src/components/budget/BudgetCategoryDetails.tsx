import type { BudgetCategoryDetailsProps } from "./types";
import type { Category } from "@/types/categories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { typeLabels, typeIcons, formatCurrency } from "@/lib/budget-constants";

export function BudgetCategoryDetails({
  categories,
  selectedType,
  typeAllocations,
  onPercentageChange,
  totalIncome,
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

  return (
    <Card className="h-full">
      <CardContent className="p-5">
        {!selectedType ? (
          <p className="text-sm text-text-muted text-center py-12">
            Selecciona un tipo en la columna izquierda
          </p>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-x-3 gap-y-4" style={{ gridTemplateColumns: "40px 1fr" }}>
              <div className={`w-10 h-10 rounded-lg ${typeIcons[selectedType].bg} ${typeIcons[selectedType].color} flex items-center justify-center shrink-0 self-center`}>
                {typeIcons[selectedType].icon}
              </div>
              <div className="flex items-center justify-between min-w-0 self-center">
                <h2 className="font-serif text-lg font-semibold text-gray-800">
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
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{saveError}</p>
            )}

            <div className="space-y-2">
              {currentCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <span className="text-sm font-medium text-text-primary">
                    {cat.name}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenEditCategory(cat)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteCategory(cat)}
                    >
                      <Trash2 className="size-4 text-expense" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onAddCategory}
            >
              <Plus className="size-4" /> Añadir categoría
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
