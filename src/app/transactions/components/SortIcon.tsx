"use client";

import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import type { SortIconProps } from "@/types/transactions";

export function SortIcon({ field, sortBy, sortOrder }: Readonly<SortIconProps>) {
  if (sortBy !== field) return <ArrowUpDown className="size-3 inline ml-1 opacity-40" />;
  return sortOrder === "asc"
    ? <ChevronUp className="size-3 inline ml-1" />
    : <ChevronDown className="size-3 inline ml-1" />;
}
