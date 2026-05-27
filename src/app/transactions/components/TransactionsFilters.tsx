"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { SelectFilter } from "@/app/transactions/components/SelectFilter";
import { CalendarFilter } from "@/app/transactions/components/CalendarFilter";
import { SubscriptionFilter } from "@/app/transactions/components/SubscriptionFilter";
import { SubscriptionTags } from "@/app/transactions/components/SubscriptionTags";
import type { TransactionsFiltersProps } from "@/types/filter";

export function TransactionsFilters({
  filterType,
  filterCategoryId,
  filterAccountId,
  filterSearch,
  filterSubscriptionIds,
  filterDates,
  accounts,
  categories,
  subscriptions,
  hasActiveFilters,
  onFilterTypeChange,
  onFilterCategoryIdChange,
  onFilterAccountIdChange,
  onFilterSearchChange,
  onFilterSubscriptionIdsChange,
  onFilterDatesChange,
  onClearFilters,
}: Readonly<TransactionsFiltersProps>) {
  const selectFilters = [
    {
      key: "type",
      value: filterType,
      placeholder: "Tipo",
      width: "140px",
      options: [
        { value: "income", label: "Ingreso" },
        { value: "expense", label: "Gasto" },
        { value: "transfer", label: "Transferencia" },
      ],
      onChange: onFilterTypeChange as (v: string) => void,
      clearLabel: "Limpiar filtro de tipo",
    },
    {
      key: "category",
      value: filterCategoryId,
      placeholder: "Categoria",
      width: "160px",
      options: categories.map((c) => ({ value: c.id, label: c.name })),
      onChange: onFilterCategoryIdChange,
      clearLabel: "Limpiar filtro de categoria",
    },
    {
      key: "account",
      value: filterAccountId,
      placeholder: "Cuenta",
      width: "160px",
      options: accounts.map((a) => ({ value: a.id, label: a.name })),
      onChange: onFilterAccountIdChange,
      clearLabel: "Limpiar filtro de cuenta",
    },
  ];

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
        {selectFilters.map((f) => (
          <SelectFilter
            key={f.key}
            value={f.value}
            placeholder={f.placeholder}
            width={f.width}
            options={f.options}
            onChange={f.onChange}
            clearLabel={f.clearLabel}
          />
        ))}
        <SubscriptionFilter
          subscriptionIds={filterSubscriptionIds}
          subscriptions={subscriptions}
          onChange={onFilterSubscriptionIdsChange}
        />
        <div className="w-px h-8 bg-border self-center" />
        <CalendarFilter
          dateFrom={filterDates.from}
          dateTo={filterDates.to}
          onChange={onFilterDatesChange}
        />
        {hasActiveFilters && (
          <div className="w-full flex flex-wrap items-center gap-2">
            <SubscriptionTags
              subscriptionIds={filterSubscriptionIds}
              subscriptions={subscriptions}
              onChange={onFilterSubscriptionIdsChange}
            />
            <button onClick={onClearFilters} className="ml-auto text-xs text-text-muted hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1">
              Limpiar <X className="size-3 text-red-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
