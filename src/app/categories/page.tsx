"use client";

import { useState, useEffect } from "react";
import type { Category } from "@/types/categories";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { typeLabels, typeIcons, typeBg } from "@/lib/budget-constants";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("needs");
  const [saving, setSaving] = useState(false);

  function loadCategories() {
    setLoading(true);
    setError(null);
    api.categories.list()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCategories(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await api.categories.create({ name: newName.trim(), type: newType });
      setNewName("");
      setNewType("needs");
      setDialogOpen(false);
      setCategories(prev => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear categoría");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.categories.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar categoría");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-text-muted">Cargando...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-expense">{error}</p>
          <button onClick={loadCategories} className="text-primary text-sm hover:underline mt-2">
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  const grouped = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              Categorias
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Organiza tus gastos por categorias
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Anadir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Categoria</DialogTitle>
                <DialogDescription>
                  Crea una nueva categoria de gasto
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Comida"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select defaultValue="needs" value={newType} onValueChange={setNewType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="needs">Necesidades</SelectItem>
                      <SelectItem value="leisure">Ocio</SelectItem>
                      <SelectItem value="savings">Ahorro</SelectItem>
                      <SelectItem value="other">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Creando..." : "Crear"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {Object.entries(grouped).map(([type, cats]) => (
          <div key={type} className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-3">
              {typeLabels[type]}
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {cats.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg ${typeIcons[category.type]?.bg ?? typeBg[category.type]} flex items-center justify-center`}>
                          {typeIcons[category.type]?.icon}
                        </div>
                        <span className="font-medium text-sm text-text-primary">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="size-3.5 text-expense" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
