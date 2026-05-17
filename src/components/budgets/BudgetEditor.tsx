"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CATEGORY_CONFIGS,
  type CategoryType,
  type MonthlyBudget,
  type Category,
} from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { CategoryTypeEditCard } from "@/components/budgets/CategoryTypeEditCard";

interface BudgetEditorProps {
  budget: MonthlyBudget | null;
  saving: boolean;
  categoriesByType: Record<string, Category[]>;
  onSave: (
    income: number,
    typeAllocations: Array<{ type: string; percentage: number }>
  ) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onCalculateIncome: () => Promise<number | null>;
  onCancel: () => void;
  onAddCategory: (type: CategoryType, name: string) => Promise<boolean>;
  onEditCategory: (id: string, name: string) => Promise<void>;
  onDeleteCategory: (id: string) => void;
}

export function BudgetEditor({
  budget,
  saving,
  categoriesByType,
  onSave,
  onDelete,
  onCancel,
  onCalculateIncome,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: BudgetEditorProps) {
  const [totalIncome, setTotalIncome] = useState<string>("");
  const [allocations, setAllocations] = useState<Record<string, string>>({
    needs: "",
    leisure: "",
    savings: "",
    other: "",
  });
  const [newCategoryForType, setNewCategoryForType] = useState<{
    type: CategoryType;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (budget) {
      setTotalIncome(budget.totalIncome.toString());
      const allocs: Record<string, string> = {
        needs: "",
        leisure: "",
        savings: "",
        other: "",
      };
      budget.typeAllocations.forEach((alloc) => {
        allocs[alloc.type] = alloc.percentage.toString();
      });
      setAllocations(allocs);
    } else {
      setTotalIncome("");
      setAllocations({ needs: "", leisure: "", savings: "", other: "" });
    }
  }, [budget]);

  const totalPercentage = useMemo(
    () =>
      Object.values(allocations).reduce(
        (sum, val) => sum + (parseFloat(val) || 0),
        0
      ),
    [allocations]
  );

  const isValid = Math.abs(totalPercentage - 100) < 0.01;

  function distributeEqually() {
    const equalPercentage = (100 / CATEGORY_CONFIGS.length).toFixed(2);
    const newAllocs: Record<string, string> = {};
    CATEGORY_CONFIGS.forEach(({ type }) => {
      newAllocs[type] = equalPercentage;
    });
    setAllocations(newAllocs);
  }

  function updateAllocation(categoryType: string, value: string) {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAllocations((prev) => ({ ...prev, [categoryType]: value }));
    }
  }

  async function handleAddCategory(type: CategoryType) {
    if (!newCategoryForType?.name.trim()) return;
    const success = await onAddCategory(type, newCategoryForType.name);
    if (success) {
      setNewCategoryForType(null);
    }
  }

  async function handleSave() {
    if (!isValid) return;

    const income = parseFloat(totalIncome);
    if (isNaN(income) || income <= 0) return;

    const typeAllocations = Object.entries(allocations)
      .filter(([, val]) => val !== "" && parseFloat(val) > 0)
      .map(([type, percentage]) => ({
        type,
        percentage: parseFloat(percentage),
      }));

    if (typeAllocations.length === 0) return;

    const saved = await onSave(income, typeAllocations);
    if (saved) {
      setTotalIncome("");
      setAllocations({ needs: "", leisure: "", savings: "", other: "" });
      setNewCategoryForType(null);
    }
  }

  async function handleCalculateIncome() {
    const income = await onCalculateIncome();
    if (income !== null) {
      setTotalIncome(income.toString());
    }
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
      <div className="p-8 md:p-10 space-y-8">
        {/* Income Section */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <Label className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">
                Ingreso Total Mensual
              </Label>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-display font-light text-gray-900">
                  {totalIncome
                    ? parseFloat(totalIncome).toFixed(2)
                    : "0.00"}
                  €
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={totalIncome}
                onChange={(e) => setTotalIncome(e.target.value)}
                placeholder="0.00"
                className="w-36 text-right font-display text-xl"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCalculateIncome}
                className="rounded-full"
              >
                Auto
              </Button>
            </div>
          </div>
        </div>

        {/* Type Allocation Grid */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Label className="text-xs uppercase tracking-[0.2em] text-gray-400 font-medium">
              Distribución por Tipo
            </Label>
            <Button
              variant="link"
              size="sm"
              onClick={distributeEqually}
              className="text-xs text-emerald-600"
            >
              Distribución equitativa
            </Button>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Progreso total</span>
              <span
                className={`font-medium ${Math.abs(totalPercentage - 100) < 0.01 ? "text-emerald-600" : "text-red-600"}`}
              >
                {totalPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                  totalPercentage > 100
                    ? "bg-red-500"
                    : totalPercentage === 100
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                }`}
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              />
            </div>
            {totalPercentage > 0 && totalPercentage !== 100 && (
              <p className="text-sm text-red-500">
                Faltan {(100 - totalPercentage).toFixed(1)}% para completar
                100%
              </p>
            )}
          </div>

          {/* Type Columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            {CATEGORY_CONFIGS.map((config) => (
              <CategoryTypeEditCard
                key={config.type}
                config={config}
                allocation={allocations[config.type]}
                categories={categoriesByType[config.type] || []}
                onAllocationChange={updateAllocation}
                onAddCategory={handleAddCategory}
                onDeleteCategory={onDeleteCategory}
                onEditCategory={onEditCategory}
                newCategoryName={
                  newCategoryForType?.type === config.type
                    ? newCategoryForType.name
                    : ""
                }
                onNewCategoryNameChange={(type, name) =>
                  setNewCategoryForType({ type, name })
                }
                onCancelAddCategory={(type) =>
                  type === newCategoryForType?.type &&
                  setNewCategoryForType(null)
                }
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-100">
          <Button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="flex-1 rounded-full bg-gray-900 hover:bg-gray-800 text-white"
          >
            {saving
              ? "Guardando..."
              : budget
                ? "Actualizar Presupuesto"
                : "Crear Presupuesto"}
          </Button>
          {budget && (
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={saving}
              className="rounded-full"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          {budget && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="rounded-full"
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
