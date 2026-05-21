"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, X, CalendarIcon } from "lucide-react";
import { formatDateRange } from "@/lib/transactions-utils";
import type { Account } from "@/types/accounts";
import type { Category } from "@/types/categories";

interface TransactionsFiltersProps {
  filterType: "" | "income" | "expense" | "transfer";
  filterCategoryId: string;
  filterAccountId: string;
  filterSearch: string;
  filterDates: { from?: Date; to?: Date };
  accounts: Account[];
  categories: Category[];
  hasActiveFilters: boolean;
  calendarOpen: boolean;
  onFilterTypeChange: (value: "" | "income" | "expense" | "transfer") => void;
  onFilterCategoryIdChange: (value: string) => void;
  onFilterAccountIdChange: (value: string) => void;
  onFilterSearchChange: (value: string) => void;
  onFilterDatesChange: (dates: { from?: Date; to?: Date }) => void;
  onCalendarOpenChange: (open: boolean) => void;
  onClearFilters: () => void;
}

export function TransactionsFilters({
  filterType,
  filterCategoryId,
  filterAccountId,
  filterSearch,
  filterDates,
  accounts,
  categories,
  hasActiveFilters,
  calendarOpen,
  onFilterTypeChange,
  onFilterCategoryIdChange,
  onFilterAccountIdChange,
  onFilterSearchChange,
  onFilterDatesChange,
  onCalendarOpenChange,
  onClearFilters,
}: Readonly<TransactionsFiltersProps>) {
  return (
    <div className="bg-white border border-border rounded-lg mb-4 p-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <Input
            placeholder="Buscar por descripcion..."
            className="pl-9"
            value={filterSearch}
            onChange={(e) => onFilterSearchChange(e.target.value)}
          />
          {filterSearch && (
            <button
              onClick={() => onFilterSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense"
              aria-label="Limpiar filtro de busqueda"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="relative w-[140px]">
          <Select value={filterType} onValueChange={(v) => { onFilterTypeChange(v as "" | "income" | "expense" | "transfer"); }}>
            <SelectTrigger className={filterType ? "pr-8" : ""}><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Ingreso</SelectItem>
              <SelectItem value="expense">Gasto</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
            </SelectContent>
          </Select>
          {filterType && (
            <button
              onClick={() => onFilterTypeChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense z-10"
              aria-label="Limpiar filtro de tipo"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="relative w-[160px]">
          <Select value={filterCategoryId} onValueChange={(v) => { onFilterCategoryIdChange(v); }}>
            <SelectTrigger className={filterCategoryId ? "pr-8" : ""}><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterCategoryId && (
            <button
              onClick={() => onFilterCategoryIdChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense z-10"
              aria-label="Limpiar filtro de categoria"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="relative w-[160px]">
          <Select value={filterAccountId} onValueChange={(v) => { onFilterAccountIdChange(v); }}>
            <SelectTrigger className={filterAccountId ? "pr-8" : ""}><SelectValue placeholder="Cuenta" /></SelectTrigger>
            <SelectContent>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterAccountId && (
            <button
              onClick={() => onFilterAccountIdChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense z-10"
              aria-label="Limpiar filtro de cuenta"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <div className="w-px h-8 bg-border self-center" />
        <Popover open={calendarOpen} onOpenChange={onCalendarOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              aria-label="Abrir calendario"
              className={`h-9 justify-start text-left font-normal ${!filterDates.from && !filterDates.to ? "text-text-muted" : "text-text-primary"}`}
            >
              {formatDateRange(filterDates.from, filterDates.to)}
              <CalendarIcon className="ml-2 size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={filterDates.from ? { from: filterDates.from, to: filterDates.to } : undefined}
              onSelect={(range) => {
                onFilterDatesChange({ from: range?.from, to: range?.to });
                if (range?.from && range?.to && range.from.getTime() !== range.to.getTime()) {
                  onCalendarOpenChange(false);
                }
              }}
              autoFocus
            />
            {(filterDates.from || filterDates.to) && (
              <div className="border-t border-border p-2 flex justify-center">
                <button
                  onClick={() => { onFilterDatesChange({}); }}
                  className="text-xs text-text-muted hover:text-expense transition-colors"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        {hasActiveFilters && (
          <div className="w-full">
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X className="size-4 mr-1" /> Limpiar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
