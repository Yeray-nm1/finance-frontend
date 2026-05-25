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
import { BudgetReadOnlyView } from "@/components/budget/BudgetReadOnlyView";
import { LoadingState, ErrorState } from "@/components/budget/BudgetPageStates";
import { IncomeReviewDialog } from "@/components/budget/IncomeReviewDialog";
import { getBudgetBadge } from "@/lib/budget-constants";
import { useBudget } from "@/hooks/useBudget";
import { toast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_ALLOCATIONS = [
  { type: "needs", percentage: 50 },
  { type: "leisure", percentage: 20 },
  { type: "savings", percentage: 15 },
  { type: "other", percentage: 15 },
];

export default function BudgetsPage() {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const { budget, saving, setBudget, saveBudget } = useBudget(viewMonth, viewYear);
  const [prevMonthHasBudget, setPrevMonthHasBudget] = useState(false);

  const isPastMonth = viewYear < today.getFullYear() || (viewYear === today.getFullYear() && viewMonth < today.getMonth() + 1);

  const prevMonth = viewMonth === 1 ? 12 : viewMonth - 1;
  const prevYear = viewMonth === 1 ? viewYear - 1 : viewYear;
  const isPrevPast = prevYear < today.getFullYear() || (prevYear === today.getFullYear() && prevMonth < today.getMonth() + 1);
  const canGoBack = !isPrevPast || prevMonthHasBudget;

  const maxMonth = today.getMonth() + 1;
  const maxYear = today.getFullYear() + 1;
  const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
  const nextYear = viewMonth === 12 ? viewYear + 1 : viewYear;
  const isNextValid = nextYear < maxYear || (nextYear === maxYear && nextMonth <= maxMonth);
  const canGoForward = isNextValid;

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
  const [editingBudget, setEditingBudget] = useState(false);

  const isInitialLoad = useRef(true);
  const editSnapshotRef = useRef<{
    totalIncome: number;
    typeAllocations: typeof DEFAULT_ALLOCATIONS;
    categories: string;
  } | null>(null);
  const categoriesSnapshotRef = useRef("");

  function loadData() {
    setLoading(true);
    setError(null);
    Promise.all([
      api.categories.list(),
      api.budgets.list(),
      api.budgets.monthly.get(viewMonth, viewYear),
    ])
      .then(([cats, budgets, monthly]) => {
        setCategories(cats);

        if (isInitialLoad.current) {
          isInitialLoad.current = false;
          categoriesSnapshotRef.current = JSON.stringify(cats);
        }

        if (monthly) {
          setBudget(monthly);
          setTotalIncome(monthly.totalIncome);
          setTypeAllocations(monthly.typeAllocations);
        } else {
          setBudget(null);
          setTotalIncome(0);
          setTypeAllocations(DEFAULT_ALLOCATIONS);
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
      .finally(() => {
        setLoading(false);
        const prevM = viewMonth === 1 ? 12 : viewMonth - 1;
        const prevY = viewMonth === 1 ? viewYear - 1 : viewYear;
        api.budgets.monthly.get(prevM, prevY).then((m) => setPrevMonthHasBudget(m !== null));
      });
  }

  useEffect(() => { loadData(); }, [viewMonth, viewYear]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function goToPrevMonth() {
    if (!canGoBack) return;
    setEditingBudget(false);
    editSnapshotRef.current = null;
    setViewMonth(prevMonth);
    setViewYear(prevYear);
  }

  function goToNextMonth() {
    if (!canGoForward) return;
    setEditingBudget(false);
    editSnapshotRef.current = null;
    setViewMonth(nextMonth);
    setViewYear(nextYear);
  }

  const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const monthLabel = `${MONTH_NAMES[viewMonth - 1]} ${viewYear}`;

  const showEditButton = !editingBudget && !isPastMonth;
  const editButtonLabel = budget ? "Editar" : "Crear presupuesto";
  const badge = getBudgetBadge(editingBudget, budget);

  function handleStartEdit() {
    editSnapshotRef.current = {
      totalIncome,
      typeAllocations,
      categories: JSON.stringify(categories),
    };
    setEditingBudget(true);
  }

  function handleCancelEdit() {
    const snapshot = editSnapshotRef.current;
    if (snapshot) {
      setTotalIncome(snapshot.totalIncome);
      setTypeAllocations(snapshot.typeAllocations);
      setCategories(JSON.parse(snapshot.categories));
    }
    editSnapshotRef.current = null;
    setEditingBudget(false);
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
      setEditingBudget(false);
      editSnapshotRef.current = null;
      toast({ title: "Presupuesto guardado", description: "Los cambios se han guardado correctamente." });
    } else {
      toast({
        title: "Error",
        description: "No se pudo guardar el presupuesto",
        variant: "destructive",
      });
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={loadData} />;

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-3xl font-semibold text-text-primary">
              Presupuestos
            </h1>
            {showEditButton && (
              <Button onClick={handleStartEdit}>
                {editButtonLabel}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={goToPrevMonth}
              disabled={!canGoBack}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-5 text-text-muted" />
            </button>
            <span className="text-base font-medium text-text-primary">
              {monthLabel}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
              {badge.text}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={!canGoForward}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="size-5 text-text-muted" />
            </button>
          </div>
        </header>

        {isPastMonth || !editingBudget ? (
          <BudgetReadOnlyView
            totalIncome={totalIncome}
            typeAllocations={typeAllocations}
            categories={categories}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 self-start">
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
                onCancel={handleCancelEdit}
                saving={saving}
                canSave={canSave}
                readOnly={false}
              />
            </div>

            <div className="lg:col-span-2 relative">
              <div className="absolute inset-0">
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
                  readOnly={false}
                />
              </div>
            </div>
          </div>
        )}
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
