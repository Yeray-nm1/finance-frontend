"use client";

import { useMemo, useState } from "react";
import type { BudgetCategoryDetailsProps } from "./types/BudgetCategoryDetails.types";
import type { Category } from "@/types/categories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { typeLabels } from "@/lib/budget-constants";
import { typeIcons } from "@/components/ui/variants/budget.variants";
import { formatCurrency } from "@/lib/format";
import { getAllocation, roundCurrency } from "@/lib/budget-allocation";
import { cn } from "@/lib/utils";

type AmountFilter = "with" | "without" | "all";

const VISIBLE_WITH_AMOUNT = 4;

export function BudgetCategoryDetails({
  categories,
  selectedType,
  typeAllocations,
  categoryAllocations,
  onCategoryAmountChange,
  totalIncome,
  remaining,
  saveError,
  onOpenEditCategory,
  onDeleteCategory,
  onAddCategory,
}: Readonly<BudgetCategoryDetailsProps>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AmountFilter>("all");
  const [showAllWith, setShowAllWith] = useState(false);
  const [showWithout, setShowWithout] = useState(false);

  const categoriesByType = useMemo(
    () =>
      categories.reduce((acc, cat) => {
        if (!acc[cat.type]) acc[cat.type] = [];
        acc[cat.type].push(cat);
        return acc;
      }, {} as Record<string, Category[]>),
    [categories]
  );

  const currentCategories = useMemo(
    () => (selectedType ? categoriesByType[selectedType] ?? [] : []),
    [categoriesByType, selectedType]
  );
  const selectedAllocation = typeAllocations.find((a) => a.type === selectedType);
  const typeAmount = totalIncome * ((selectedAllocation?.percentage ?? 0) / 100);

  const { withAmount, withoutAmount } = useMemo(() => {
    const withAmount: Category[] = [];
    const withoutAmount: Category[] = [];
    for (const cat of currentCategories) {
      if (getAllocation(categoryAllocations, cat.id) > 0) withAmount.push(cat);
      else withoutAmount.push(cat);
    }
    return { withAmount, withoutAmount };
  }, [currentCategories, categoryAllocations]);

  const matchesSearch = (cat: Category) =>
    cat.name.toLocaleLowerCase("es").includes(search.trim().toLocaleLowerCase("es"));

  const visibleWith = withAmount.filter(matchesSearch);
  const visibleWithout = withoutAmount.filter(matchesSearch);
  const hiddenWith = showAllWith ? [] : visibleWith.slice(VISIBLE_WITH_AMOUNT);
  const shownWith = showAllWith ? visibleWith : visibleWith.slice(0, VISIBLE_WITH_AMOUNT);
  const shownWithout =
    filter === "without" || (filter === "all" && showWithout) ? visibleWithout : [];

  const isBalanced = Math.abs(remaining) < 0.005;
  const remainingMessage = isBalanced
    ? "✓ Reparto completo"
    : remaining > 0
      ? `Te quedan ${formatCurrency(remaining)} por repartir`
      : `Te has pasado en ${formatCurrency(Math.abs(remaining))}`;

  const filters: Array<{ key: AmountFilter; label: string }> = [
    { key: "with", label: `Con importe (${withAmount.length})` },
    { key: "without", label: `Sin importe (${withoutAmount.length})` },
    { key: "all", label: `Todas (${currentCategories.length})` },
  ];

  const dot = selectedType ? typeIcons[selectedType] ?? typeIcons.other : typeIcons.other;

  function renderRow(cat: Category) {
    const amount = getAllocation(categoryAllocations, cat.id);
    const percentage = typeAmount > 0 ? (amount / typeAmount) * 100 : 0;
    return (
      <div
        key={cat.id}
        className="flex items-center gap-3 rounded-xl border border-border px-4 py-2.5"
      >
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{cat.name}</p>
          <p className="text-xs text-text-muted">{Math.round(percentage)} % del tipo</p>
        </div>
        <div className="relative w-28 shrink-0">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            aria-label={`Importe de ${cat.name}`}
            value={amount || ""}
            onChange={(event) =>
              onCategoryAmountChange(cat.id, roundCurrency(Number(event.target.value)))
            }
            className="h-10 pr-6 text-right"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-muted">
            €
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          aria-label={`Quitar ${cat.name} del presupuesto`}
          onClick={() => onCategoryAmountChange(cat.id, 0)}
        >
          Quitar
        </Button>
        <div className="flex shrink-0 gap-1">
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
  }

  return (
    <Card className="rounded-[14px]">
      <CardContent className="flex flex-col gap-4 p-5">
        {selectedType ? (
          <>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  dot.bg,
                  dot.color
                )}
              >
                <span className="size-2.5 rounded-full bg-current" />
              </span>
              <h2 className="flex-1 font-serif text-lg font-semibold text-text-primary">
                {typeLabels[selectedType] ?? selectedType} · {currentCategories.length} categorías
              </h2>
              <span className="shrink-0 text-sm font-semibold text-text-primary">
                {formatCurrency(typeAmount)} repartidos
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                aria-label="Buscar categoría"
                placeholder="Buscar categoría…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 flex-1 min-w-[200px]"
              />
              {filters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={cn(
                    "rounded-lg border px-4 py-2.5 text-sm transition-colors",
                    filter === item.key
                      ? "border-primary bg-primary-light text-primary"
                      : "border-border bg-white text-text-muted hover:text-text-primary"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {saveError && (
              <p className="rounded-lg bg-expense/5 p-3 text-sm text-expense">{saveError}</p>
            )}

            {currentCategories.length === 0 ? (
              <p className="py-4 text-center text-sm text-text-muted">
                Sin categorías en este tipo de gasto
              </p>
            ) : (
              <>
                <div
                  data-testid="budget-category-list"
                  className="scrollbar-thin max-h-[220px] space-y-2 overflow-y-auto pr-1"
                >
                  {filter !== "without" && shownWith.map(renderRow)}
                  {shownWithout.map(renderRow)}
                  {filter === "with" && visibleWith.length === 0 && (
                    <p className="py-3 text-center text-sm text-text-muted">
                      Ninguna categoría con importe
                    </p>
                  )}
                  {filter === "without" && visibleWithout.length === 0 && (
                    <p className="py-3 text-center text-sm text-text-muted">
                      Ninguna categoría sin importe
                    </p>
                  )}
                </div>

                {filter !== "without" && hiddenWith.length > 0 && (
                  <button
                    type="button"
                    className="self-start text-sm text-primary hover:underline"
                    onClick={() => setShowAllWith(true)}
                  >
                    Ver {hiddenWith.length} más con importe ({hiddenWith.map((c) => c.name).join(", ")}) ▾
                  </button>
                )}

                {filter === "all" && withoutAmount.length > 0 && (
                  <div className="flex items-center justify-between rounded-xl bg-bg-elevated px-4 py-3 text-sm">
                    <span>{withoutAmount.length} categorías sin importe</span>
                    <button
                      type="button"
                      className="text-text-muted hover:text-text-primary"
                      onClick={() => setShowWithout((current) => !current)}
                    >
                      {showWithout ? "Ocultar ▴" : "Mostrar ▾"}
                    </button>
                  </div>
                )}
              </>
            )}

            <div
              className={`rounded-lg px-3 py-2 text-center text-sm font-medium ${
                isBalanced ? "bg-income/5 text-income" : "bg-expense/5 text-expense"
              }`}
            >
              {remainingMessage}
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={onAddCategory}>
              <Plus className="size-4" /> Añadir categoría
            </Button>
          </>
        ) : (
          <p className="py-12 text-center text-sm text-text-muted">
            Selecciona un grupo de gasto
          </p>
        )}
      </CardContent>
    </Card>
  );
}
