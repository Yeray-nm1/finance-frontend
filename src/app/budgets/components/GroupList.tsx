import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/budget-constants";
import type { GroupListProps } from "@/types/budgets";

export function GroupList({
  isEmpty,
  filteredGroups,
  monthName,
  prevYear,
  checked,
  expanded,
  onToggleGroup,
  onToggleExpand,
}: GroupListProps) {
  if (isEmpty) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No se encontraron ingresos en {monthName} de {prevYear}
      </p>
    );
  }

  if (filteredGroups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Ningún grupo coincide con la búsqueda
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {filteredGroups.map((group) => {
        const isChecked = checked.has(group.label);
        const isExpanded = expanded.has(group.label);

        return (
          <div key={group.label} className="border rounded-lg">
            <div className="flex items-center gap-3 p-3">
              <button
                type="button"
                onClick={() => onToggleExpand(group.label)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={isExpanded ? "Colapsar grupo" : "Expandir grupo"}
              >
                {isExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>

              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleGroup(group.label)}
                className="size-4 shrink-0 accent-primary"
                aria-label={`Incluir ${group.label}`}
              />

              <span className="flex-1 text-sm font-medium truncate">
                {group.label}
              </span>

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {group.count} {group.count === 1 ? "transacción" : "transacciones"}
              </span>

              <span className="text-sm font-semibold whitespace-nowrap w-24 text-right">
                {formatCurrency(group.totalAmount)}
              </span>
            </div>

            {isExpanded && (
              <div className="border-t px-3 py-2 space-y-1">
                {group.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 text-xs text-muted-foreground pl-9"
                  >
                    <span className="w-20 shrink-0">
                      {new Date(tx.date).toLocaleDateString("es-ES")}
                    </span>
                    <span className="flex-1 truncate">{tx.description}</span>
                    <span className="w-20 text-right">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
