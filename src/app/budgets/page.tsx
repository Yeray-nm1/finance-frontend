"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MONTH_NAMES, type CategoryType } from "@/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Pencil } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/budgets/DeleteConfirmDialog";
import { BudgetEditor } from "@/components/budgets/BudgetEditor";
import { BudgetOverview } from "@/components/budgets/BudgetOverview";
import { useBudget } from "@/hooks/useBudget";
import { useCategories } from "@/hooks/useCategories";

export default function BudgetsPage() {
  const { isAuthenticated } = useAuth();
  const now = new Date();
  const selectedMonth = now.getMonth() + 1;
  const selectedYear = now.getFullYear();

  const { budget, loading, saving, loadBudget, saveBudget, deleteBudget, calculateIncome } =
    useBudget(selectedMonth, selectedYear);
  const { loadCategories, addCategory, updateCategory, deleteCategory, getCategoriesByTypeRecord } =
    useCategories();

  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "category" | "budget";
    id?: string;
  } | null>(null);

  const categoriesByType = getCategoriesByTypeRecord();

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([loadBudget(), loadCategories()]).then(
        ([budgetResult]) => {
          if (budgetResult.exists && budgetResult.budget) {
            setEditing(false);
          } else {
            setEditing(true);
          }
        }
      );
    }
  }, [isAuthenticated, loadBudget, loadCategories]);

  async function handleSave(
    income: number,
    typeAllocations: Array<{ categoryType: string; percentage: number }>
  ): Promise<boolean> {
    const saved = await saveBudget(income, typeAllocations);
    if (saved) {
      setEditing(false);
      return true;
    }
    return false;
  }

  async function handleCalculateIncome(): Promise<number | null> {
    return calculateIncome();
  }

  async function handleDeleteCategory(id: string) {
    const success = await deleteCategory(id);
    if (success) {
      setDeleteConfirm(null);
    }
  }

  async function handleDeleteBudget(): Promise<boolean> {
    const success = await deleteBudget();
    if (success) {
      setDeleteConfirm(null);
      setEditing(true);
    }
    return success;
  }

  function handleEditModeCancel() {
    setEditing(false);
    loadBudget();
  }

  async function handleAddCategory(type: CategoryType, name: string): Promise<boolean> {
    const cat = await addCategory(type, name);
    return cat !== null;
  }

  async function handleEditCategory(id: string, name: string): Promise<void> {
    await updateCategory(id, { name });
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream-50">
        <Spinner size="lg">Cargando...</Spinner>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-emerald-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 pb-8 border-b border-gray-200">
          <h1 className="font-display text-5xl md:text-6xl font-light text-gray-900 mb-3 tracking-tight">
            Presupuestos
          </h1>
          <p className="font-serif text-lg text-gray-500 italic">
            Gestiona tus finanzas con intención
          </p>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div className="flex gap-4 items-center">
            <div className="text-sm text-gray-500">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </div>
            {budget && !editing && (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                className="rounded-full border-2 hover:bg-gray-50"
              >
                <Pencil className="size-4 mr-2" /> Editar configuración
              </Button>
            )}
          </div>
        </div>

        {/* Budget Editor / Overview */}
        {editing ? (
          <BudgetEditor
            budget={budget}
            saving={saving}
            categoriesByType={categoriesByType}
            onSave={handleSave}
            onDelete={handleDeleteBudget}
            onCalculateIncome={handleCalculateIncome}
            onCancel={handleEditModeCancel}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={(id) =>
              setDeleteConfirm({ type: "category", id })
            }
          />
        ) : budget ? (
          <BudgetOverview
            budget={budget}
            categoriesByType={categoriesByType}
          />
        ) : null}

        {/* Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteConfirm !== null}
          type={deleteConfirm?.type || "category"}
          onConfirm={
            deleteConfirm?.type === "category" && deleteConfirm.id
              ? () => handleDeleteCategory(deleteConfirm.id!)
              : handleDeleteBudget
          }
          onCancel={() => setDeleteConfirm(null)}
        />
      </div>
    </main>
  );
}
