import type { BudgetDetailsProps } from "./types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import { typeLabels, typeIcons, formatCurrency } from "@/lib/budget-constants";

export function BudgetDetails({
  totalIncome,
  onTotalIncomeChange,
  typeAllocations,
  selectedType,
  onSelectType,
  totalAllocated,
  isValidTotal,
}: Readonly<BudgetDetailsProps>) {
  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <h2 className="font-serif text-lg font-semibold text-gray-800">
          Definición del presupuesto total
        </h2>

        <div className="space-y-2">
          <Label htmlFor="total-income">Definir el presupuesto total</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
              €
            </span>
            <Input
              id="total-income"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={totalIncome || ""}
              onChange={(e) => onTotalIncomeChange(Number(e.target.value))}
              className="pl-7"
            />
          </div>
        </div>

        <Button className="w-full gap-2 bg-primary text-white hover:bg-primary-hover">
          <Calculator size={14} />
          Calcular ingresos del mes anterior
        </Button>

        <div className="border-t border-border" />

        <div className="flex flex-col gap-2">
          {typeAllocations.map((alloc) => {
            const typeIcon = typeIcons[alloc.type];
            const isSelected = selectedType === alloc.type;
            const amount = totalIncome * (alloc.percentage / 100);
            return (
              <button
                key={alloc.type}
                type="button"
                onClick={() => onSelectType(alloc.type)}
                className={`flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? "border-border-accent bg-primary-light"
                    : "border-border hover:border-border-accent"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${typeIcon.bg} ${typeIcon.color} flex items-center justify-center shrink-0`}>
                  {typeIcon.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium block ${isSelected ? "text-primary" : "text-text-primary"}`}>
                    {typeLabels[alloc.type] ?? alloc.type}
                  </span>
                  <span className="text-xs text-text-muted">
                    {alloc.percentage}% &middot; {formatCurrency(amount)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className={`p-3 rounded-lg text-sm text-center font-medium ${
          isValidTotal ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
        }`}>
          {isValidTotal
            ? "✓ Distribución correcta (100%)"
            : `Los porcentajes suman ${totalAllocated.toFixed(1)}% — deben sumar 100%`}
        </div>
      </CardContent>
    </Card>
  );
}
