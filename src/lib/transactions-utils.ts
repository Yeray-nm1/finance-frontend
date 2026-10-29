import { format } from "date-fns";
import type { TransactionType } from "@/types/transactions";

export const NO_CATEGORY_SENTINEL = "__none__";

export function getSubmitLabel(saving: boolean, isEditing: boolean): string {
  if (saving && isEditing) return "Guardando...";
  if (saving && !isEditing) return "Creando...";
  if (!saving && isEditing) return "Guardar cambios";
  return "Crear";
}

export function getAmountSign(type: TransactionType): string {
  if (type === "income") return "+";
  if (type === "expense") return "-";
  return "\u2194";
}

export function formatDateRange(from?: Date, to?: Date): string {
  if (from && to) return `${format(from, "dd/MM/yyyy")} - ${format(to, "dd/MM/yyyy")}`;
  if (from) return `${format(from, "dd/MM/yyyy")} - ...`;
  return "Seleccionar fechas";
}

export function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    income: "Ingreso",
    expense: "Gasto",
    transfer: "Transferencia",
  };
  return labels[type] ?? type;
}
