import { describe, it, expect } from "vitest";
import {
  buildInitialAllocations,
  getAllocation,
  getTypeRemaining,
  rescaleAllocations,
  roundCurrency,
  scaleToTotal,
  splitEvenly,
} from "@/lib/budget-allocation";
import type { Category } from "@/types/categories";

const categories: Category[] = [
  { id: "food", name: "Comida", type: "needs", userId: "1" },
  { id: "rent", name: "Alquiler", type: "needs", userId: "1" },
  { id: "cinema", name: "Cine", type: "leisure", userId: "1" },
  { id: "savings", name: "Ahorro", type: "savings", userId: "1" },
];

const typeAllocations = [
  { type: "needs", percentage: 50 },
  { type: "leisure", percentage: 20 },
  { type: "savings", percentage: 20 },
  { type: "other", percentage: 10 },
];

describe("roundCurrency", () => {
  it("rounds to two decimals", () => {
    expect(roundCurrency(10.006)).toBe(10.01);
    expect(roundCurrency(10.004)).toBe(10);
  });
});

describe("splitEvenly", () => {
  it("splits an amount into equal cents without losing any", () => {
    expect(splitEvenly(100, 3)).toEqual([33.33, 33.33, 33.34]);
    expect(splitEvenly(1000, 2)).toEqual([500, 500]);
  });

  it("returns an empty array when there are no categories", () => {
    expect(splitEvenly(100, 0)).toEqual([]);
  });
});

describe("scaleToTotal", () => {
  it("scales amounts proportionally", () => {
    expect(scaleToTotal([100, 300], 200)).toEqual([50, 150]);
  });

  it("splits evenly when the current total is zero", () => {
    expect(scaleToTotal([0, 0], 100)).toEqual([50, 50]);
  });

  it("keeps the total exact after rounding", () => {
    const result = scaleToTotal([1, 1, 1], 100);
    expect(result.reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 2);
  });
});

describe("buildInitialAllocations", () => {
  it("splits each type evenly when there is nothing stored", () => {
    const result = buildInitialAllocations(categories, typeAllocations, 1000);
    expect(getAllocation(result, "rent")).toBe(250);
    expect(getAllocation(result, "food")).toBe(250);
    expect(getAllocation(result, "cinema")).toBe(200);
    expect(getAllocation(result, "savings")).toBe(200);
  });

  it("keeps stored allocations for types that have them", () => {
    const stored = [
      { categoryId: "rent", amount: 200 },
      { categoryId: "food", amount: 300 },
    ];
    const result = buildInitialAllocations(categories, typeAllocations, 1000, stored);
    expect(getAllocation(result, "rent")).toBe(200);
    expect(getAllocation(result, "food")).toBe(300);
    expect(getAllocation(result, "cinema")).toBe(200);
  });
});

describe("rescaleAllocations", () => {
  it("rescales only the requested type to its new target", () => {
    const initial = buildInitialAllocations(categories, typeAllocations, 1000);
    const result = rescaleAllocations(
      initial,
      categories,
      typeAllocations,
      2000,
      "needs"
    );
    expect(getAllocation(result, "rent")).toBe(500);
    expect(getAllocation(result, "food")).toBe(500);
    expect(getAllocation(result, "cinema")).toBe(200);
  });

  it("rescales every type when no type is specified", () => {
    const initial = buildInitialAllocations(categories, typeAllocations, 1000);
    const result = rescaleAllocations(initial, categories, typeAllocations, 2000);
    expect(getAllocation(result, "rent")).toBe(500);
    expect(getAllocation(result, "cinema")).toBe(400);
    expect(getAllocation(result, "savings")).toBe(400);
  });
});

describe("getTypeRemaining", () => {
  it("returns what is left to distribute in a type", () => {
    const allocations = [
      { categoryId: "rent", amount: 300 },
      { categoryId: "food", amount: 100 },
    ];
    expect(getTypeRemaining(categories, "needs", allocations, 500)).toBe(100);
  });

  it("returns a negative number when the type is over-allocated", () => {
    const allocations = [
      { categoryId: "rent", amount: 300 },
      { categoryId: "food", amount: 300 },
    ];
    expect(getTypeRemaining(categories, "needs", allocations, 500)).toBe(-100);
  });

  it("returns zero when the type has no categories", () => {
    expect(getTypeRemaining(categories, "other", [], 500)).toBe(0);
  });
});
