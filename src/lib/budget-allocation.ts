import type { Category } from "@/types/categories";
import type { CategoryAllocation } from "@/types/budgets";

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function splitEvenly(total: number, count: number): number[] {
  if (count <= 0) return [];
  const totalCents = Math.round(total * 100);
  const base = Math.floor(totalCents / count);
  const values = Array.from({ length: count }, () => base);
  values[count - 1] += totalCents - base * count;
  return values.map((cents) => cents / 100);
}

export function scaleToTotal(amounts: readonly number[], target: number): number[] {
  if (amounts.length === 0) return [];
  const targetCents = Math.round(target * 100);
  const currentCents = amounts.reduce((sum, amount) => sum + Math.round(amount * 100), 0);

  if (currentCents <= 0) return splitEvenly(target, amounts.length);

  const scaled = amounts.map((amount) =>
    Math.round((Math.round(amount * 100) / currentCents) * targetCents)
  );
  const drift = targetCents - scaled.reduce((sum, cents) => sum + cents, 0);
  scaled[scaled.length - 1] += drift;

  return scaled.map((cents) => cents / 100);
}

export function buildInitialAllocations(
  categories: readonly Category[],
  typeAllocations: readonly { type: string; percentage: number }[],
  totalIncome: number,
  stored: readonly CategoryAllocation[] = []
): CategoryAllocation[] {
  const storedByCategory = new Map(stored.map((entry) => [entry.categoryId, entry.amount]));
  const result: CategoryAllocation[] = [];

  for (const typeAllocation of typeAllocations) {
    const typeCategories = categories.filter((cat) => cat.type === typeAllocation.type);
    if (typeCategories.length === 0) continue;

    const typeAmount = roundCurrency(totalIncome * (typeAllocation.percentage / 100));
    const hasStored = typeCategories.some((cat) => storedByCategory.has(cat.id));

    if (hasStored) {
      for (const cat of typeCategories) {
        result.push({
          categoryId: cat.id,
          amount: roundCurrency(storedByCategory.get(cat.id) ?? 0),
        });
      }
    } else {
      const amounts = splitEvenly(typeAmount, typeCategories.length);
      typeCategories.forEach((cat, index) => {
        result.push({ categoryId: cat.id, amount: amounts[index] });
      });
    }
  }

  return result;
}

export function rescaleAllocations(
  allocations: readonly CategoryAllocation[],
  categories: readonly Category[],
  typeAllocations: readonly { type: string; percentage: number }[],
  totalIncome: number,
  onlyType?: string
): CategoryAllocation[] {
  const result = allocations.map((entry) => ({ ...entry }));
  const byCategory = new Map(result.map((entry) => [entry.categoryId, entry]));

  for (const typeAllocation of typeAllocations) {
    if (onlyType && typeAllocation.type !== onlyType) continue;

    const typeCategories = categories.filter((cat) => cat.type === typeAllocation.type);
    if (typeCategories.length === 0) continue;

    const target = roundCurrency(totalIncome * (typeAllocation.percentage / 100));
    const currentAmounts = typeCategories.map(
      (cat) => byCategory.get(cat.id)?.amount ?? 0
    );
    const scaledAmounts = scaleToTotal(currentAmounts, target);

    typeCategories.forEach((cat, index) => {
      const entry = byCategory.get(cat.id);
      if (entry) {
        entry.amount = scaledAmounts[index];
      } else {
        const created = { categoryId: cat.id, amount: scaledAmounts[index] };
        result.push(created);
        byCategory.set(cat.id, created);
      }
    });
  }

  return result;
}

export function getAllocation(
  allocations: readonly CategoryAllocation[],
  categoryId: string
): number {
  return allocations.find((entry) => entry.categoryId === categoryId)?.amount ?? 0;
}

export function getTypeRemaining(
  categories: readonly Category[],
  type: string,
  categoriesAllocated: readonly CategoryAllocation[],
  typeAmount: number
): number {
  const typeCategories = categories.filter((cat) => cat.type === type);
  if (typeCategories.length === 0) return 0;

  const allocated = typeCategories.reduce(
    (sum, cat) => sum + getAllocation(categoriesAllocated, cat.id),
    0
  );

  return roundCurrency(typeAmount - allocated);
}
