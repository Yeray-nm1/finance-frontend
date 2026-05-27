"use client";

import { TableHead } from "@/components/ui/table";
import { SortIcon } from "@/app/transactions/components/SortIcon";
import type { SortableHeaderProps } from "@/types/filter";

function sortAria(field: string, sortBy: string, sortOrder: string): "ascending" | "descending" | "none" {
  if (sortBy !== field) return "none";
  return sortOrder === "asc" ? "ascending" : "descending";
}

export function SortableHeader({ field, label, sortBy, sortOrder, onSort, textRight }: Readonly<SortableHeaderProps>) {
  return (
    <TableHead aria-sort={sortAria(field, sortBy, sortOrder)} className={textRight ? "text-right" : undefined}>
      <button
        onClick={() => onSort(field as "date" | "amount" | "description")}
        className={`cursor-pointer select-none bg-transparent border-none p-0 font-inherit text-inherit ${textRight ? "w-full text-right" : ""}`}
      >
        {label} <SortIcon field={field} sortBy={sortBy} sortOrder={sortOrder} />
      </button>
    </TableHead>
  );
}
