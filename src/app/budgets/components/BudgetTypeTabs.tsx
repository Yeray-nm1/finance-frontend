import { Input } from "@/components/ui/input";
import { typeLabels } from "@/lib/budget-constants";
import { typeIcons } from "@/components/ui/variants/budget.variants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BudgetTypeTabsProps } from "./types/BudgetTypeTabs.types";

export function BudgetTypeTabs({
  typeAllocations,
  selectedType,
  totalIncome,
  onSelectType,
  onPercentageChange,
}: Readonly<BudgetTypeTabsProps>) {
  return (
    <div className="scrollbar-thin flex gap-3 overflow-x-auto pb-1">
      {typeAllocations.map((allocation) => {
        const icon = typeIcons[allocation.type] ?? typeIcons.other;
        const isSelected = selectedType === allocation.type;
        const label = typeLabels[allocation.type] ?? allocation.type;
        const amount = totalIncome * (allocation.percentage / 100);

        return (
          <div
            key={allocation.type}
            className={cn(
              "shrink-0 rounded-xl border px-3.5 py-3 transition-colors",
              isSelected ? "border-primary bg-primary-light" : "border-border bg-white"
            )}
          >
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectType(allocation.type)}
              className="flex items-center gap-2 text-left"
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  icon.bg,
                  icon.color
                )}
              >
                <span className="size-2.5 rounded-full bg-current" />
              </span>
              <span className="text-sm font-semibold text-text-primary">{label}</span>
            </button>
            <div className="mt-1 flex items-center gap-1 text-xs text-text-muted">
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                aria-label={`Porcentaje de ${label}`}
                value={allocation.percentage}
                onChange={(event) =>
                  onPercentageChange(allocation.type, Number(event.target.value))
                }
                className="h-6 w-12 rounded-md px-1 text-right text-xs"
              />
              <span>% · {formatCurrency(amount)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
