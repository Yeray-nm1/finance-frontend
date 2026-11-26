import type { BudgetDetailsProps } from "./types/BudgetDetails.types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import { getValidationBg } from "@/components/ui/variants/budget.variants";

export function BudgetDetails({
  totalIncome,
  onTotalIncomeChange,
  totalAllocated,
  isValidTotal,
  onCalculateIncome,
  calculatingIncome,
}: Readonly<BudgetDetailsProps>) {
  const allocatedLabel = Number(totalAllocated.toFixed(1));

  return (
    <Card className="rounded-[14px]">
      <CardContent className="flex flex-wrap items-center gap-4 p-4 md:px-5">
        <Label htmlFor="total-income" className="text-sm font-semibold">
          Presupuesto total
        </Label>
        <div className="relative w-40 shrink-0">
          <Input
            id="total-income"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={totalIncome || ""}
            onChange={(event) => onTotalIncomeChange(Number(event.target.value))}
            className="h-11 pr-8 text-right"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">
            €
          </span>
        </div>
        <Button
          className="gap-2 bg-white text-primary hover:bg-primary-light"
          variant="outline"
          onClick={onCalculateIncome}
          disabled={!onCalculateIncome || calculatingIncome}
        >
          <Calculator size={14} />
          {calculatingIncome
            ? "Calculando..."
            : "Calcular desde ingresos del mes anterior"}
        </Button>
        <span
          className={`ml-auto text-sm font-medium ${getValidationBg(isValidTotal)} rounded-full px-3 py-1.5`}
        >
          {isValidTotal
            ? "✓ 100 % repartido"
            : `Los porcentajes suman ${allocatedLabel}% — deben sumar 100%`}
        </span>
      </CardContent>
    </Card>
  );
}
