"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Category } from "@/types/categories";
import type { IncomeGroup } from "@/types/budgets";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BudgetDetails } from "@/components/budget/BudgetDetails";
import { BudgetCategoryDetails } from "@/components/budget/BudgetCategoryDetails";
import { IncomeReviewDialog } from "@/components/budget/IncomeReviewDialog";
import { useBudget } from "@/hooks/useBudget";
import { toast } from "@/hooks/use-toast";

const DEFAULT_ALLOCATIONS = [
  { type: "needs", percentage: 50 },
  { type: "leisure", percentage: 20 },
  { type: "savings", percentage: 15 },
  { type: "other", percentage: 15 },
];

export default function BudgetsPage() {
  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const { budget, saving, setBudget, saveBudget } = useBudget(currentMonth, currentYear);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalIncome, setTotalIncome] = useState(0);
  const [typeAllocations, setTypeAllocations] = useState(DEFAULT_ALLOCATIONS);
  const [selectedType, setSelectedType] = useState<string>("needs");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [incomeGroups, setIncomeGroups] = useState<IncomeGroup[]>([]);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [calculatingIncome, setCalculatingIncome] = useState(false);

  const isInitialLoad = useRef(true);
  const categoriesSnapshotRef = useRef("");

  function loadData() {
    setLoading(true);
    setError(null);
    Promise.all([
      api.categories.list(),
      api.budgets.list(),
      api.budgets.monthly.get(currentMonth, currentYear),
    ])
      .then(([cats, budgets, monthly]) => {
        setCategories(cats);

        if (isInitialLoad.current) {
          isInitialLoad.current = false;
          categoriesSnapshotRef.current = JSON.stringify(cats);
          if (monthly) {
            setBudget(monthly);
            setTotalIncome(monthly.totalIncome);
            setTypeAllocations(monthly.typeAllocations);
          }
        }

        if (budgets.length > 0) {
          const typePct: Record<string, number> = {};
          for (const b of budgets) {
            const t = b.category.type;
            typePct[t] = (typePct[t] ?? 0) + b.percentage;
          }
          setTypeAllocations(
            DEFAULT_ALLOCATIONS.map((a) => ({
              type: a.type,
              percentage: typePct[a.type] ?? a.percentage,
            }))
          );
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalAllocated = typeAllocations.reduce((s, a) => s + a.percentage, 0);
  const isValidTotal = Math.abs(totalAllocated - 100) < 0.15;

  const categoriesChanged = JSON.stringify(categories) !== categoriesSnapshotRef.current;
  const hasChanges = budget !== null && (
    totalIncome !== budget.totalIncome ||
    JSON.stringify(typeAllocations) !== JSON.stringify(budget.typeAllocations) ||
    categoriesChanged
  );
  const canSave = totalIncome > 0 && isValidTotal && (budget === null || hasChanges);

  function openEditCategory(cat: Category) {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditDialogOpen(true);
  }

  async function handleSaveCategory() {
    if (!editingCategory || !editName.trim()) return;
    try {
      const updated = await api.categories.update(editingCategory.id, { name: editName.trim() });
      setEditDialogOpen(false);
      setEditingCategory(null);
      setEditName("");
      setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  function handleDeleteCategory(cat: Category) {
    setDeletingCategory(cat);
    setDeleteDialogOpen(true);
  }

  async function confirmDeleteCategory() {
    if (!deletingCategory) return;
    try {
      await api.categories.delete(deletingCategory.id);
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
      setCategories(prev => prev.filter(c => c.id !== deletingCategory.id));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  async function handleAddCategory() {
    if (!selectedType) return;
    try {
      const created = await api.categories.create({
        name: "Nueva categoría",
        type: selectedType,
      });
      setCategories(prev => [...prev, created]);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al crear categoría");
    }
  }

  function handlePercentageChange(type: string, newPercentage: number) {
    setSaveError(null);
    setTypeAllocations((prev) =>
      prev.map((a) =>
        a.type === type ? { ...a, percentage: Math.max(0, Math.min(100, newPercentage)) } : a
      )
    );
  }

  async function handleCalculateIncome() {
    setCalculatingIncome(true);
    try {
      const now = new Date();
      const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const result = await api.budgets.calculateIncome(prevMonth, prevYear);
      setIncomeGroups(result);
      setIncomeDialogOpen(true);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al calcular ingresos",
        variant: "destructive",
      });
    } finally {
      setCalculatingIncome(false);
    }
  }

  function handleIncomeConfirm(selectedTotal: number) {
    setTotalIncome(selectedTotal);
    setIncomeDialogOpen(false);
  }

  async function handleSave() {
    const saved = await saveBudget(totalIncome, typeAllocations);
    if (saved) {
      categoriesSnapshotRef.current = JSON.stringify(categories);
      toast({ title: "Presupuesto guardado", description: "Los cambios se han guardado correctamente." });
    } else {
      toast({
        title: "Error",
        description: "No se pudo guardar el presupuesto",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-text-muted">Cargando...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm text-expense">{error}</p>
          <button onClick={loadData} className="text-primary text-sm hover:underline mt-2">
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="font-serif text-3xl font-semibold text-text-primary">
            Presupuestos
          </h1>
          <p className="text-text-muted mt-1">Controla tus gastos mensuales</p>
        </header>

        <div className="flex flex-col lg:flex-row" style={{ gap: "1.5rem" }}>
          <div className="w-full lg:w-1/3">
            <BudgetDetails
              totalIncome={totalIncome}
              onTotalIncomeChange={setTotalIncome}
              typeAllocations={typeAllocations}
              selectedType={selectedType}
              onSelectType={setSelectedType}
              totalAllocated={totalAllocated}
              isValidTotal={isValidTotal}
              onCalculateIncome={handleCalculateIncome}
              calculatingIncome={calculatingIncome}
              onSave={handleSave}
              saving={saving}
              canSave={canSave}
            />
          </div>

          <div className="w-full lg:w-2/3">
            <BudgetCategoryDetails
              categories={categories}
              selectedType={selectedType}
              typeAllocations={typeAllocations}
              onPercentageChange={handlePercentageChange}
              totalIncome={totalIncome}
              saveError={saveError}
              onOpenEditCategory={openEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddCategory={handleAddCategory}
            />
          </div>
        </div>
      </div>

      <IncomeReviewDialog
        open={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
        groups={incomeGroups}
        onConfirm={handleIncomeConfirm}
      />

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
            <DialogDescription>Cambia el nombre de la categoría</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nombre</Label>
              <Input
                id="cat-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveCategory()}
              />
            </div>
            <Button className="w-full" onClick={handleSaveCategory}>
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la categoría <strong>{deletingCategory?.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-expense text-white hover:bg-red-700"
              onClick={confirmDeleteCategory}
            >
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
