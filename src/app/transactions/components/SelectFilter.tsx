"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import type { CSSProperties } from "react";
import type { SelectFilterProps } from "./types/filter.types";

export function SelectFilter({
  value,
  placeholder,
  options,
  onChange,
  width = "160px",
  clearLabel = "Limpiar filtro",
  disabled = false,
}: Readonly<SelectFilterProps>) {
  return (
    <div
      className="relative min-w-0 w-full sm:w-[var(--filter-width)] sm:shrink-0"
      style={{ "--filter-width": width } as CSSProperties}
    >
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          disabled={disabled}
          className={`${value ? "pr-8" : ""} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <SelectValue placeholder={disabled ? "Sin cuentas" : placeholder} />
        </SelectTrigger>
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
