import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { MonthlyBudget } from "@/types/budgets"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUniqueMonths(budgets: MonthlyBudget[]): number[] {
  return [...new Set(budgets.map(b => b.month))].sort((a, b) => a - b)
}
