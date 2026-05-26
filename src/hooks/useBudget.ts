"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { MonthlyBudget } from "@/types/budgets";

export function useBudget(month: number, year: number) {
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveBudget(
    totalIncome: number,
    typeAllocations: Array<{ type: string; percentage: number }>
  ): Promise<MonthlyBudget | null> {
    setSaving(true);
    try {
      const saved = await api.budgets.monthly.upsert(month, year, {
        totalIncome,
        typeAllocations,
      });
      setBudget(saved);
      return saved;
    } catch (err) {
      console.error("Error saving budget", err);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function deleteBudget(): Promise<boolean> {
    return true;
  }

  async function calculateIncome(): Promise<number | null> {
    try {
      const groups = await api.budgets.calculateIncome(month, year);
      return groups.reduce((sum, g) => sum + g.totalAmount, 0);
    } catch (err) {
      console.error("Error calculating income", err);
      return null;
    }
  }

  return {
    budget,
    setBudget,
    saving,
    saveBudget,
    deleteBudget,
    calculateIncome,
  };
}
