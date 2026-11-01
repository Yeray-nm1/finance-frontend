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
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { getBudgetBadge, DEFAULT_ALLOCATIONS, MONTH_NAMES } from "@/lib/budget-constants";
import { useBudget } from "@/hooks/useBudget";
import { toast } from "@/hooks/use-toast";

export default function BudgetsPage() {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const { budget, saving, setBudget, saveBudget } = useBudget(viewMonth, viewYear);

  const isPastMonth = viewYear < today.getFullYear() || (viewYear === today.getFullYear() && viewMonth < today.getMonth() + 1);

  const selectedMonthValue = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
  const [budgetMonths, setBudgetMonths] = useState<Array<{ year: number; month: number }>>([]);

  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const isViewingPast =
    viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth);
  const isViewingFuture =
    viewYear > currentYear || (viewYear === currentYear && viewMonth > currentMonth);

  const previousBudgetMonth = useMemo(() => {
    const beforeView = (m: { year: number; month: number }) =>
      m.year < viewYear || (m.year === viewYear && m.month < viewMonth);

    if (isViewingFuture) {
      // Desde un mes futuro, volvemos al presupuesto más cercano sin bajar del mes actual.
      const candidates = budgetMonths
        .filter(
          (m) =>
            beforeView(m) &&
            (m.year > currentYear || (m.year === currentYear && m.month >= currentMonth))
        )
        .sort((a, b) => a.year - b.year || a.month - b.month);
      return candidates.length > 0
        ? candidates[candidates.length - 1]
        : { year: currentYear, month: currentMonth };
    }

    const previous = budgetMonths
      .filter(beforeView)
      .sort((a, b) => a.year - b.year || a.month - b.month);
    return previous.length > 0 ? previous[previous.length - 1] : null;
  }, [budgetMonths, viewYear, viewMonth, isViewingFuture, currentYear, currentMonth]);

  const canGoBack = previousBudgetMonth !== null;

  const monthOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string; hasBudget: boolean; isCurrent: boolean }> = [];
    const hasBudget = (year: number, month: number) =>
      budgetMonths.some((m) => m.year === year && m.month === month);
    const add = (year: number, month: number) => {
      const value = `${year}-${String(month).padStart(2, "0")}`;
      if (seen.has(value)) return;
      seen.add(value);
      options.push({
        value,
        label: `${MONTH_NAMES[month - 1]} ${year}`,
        hasBudget: hasBudget(year, month),
        isCurrent: year === currentYear && month === currentMonth,
      });
    };

    for (const m of budgetMonths) add(m.year, m.month);
    add(viewYear, viewMonth);
    add(today.getFullYear(), today.getMonth() + 1);

    return options.sort((a, b) => a.value.localeCompare(b.value));
  }, [budgetMonths, viewYear, viewMonth, currentYear, currentMonth, today]);

  const maxMonth = currentMonth;
  const maxYear = currentYear + 1;
  const nextMonth = viewMonth === 12 ? 1 : viewMonth + 1;
  const nextYear = viewMonth === 12 ? viewYear + 1 : viewYear;

  // Desde un mes pasado, la flecha siguiente salta al siguiente mes con
  // presupuesto y, si no hay ninguno, vuelve al mes actual en vez de ir mes a mes.
  const nextBudgetMonth = useMemo(() => {
    if (!isViewingPast) return null;

    const afterView = budgetMonths
      .filter(
        (m) =>
          (m.year > viewYear || (m.year === viewYear && m.month > viewMonth)) &&
          (m.year < currentYear || (m.year === currentYear && m.month <= currentMonth))
      )
      .sort((a, b) => a.year - b.year || a.month - b.month);

    return afterView.length > 0
      ? afterView[0]
      : { year: currentYear, month: currentMonth };
  }, [budgetMonths, isViewingPast, viewYear, viewMonth, currentYear, currentMonth]);

  const isNextValid = nextYear < maxYear || (nextYear === maxYear && nextMonth <= maxMonth);
  const canGoForward = nextBudgetMonth !== null || isNextValid;

  const nextMonthLabel = nextBudgetMonth
    ? `${MONTH_NAMES[nextBudgetMonth.month - 1]} ${nextBudgetMonth.year}`
    : `${MONTH_NAMES[nextMonth - 1]} ${nextYear}`;

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
      const [cats, budgets, monthly, months] = await Promise.all([
        api.categories.list(),
        api.budgets.list(),
        api.budgets.monthly.get(viewMonth, viewYear),
        api.budgets.months(),
      ]);
      setCategories(cats);
      setBudgetMonths(months);

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
      console.error(e);
      setError("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }, [viewMonth, viewYear, setBudget]);

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
    setDeleteDialogOpen(false);
    setDeletingCategory(null);
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
    if (!previousBudgetMonth) return;
    setEditingBudget(false);
    editSnapshotRef.current = null;
    setViewMonth(previousBudgetMonth.month);
    setViewYear(previousBudgetMonth.year);
  }

  function goToMonth(value: string) {
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) return;
    setEditingBudget(false);
    editSnapshotRef.current = null;
    setViewMonth(month);
    setViewYear(year);
  }

  function goToNextMonth() {
    if (!canGoForward) return;
    setEditingBudget(false);
    editSnapshotRef.current = null;
    if (nextBudgetMonth) {
      setViewMonth(nextBudgetMonth.month);
      setViewYear(nextBudgetMonth.year);
      return;
    }
    setViewMonth(nextMonth);
    setViewYear(nextYear);
  }

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
          monthOptions={monthOptions}
          selectedMonthValue={selectedMonthValue}
          badge={badge}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          nextMonthLabel={nextMonthLabel}
          showEditButton={showEditButton}
          editButtonLabel={editButtonLabel}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onMonthChange={goToMonth}
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

        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          title="Eliminar categoría"
          description={<>¿Estás seguro de que quieres eliminar la categoría <strong>{deletingCategory?.name ?? ""}</strong>? Esta acción no se puede deshacer.</>}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setDeleteDialogOpen(false); setDeletingCategory(null); }}
        />
      </div>
    </main>
  );
}
