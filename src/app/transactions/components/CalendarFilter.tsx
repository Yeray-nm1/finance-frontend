"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { formatDateRange } from "@/lib/transactions-utils";
import type { CalendarFilterProps } from "@/types/filter";

export function CalendarFilter({ dateFrom, dateTo, onChange }: Readonly<CalendarFilterProps>) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label="Abrir calendario"
          className={`h-9 justify-start text-left font-normal ${!dateFrom && !dateTo ? "text-text-muted" : "text-text-primary"}`}
        >
          {formatDateRange(dateFrom, dateTo)}
          <CalendarIcon className="ml-2 size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={dateFrom ? { from: dateFrom, to: dateTo } : undefined}
          onSelect={(range) => {
            onChange({ from: range?.from, to: range?.to });
            if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
              setOpen(false);
            }
          }}
          autoFocus
        />
        {(dateFrom || dateTo) && (
          <div className="border-t border-border p-2 flex justify-center">
            <button
              onClick={() => { onChange({}); }}
              className="text-xs text-text-muted hover:text-expense transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
