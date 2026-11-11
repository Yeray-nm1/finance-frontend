"use client";

import { TableHead } from "@/components/ui/table";
import { SortIcon } from "@/app/transactions/components/SortIcon";
import type { SortableHeaderProps } from "./types/filter.types";

function sortAria(field: string, sortBy: string, sortOrder: string): "ascending" | "descending" | "none" {
  if (sortBy !== field) return "none";
  return sortOrder === "asc" ? "ascending" : "descending";
}

export function SortableHeader({ field, label, sortBy, sortOrder, onSort, textRight }: Readonly<SortableHeaderProps>) {
  const isActive = sortBy === field;
  const direction = sortAria(field, sortBy, sortOrder);
  const actionLabel = direction === "none"
    ? `Ordenar por ${label}`
    : direction === "ascending"
      ? `Ordenar por ${label} descendente`
      : `Ordenar por ${label} ascendente`;

  return (
    <TableHead aria-sort={direction} className={textRight ? "text-right" : undefined}>
      <button
        onClick={() => onSort(field as "date" | "amount" | "description")}
        aria-label={actionLabel}
        title={actionLabel}
        className={`cursor-pointer select-none border-none p-0 font-inherit transition-colors rounded-md px-2 py-1 -mx-2 ${isActive ? "bg-primary-light text-text-primary" : "bg-transparent text-text-secondary hover:bg-primary-light/50 hover:text-text-primary"} ${textRight ? "w-full text-right" : ""}`}
      >
        {label} <SortIcon field={field} sortBy={sortBy} sortOrder={sortOrder} />
      </button>
    </TableHead>
  );
}
