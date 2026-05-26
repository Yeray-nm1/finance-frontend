"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { Category } from "@/types/categories";
import type { IncomeGroup } from "@/types/budgets";
import { api } from "@/lib/api";
import { BudgetDetails } from "@/app/budgets/components/BudgetDetails";
import { BudgetCategoryDetails } from "@/app/budgets/components/BudgetCategoryDetails";
import { BudgetReadOnlyView } from "@/app/budgets/components/BudgetReadOnlyView";
import { IncomeReviewDialog } from "@/app/budgets/components/IncomeReviewDialog";
import { BudgetHeader } from "@/app/budgets/components/BudgetHeader";
import { EditCategoryDialog } from "@/app/budgets/components/EditCategoryDialog";
import { DeleteCategoryDialog } from "@/app/budgets/components/DeleteCategoryDialog";
import { getBudgetBadge, DEFAULT_ALLOCATIONS, MONTH_NAMES } from "@/lib/budget-constants";
import { useBudget } from "@/hooks/useBudget";
import { toast } from "@/hooks/use-toast";

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, budgets, monthly] = await Promise.all([
        api.categories.list(),
        api.budgets.list(),
        api.budgets.monthly.get(viewMonth, viewYear),
      ]);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [viewMonth, viewYear, setBudget]);

  useEffect(() => {
    const prevM = viewMonth === 1 ? 12 : viewMonth - 1;
    const prevY = viewMonth === 1 ? viewYear - 1 : viewYear;
    api.budgets.monthly.get(prevM, prevY).then((m) => setPrevMonthHasBudget(m !== null));
  }, [viewMonth, viewYear]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalAllocated = typeAllocations.reduce((s, a) => s + a.percentage, 0);
  const isValidTotal = Math.abs(totalAllocated - 100) < 0.15;

  const categoriesChanged = JSON.stringify(categories) !== categoriesSnapshotRef.current;
  const hasChanges = budget !== null && (
    totalIncome !== budget.totalIncome ||
    JSON.stringify(typeAllocations) !== JSON.stringify(budget.typeAllocations) ||
    categoriesChanged
  );
  const canSave = totalIncome > 0 && isValidTotal && (budget === null || hasChanges);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <p className="text-sm text-text-muted">Cargando...</p>
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

  function openEditCategory(cat: Category) {
    setEditingCategory(cat);
    setEditDialogOpen(true);
  }

  async function handleEditSave(name: string) {
    const updated = await api.categories.update(editingCategory!.id, { name });
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  function handleDeleteCategory(cat: Category) {
    setDeletingCategory(cat);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    await api.categories.delete(deletingCategory!.id);
    setCategories(prev => prev.filter(c => c.id !== deletingCategory!.id));
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

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <BudgetHeader
          monthLabel={monthLabel}
          badge={badge}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          showEditButton={showEditButton}
          editButtonLabel={editButtonLabel}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onStartEdit={handleStartEdit}
        />

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
                />
              </div>
            </div>
          </div>
        )}

        <IncomeReviewDialog
          open={incomeDialogOpen}
          onOpenChange={setIncomeDialogOpen}
          groups={incomeGroups}
          onConfirm={handleIncomeConfirm}
        />

        <EditCategoryDialog
          open={editDialogOpen}
          category={editingCategory}
          onSave={handleEditSave}
          onClose={() => { setEditDialogOpen(false); setEditingCategory(null); }}
        />

        <DeleteCategoryDialog
          open={deleteDialogOpen}
          categoryName={deletingCategory?.name ?? ""}
          onConfirm={handleDeleteConfirm}
          onClose={() => { setDeleteDialogOpen(false); setDeletingCategory(null); }}
        />
      </div>
    </main>
  );
}
