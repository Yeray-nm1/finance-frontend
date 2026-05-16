"use client";

import { useState } from "react";
import type { Category } from "@/types";
import { MOCK_CATEGORIES, MOCK_MONTHLY_BUDGET } from "@/lib/mock-data";
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

export default function BudgetsPage() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [totalIncome, setTotalIncome] = useState(0);
  const [typeAllocations, setTypeAllocations] = useState(MOCK_MONTHLY_BUDGET.allocations);
  const [selectedType, setSelectedType] = useState<string>("needs");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  const totalAllocated = typeAllocations.reduce((s, a) => s + a.percentage, 0);
  const isValidTotal = Math.abs(totalAllocated - 100) < 0.15;

  function openEditCategory(cat: Category) {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditDialogOpen(true);
  }

  function handleSaveCategory() {
    if (!editingCategory || !editName.trim()) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === editingCategory.id ? { ...c, name: editName.trim() } : c
      )
    );
    setEditDialogOpen(false);
    setEditingCategory(null);
    setEditName("");
  }

  function handleDeleteCategory(cat: Category) {
    setDeletingCategory(cat);
    setDeleteDialogOpen(true);
  }

  function confirmDeleteCategory() {
    if (!deletingCategory) return;
    setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
    setDeleteDialogOpen(false);
    setDeletingCategory(null);
  }

  function handleAddCategory() {
    if (!selectedType) return;
    const newId = `cat-${Date.now()}`;
    const newCat: Category = {
      id: newId,
      userId: "user-1",
      name: "Nueva categoría",
      type: selectedType as Category["type"],
    };
    setCategories((prev) => [...prev, newCat]);
  }

  function handlePercentageChange(type: string, newPercentage: number) {
    setSaveError(null);
    setTypeAllocations((prev) =>
      prev.map((a) =>
        a.type === type ? { ...a, percentage: Math.max(0, Math.min(100, newPercentage)) } : a
      )
    );
  }

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="font-serif text-3xl font-semibold text-gray-800">
            Presupuestos
          </h1>
          <p className="text-gray-500 mt-1">Controla tus gastos mensuales</p>
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
