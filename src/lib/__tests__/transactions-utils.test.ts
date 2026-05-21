import { describe, it, expect } from "vitest";
import {
  NO_CATEGORY_SENTINEL,
  getSubmitLabel,
  getAmountColor,
  getAmountSign,
  formatDateRange,
  typeLabel,
} from "@/lib/transactions-utils";

describe("NO_CATEGORY_SENTINEL", () => {
  it("equals __none__", () => {
    expect(NO_CATEGORY_SENTINEL).toBe("__none__");
  });
});

describe("getSubmitLabel", () => {
  it("returns Guardando... when saving and editing", () => {
    expect(getSubmitLabel(true, true)).toBe("Guardando...");
  });

  it("returns Creando... when saving and not editing", () => {
    expect(getSubmitLabel(true, false)).toBe("Creando...");
  });

  it("returns Guardar cambios when not saving and editing", () => {
    expect(getSubmitLabel(false, true)).toBe("Guardar cambios");
  });

  it("returns Crear when not saving and not editing", () => {
    expect(getSubmitLabel(false, false)).toBe("Crear");
  });
});

describe("getAmountColor", () => {
  it('returns text-income for income', () => {
    expect(getAmountColor("income")).toBe("text-income");
  });

  it('returns text-expense for expense', () => {
    expect(getAmountColor("expense")).toBe("text-expense");
  });

  it('returns text-savings for transfer', () => {
    expect(getAmountColor("transfer")).toBe("text-savings");
  });
});

describe("getAmountSign", () => {
  it('returns + for income', () => {
    expect(getAmountSign("income")).toBe("+");
  });

  it('returns - for expense', () => {
    expect(getAmountSign("expense")).toBe("-");
  });

  it('returns ↔ for transfer', () => {
    expect(getAmountSign("transfer")).toBe("↔");
  });
});

describe("formatDateRange", () => {
  it("returns formatted range when both dates provided", () => {
    const from = new Date("2026-05-15");
    const to = new Date("2026-06-20");
    expect(formatDateRange(from, to)).toBe("15/05/2026 - 20/06/2026");
  });

  it("returns partial range when only from is provided", () => {
    const from = new Date("2026-05-15");
    expect(formatDateRange(from)).toBe("15/05/2026 - ...");
  });

  it('returns placeholder when no dates provided', () => {
    expect(formatDateRange()).toBe("Seleccionar fechas");
  });
});

describe("typeLabel", () => {
  it('returns Ingreso for income', () => {
    expect(typeLabel("income")).toBe("Ingreso");
  });

  it('returns Gasto for expense', () => {
    expect(typeLabel("expense")).toBe("Gasto");
  });

  it('returns Transferencia for transfer', () => {
    expect(typeLabel("transfer")).toBe("Transferencia");
  });

  it("returns the input for unknown types", () => {
    expect(typeLabel("other")).toBe("other");
    expect(typeLabel("")).toBe("");
  });
});
