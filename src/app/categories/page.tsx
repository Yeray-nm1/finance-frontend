"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ErrorState } from "@/components/ErrorState";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { CATEGORY_TYPES } from "@/lib/constants";
import { typeLabels } from "@/lib/budget-constants";
import { typeIcons } from "@/components/ui/variants/budget.variants";
import type { Category, CategoryType } from "@/types/categories";
import { CategoryDialog } from "./components/CategoryDialog";

type CategoryTab = CategoryType | "all";

function CategoriesSkeleton() {
  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 h-12 w-56 animate-pulse rounded-md bg-bg-elevated" />
        <div className="space-y-6">
          {[0, 1].map((group) => (
            <div key={group} className="space-y-2">
              <div className="h-5 w-32 animate-pulse rounded bg-bg-elevated" />
              <div className="h-16 animate-pulse rounded-lg border border-border bg-white" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeType, setActiveType] = useState<CategoryTab>("all");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await api.categories.list());
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const grouped = useMemo(() => {
    return CATEGORY_TYPES.map((type) => ({
      type,
      items: categories
        .filter((category) => category.type === type)
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    })).filter((group) => group.items.length > 0);
  }, [categories]);

  const visibleGroups =
    activeType === "all"
      ? grouped
      : grouped.filter((group) => group.type === activeType);

  const tabs: Array<{ key: CategoryTab; label: string; count: number }> = [
    { key: "all", label: "Todas", count: categories.length },
    ...grouped.map((group) => ({
      key: group.type,
      label: typeLabels[group.type] ?? group.type,
      count: group.items.length,
    })),
  ];

  useEffect(() => {
    if (activeType !== "all" && !grouped.some((group) => group.type === activeType)) {
      setActiveType("all");
    }
  }, [activeType, grouped]);

  const tabClass = (isActive: boolean) =>
    `-mb-px border-b-2 pb-2 text-xs uppercase tracking-widest transition-colors ${
      isActive
        ? "border-primary text-text-primary"
        : "border-transparent text-text-muted hover:text-text-secondary"
    }`;

  function openCreate() {
    setEditingCategory(null);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  async function handleSubmit(name: string, type: CategoryType) {
    setSaving(true);
    try {
      if (editingCategory) {
        const updated = await api.categories.update(editingCategory.id, { name, type });
        setCategories((prev) => prev.map((cat) => (cat.id === updated.id ? updated : cat)));
        toast({ title: "Categoría actualizada" });
      } else {
        const created = await api.categories.create({ name, type });
        setCategories((prev) => [...prev, created]);
        toast({ title: "Categoría creada" });
      }
      setDialogOpen(false);
      setEditingCategory(null);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "No se pudo guardar la categoría",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.categories.delete(deleteTarget.id);
      setCategories((prev) => prev.filter((cat) => cat.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({ title: "Categoría eliminada" });
    } catch (err) {
      console.error(err);
      toast({ title: "No se pudo eliminar la categoría", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <CategoriesSkeleton />;

  if (error) {
    return <ErrorState message={error} onRetry={loadCategories} fullPage />;
  }

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Categorías</h1>
            <p className="mt-1 text-sm text-text-muted">
              Organiza tus movimientos por tipo de gasto
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Nueva categoría
          </Button>
        </header>

        {categories.length === 0 ? (
          <section className="rounded-lg border border-border bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <Tags className="size-6" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">
              Aún no tienes categorías
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
              Crea categorías para saber en qué se va tu dinero y ajustar tus presupuestos.
            </p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="size-4" /> Crear mi primera categoría
            </Button>
          </section>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Tipos de categoría"
              className="mb-6 flex flex-wrap items-center gap-4 border-b border-border"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  id={`category-tab-${tab.key}`}
                  aria-selected={activeType === tab.key}
                  aria-controls="category-panel"
                  onClick={() => setActiveType(tab.key)}
                  className={tabClass(activeType === tab.key)}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            <div
              id="category-panel"
              role="tabpanel"
              aria-labelledby={`category-tab-${activeType}`}
              className="space-y-6"
            >
              {visibleGroups.map((group) => {
                const meta = typeIcons[group.type];
                return (
                  <section key={group.type}>
                    <header className="mb-2 flex items-center gap-2">
                      <span
                        className={`flex size-7 items-center justify-center rounded-full ${meta?.bg ?? "bg-bg-elevated"} ${meta?.color ?? "text-text-muted"}`}
                      >
                        {meta?.icon}
                      </span>
                      <h2 className="text-sm font-semibold text-text-primary">
                        {typeLabels[group.type] ?? group.type}
                      </h2>
                      <span className="text-xs text-text-muted">
                        {group.items.length}
                      </span>
                    </header>

                    <div className="divide-y divide-border rounded-lg border border-border bg-white">
                      {group.items.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <span className="truncate text-sm text-text-primary">
                            {category.name}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Editar ${category.name}`}
                              onClick={() => openEdit(category)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Eliminar ${category.name}`}
                              onClick={() => setDeleteTarget(category)}
                            >
                              <Trash2 className="size-4 text-expense" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>

      <CategoryDialog
        open={dialogOpen}
        category={editingCategory}
        saving={saving}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCategory(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Eliminar categoría"
        description={
          <>
            ¿Eliminar «{deleteTarget?.name}»? Los movimientos se quedarán sin categoría y
            desaparecerá de tus presupuestos.
          </>
        }
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </main>
  );
}
