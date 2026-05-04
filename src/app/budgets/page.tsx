"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { BudgetWithCategory, Category } from "@/types";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, Pencil, Trash2 } from "lucide-react";


export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetWithCategory | null>(null);
  const [form, setForm] = useState({ categoryId: "", percentage: [30] });
  const { isAuthenticated } = useAuth();

  async function loadData() {
    try {
      const [buds, cats] = await Promise.all([
        api.budgets.list(),
        api.categories.list(),
      ]);
      setBudgets(buds);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await api.budgets.update(editing.id, {
          percentage: form.percentage[0],
        });
      } else {
        await api.budgets.create({
          categoryId: form.categoryId,
          percentage: form.percentage[0],
        });
      }
      setForm({ categoryId: "", percentage: [30] });
      setEditing(null);
      setDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("¿Eliminar este presupuesto?")) {
      await api.budgets.delete(id);
      loadData();
    }
  }

  function openEdit(budget: BudgetWithCategory) {
    setEditing(budget);
    setForm({ categoryId: budget.categoryId, percentage: [budget.percentage] });
    setDialogOpen(true);
  }

  const availableCategories = categories.filter(
    (cat) => !budgets.some((b) => b.categoryId === cat.id)
  );

  if (loading) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <p className="font-serif text-xl text-gray-400">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-gray-800">
            Presupuestos
          </h1>
          <p className="text-gray-500 mt-1">Controla tus gastos por categoría</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditing(null);
                setForm({ categoryId: "", percentage: [30] });
              }}
            >
              <Plus className="size-4" /> Añadir
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar Presupuesto" : "Nuevo Presupuesto"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Actualiza el porcentaje del presupuesto"
                  : "Asigna un porcentaje de ingresos a una categoría"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!editing && (
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => setForm({ ...form, categoryId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-4">
                <Label>Porcentaje: {form.percentage[0]}%</Label>
                <Slider
                  value={form.percentage}
                  onValueChange={(v) => setForm({ ...form, percentage: v })}
                  max={100}
                  step={1}
                />
              </div>
              <Button type="submit" className="w-full">
                {editing ? "Actualizar" : "Crear"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {budgets.length === 0 && (
          <p className="text-gray-400 text-sm">No hay presupuestos configurados</p>
        )}
        {budgets.map((budget) => (
          <Card key={budget.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif text-lg font-medium">
                  {budget.category.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {budget.percentage}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(budget)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(budget.id)}
                  >
                    <Trash2 className="size-4 text-coral" />
                  </Button>
                </div>
              </div>
              <Progress value={budget.percentage} className="h-3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
