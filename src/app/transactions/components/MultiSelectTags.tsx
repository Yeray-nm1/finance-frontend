"use client";

import { X } from "lucide-react";
import type { MultiSelectTagsProps } from "./types/filter.types";

export function MultiSelectTags({
  values,
  options,
  onChange,
}: Readonly<MultiSelectTagsProps>) {
  if (values.length === 0) return null;

  return (
    <>
      {options
        .filter((option) => values.includes(option.value))
        .map((option) => (
          <span
            key={option.value}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-primary bg-primary-light hover:bg-primary/15 transition-colors animate-chip-in motion-reduce:animate-none"
          >
            {option.label}
            <button
              onClick={() => onChange(values.filter((value) => value !== option.value))}
              className="text-primary/70 hover:text-expense transition-colors"
              aria-label={`Quitar filtro ${option.label}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
    </>
  );
}
