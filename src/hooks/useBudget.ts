"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { MonthlyBudget } from "@/types";

export function useBudget(month: number, year: number) {
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadBudget = useCallback(async () => {
    try {
      const draftData = await api.budgets.getOrCreateDraft(month, year);

      if (draftData.exists && draftData.budget) {
        setBudget(draftData.budget);
        return { budget: draftData.budget, exists: true };
      } else {
        setBudget(null);
        return { budget: null, exists: false };
      }
    } catch (err) {
      console.error("Error loading budget", err);
      return { budget: null, exists: false };
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  async function saveBudget(
    totalIncome: number,
    typeAllocations: Array<{ categoryType: string; percentage: number }>
  ): Promise<MonthlyBudget | null> {
    setSaving(true);
    try {
      let savedBudget: MonthlyBudget;

      if (budget) {
        savedBudget = await api.budgets.update(month, year, {
          totalIncome,
          typeAllocations,
        });
      } else {
        savedBudget = await api.budgets.create({
          month,
          year,
          totalIncome,
          typeAllocations,
        });
      }

      setBudget(savedBudget);
      return savedBudget;
    } catch (err) {
      console.error("Error saving budget", err);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function deleteBudget(): Promise<boolean> {
    try {
      await api.budgets.delete(month, year);
      setBudget(null);
      return true;
    } catch (err) {
      console.error("Error deleting budget", err);
      return false;
    }
  }

  async function calculateIncome(): Promise<number | null> {
    try {
      const data = await api.budgets.calculateIncome(month, year);
      return data.income;
    } catch (err) {
      console.error("Error calculating income", err);
      return null;
    }
  }

  return {
    budget,
    setBudget,
    loading,
    saving,
    loadBudget,
    saveBudget,
    deleteBudget,
    calculateIncome,
  };
}
