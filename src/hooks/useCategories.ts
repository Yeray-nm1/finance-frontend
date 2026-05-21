"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { Category, CategoryType } from "@/types/categories";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await api.categories.list();
      setCategories(cats);
      return cats;
    } catch (err) {
      console.error("Error loading categories", err);
      return [];
    }
  }, []);

  async function addCategory(type: CategoryType, name: string): Promise<Category | null> {
    if (!name.trim()) return null;

    try {
      const cat = await api.categories.create({ name, type });
      setCategories((prev) => [...prev, cat]);
      return cat;
    } catch (err) {
      console.error("Error creating category", err);
      return null;
    }
  }

  async function updateCategory(
    id: string,
    data: { name?: string; type?: CategoryType }
  ): Promise<Category | null> {
    try {
      const updated = await api.categories.update(id, data);
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      return updated;
    } catch (err) {
      console.error("Error updating category", err);
      return null;
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    try {
      await api.categories.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting category", err);
      return false;
    }
  }

  function getCategoriesByType(type: string): Category[] {
    return categories.filter((cat) => cat.type === type);
  }

  function getCategoriesByTypeRecord(): Record<string, Category[]> {
    return categories.reduce(
      (acc, cat) => {
        if (!acc[cat.type]) acc[cat.type] = [];
        acc[cat.type].push(cat);
        return acc;
      },
      {} as Record<string, Category[]>
    );
  }

  return {
    categories,
    setCategories,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
    getCategoriesByTypeRecord,
  };
}
