"use client";

import { useState } from "react";
import type { Category, CategoryType, CategoryTypeConfig } from "@/types/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Pencil, Check } from "lucide-react";

interface CategoryTypeEditCardProps {
  config: CategoryTypeConfig;
  allocation: string;
  categories: Category[];
  onAllocationChange: (type: string, value: string) => void;
  onAddCategory: (type: CategoryType) => void;
  onDeleteCategory: (id: string) => void;
  onEditCategory: (id: string, name: string) => void;
  newCategoryName: string;
  onNewCategoryNameChange: (type: CategoryType, name: string) => void;
  onCancelAddCategory: (type: CategoryType) => void;
}

export function CategoryTypeEditCard({
  config,
  allocation,
  categories,
  onAllocationChange,
  onAddCategory,
  onDeleteCategory,
  onEditCategory,
  newCategoryName,
  onNewCategoryNameChange,
  onCancelAddCategory,
}: Readonly<CategoryTypeEditCardProps>) {
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const hasValue = allocation && Number.parseFloat(allocation) > 0;
  const isExpanded = expandedType === config.type;

  function handleEditCategoryChange(cat: Category, field: string, value: string) {
    setEditingCategory({ ...cat, [field]: value });
  }

  function handleEditCategorySubmit() {
    if (editingCategory?.name?.trim() && editingCategory?.id) {
      onEditCategory(editingCategory.id, editingCategory.name);
      setEditingCategory(null);
    }
  }

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${config.color} p-5 space-y-4 transition-all duration-300 ${
        !hasValue ? "opacity-50" : ""
      } ${hasValue ? "ring-2 ring-offset-2 ring-emerald-200" : ""}`}
    >
      <div className="space-y-1">
        <h3 className="font-display text-base font-medium text-gray-800">
          {config.label}
        </h3>
        <p className="text-xs text-gray-500">{config.description}</p>
      </div>

      <div className="flex items-center gap-2 py-3 px-4 bg-white/60 rounded-xl border border-white/50">
        <Input
          type="text"
          inputMode="decimal"
          value={allocation || ""}
          onChange={(e) => onAllocationChange(config.type, e.target.value)}
          placeholder="0"
          className="w-16 text-center font-display text-lg bg-transparent border-0 p-0 focus:ring-0"
        />
        <span className="text-sm text-gray-500">%</span>
        {!hasValue && (
          <span className="text-xs text-red-500">*requerido</span>
        )}
      </div>

      <div className="space-y-3">
        {categories.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-white/30">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between bg-white/50 rounded-lg p-2"
              >
                {editingCategory?.id === cat.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      value={editingCategory.name}
                      onChange={(e) =>
                        handleEditCategoryChange(editingCategory, "name", e.target.value)
                      }
                      className="flex-1 h-6 text-xs"
                    />
                    <button
                      onClick={handleEditCategorySubmit}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <Check className="size-3" />
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-gray-700">{cat.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingCategory(cat)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {isExpanded ? (
          <div className="flex gap-2 items-end pt-3 border-t border-white/30">
            <Input
              value={newCategoryName}
              onChange={(e) =>
                onNewCategoryNameChange(config.type, e.target.value)
              }
              placeholder="Nueva categoría..."
              className="flex-1 text-sm"
            />
            <Button
              size="sm"
              onClick={() => {
                onAddCategory(config.type);
                setExpandedType(null);
                onCancelAddCategory(config.type);
              }}
              disabled={!newCategoryName.trim()}
              className="rounded-full"
            >
              <Plus className="size-3 mr-1" /> Añadir
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setExpandedType(null);
                onCancelAddCategory(config.type);
              }}
            >
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setExpandedType(config.type)}
            className={`text-xs ${config.textAccent} hover:underline`}
          >
            + Añadir categoría
          </button>
        )}
      </div>
    </div>
  );
}
