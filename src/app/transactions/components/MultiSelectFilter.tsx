"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Search } from "lucide-react";
import type { MultiSelectFilterProps } from "./types/filter.types";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function MultiSelectFilter({
  values,
  placeholder,
  options,
  onChange,
  width = "160px",
  disabled = false,
  emptyLabel = "Sin opciones",
}: Readonly<MultiSelectFilterProps>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
    } else {
      onChange([...values, value]);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  const active = values.length > 0;
  const label = active ? `${placeholder} (${values.length})` : placeholder;
  const showSearch = options.length > 8;
  const normalizedQuery = normalize(query.trim());
  const visibleOptions = normalizedQuery
    ? options.filter((option) => normalize(option.label).includes(normalizedQuery))
    : options;
  const selectedLabel =
    values.length === 1 ? "1 seleccionada" : `${values.length} seleccionadas`;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={placeholder}
          disabled={disabled}
          className={`h-10 shrink-0 justify-between text-left font-normal ${
            active
              ? "border-primary/40 bg-primary-light text-primary hover:bg-primary/15"
              : "text-text-muted"
          }`}
          style={{ width }}
        >
          <span className="truncate">{disabled ? emptyLabel : label}</span>
          <ChevronDown className="ml-2 size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-2" align="start">
        {options.length === 0 ? (
          <p className="text-sm text-text-muted p-2">{emptyLabel}</p>
        ) : (
          <>
            {active && (
              <div className="flex items-center justify-between px-2 pb-2">
                <span className="text-xs text-text-muted">{selectedLabel}</span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-primary hover:text-primary-hover transition-colors"
                >
                  Limpiar
                </button>
              </div>
            )}
            {showSearch && (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-muted" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar..."
                  aria-label={`Buscar ${placeholder.toLowerCase()}`}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            )}
            {visibleOptions.length === 0 ? (
              <p className="text-sm text-text-muted p-2">Sin resultados</p>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {visibleOptions.map((option) => {
                  const checked = values.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                        checked
                          ? "bg-primary-light text-primary"
                          : "hover:bg-bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(option.value)}
                      />
                      <span className="truncate">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
