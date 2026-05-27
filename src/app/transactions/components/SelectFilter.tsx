"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import type { SelectFilterProps } from "@/types/filter";

export function SelectFilter({
  value,
  placeholder,
  options,
  onChange,
  width = "160px",
  clearLabel = "Limpiar filtro",
}: Readonly<SelectFilterProps>) {
  return (
    <div className="relative" style={{ width }}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={value ? "pr-8" : ""}><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense z-10"
          aria-label={clearLabel}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
