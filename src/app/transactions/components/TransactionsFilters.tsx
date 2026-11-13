"use client";

import { Input } from "@/components/ui/input";
import { ArrowDownWideNarrow, Search, X } from "lucide-react";
import { NO_CATEGORY_SENTINEL } from "@/lib/transactions-utils";
import { SelectFilter } from "@/app/transactions/components/SelectFilter";
import { MultiSelectFilter } from "@/app/transactions/components/MultiSelectFilter";
import { MultiSelectTags } from "@/app/transactions/components/MultiSelectTags";
import { CalendarFilter } from "@/app/transactions/components/CalendarFilter";
import type { SelectFilterOption, TransactionsFiltersProps } from "./types/filter.types";

export function TransactionsFilters({
  filterType,
  filterFlow,
  filterCategoryIds,
  filterAccountIds,
  filterSearch,
  filterSubscriptionIds,
  filterDates,
  accounts,
  categories,
  subscriptions,
  hasActiveFilters,
  isDefaultSort,
  onFilterTypeChange,
  onFilterCategoryIdsChange,
  onFilterAccountIdsChange,
  onFilterSearchChange,
  onFilterSubscriptionIdsChange,
  onFilterDatesChange,
  onResetSort,
  onClearFilters,
}: Readonly<TransactionsFiltersProps>) {
  const typeValue: string = filterFlow
    ? filterFlow === "savings"
      ? "transfer"
      : filterFlow
    : filterType;
  const typeChipLabel = typeValue
    ? typeValue === "income"
      ? "Ingreso"
      : typeValue === "expense"
        ? "Gasto"
        : "Transferencia"
    : null;
  const hasMultiChips =
    filterCategoryIds.length > 0 ||
    filterAccountIds.length > 0 ||
    filterSubscriptionIds.length > 0;
  const hasChips = hasMultiChips || typeChipLabel !== null;

  const categoryOptions: SelectFilterOption[] = [
    { value: NO_CATEGORY_SENTINEL, label: "Sin categoría" },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ];
  const accountOptions: SelectFilterOption[] = accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));
  const subscriptionOptions: SelectFilterOption[] = subscriptions.map((subscription) => ({
    value: subscription.id,
    label: subscription.name,
  }));

  return (
    <div className="mb-4 rounded-lg border border-border bg-white p-3 sm:p-4">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end sm:gap-3">
        <div className="relative col-span-2 min-w-0 sm:min-w-[160px] sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted" />
          <Input
            placeholder="Buscar por descripción..."
            className="pl-9"
            value={filterSearch}
            onChange={(e) => onFilterSearchChange(e.target.value)}
          />
          {filterSearch && (
            <button
              onClick={() => onFilterSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-expense"
              aria-label="Limpiar filtro de búsqueda"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <SelectFilter
          value={typeValue}
          placeholder="Tipo"
          width="130px"
          options={[
            { value: "income", label: "Ingreso" },
            { value: "expense", label: "Gasto" },
            { value: "transfer", label: "Transferencia" },
          ]}
          onChange={onFilterTypeChange as (value: string) => void}
          clearLabel="Limpiar filtro de tipo"
        />
        <MultiSelectFilter
          values={filterCategoryIds}
          placeholder="Categoría"
          width="150px"
          options={categoryOptions}
          onChange={onFilterCategoryIdsChange}
        />
        <MultiSelectFilter
          values={filterAccountIds}
          placeholder="Cuenta"
          width="150px"
          options={accountOptions}
          onChange={onFilterAccountIdsChange}
          disabled={accounts.length === 0}
          emptyLabel="Sin cuentas"
        />
        <MultiSelectFilter
          values={filterSubscriptionIds}
          placeholder="Suscripciones"
          width="170px"
          options={subscriptionOptions}
          onChange={onFilterSubscriptionIdsChange}
          emptyLabel="Sin suscripciones"
        />
        <div className="hidden w-px h-8 self-center bg-border sm:block" />
        <div className="col-span-2 min-w-0 sm:w-auto">
          <CalendarFilter
            dateFrom={filterDates.from}
            dateTo={filterDates.to}
            onChange={onFilterDatesChange}
          />
        </div>
      </div>
      {(hasChips || !isDefaultSort) && (
        <div className="mt-3 flex flex-col items-start gap-2 border-t border-border pt-3 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2 sm:border-0 sm:pt-0">
          {typeChipLabel && (
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtro de tipo">
              <span className="text-xs text-text-muted whitespace-nowrap">Tipo:</span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-primary bg-primary-light transition-colors animate-chip-in motion-reduce:animate-none">
                {typeChipLabel}
                <button
                  onClick={() => onFilterTypeChange("")}
                  className="text-primary/70 hover:text-expense transition-colors"
                  aria-label={`Quitar filtro ${typeChipLabel}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            </div>
          )}
          {filterCategoryIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtro de categoría">
              <span className="text-xs text-text-muted whitespace-nowrap">Categoría:</span>
              <MultiSelectTags
                values={filterCategoryIds}
                options={categoryOptions}
                onChange={onFilterCategoryIdsChange}
              />
            </div>
          )}
          {filterAccountIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtro de cuenta">
              <span className="text-xs text-text-muted whitespace-nowrap">Cuenta:</span>
              <MultiSelectTags
                values={filterAccountIds}
                options={accountOptions}
                onChange={onFilterAccountIdsChange}
              />
            </div>
          )}
          {filterSubscriptionIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtro de suscripciones">
              <span className="text-xs text-text-muted whitespace-nowrap">Suscripciones:</span>
              <MultiSelectTags
                values={filterSubscriptionIds}
                options={subscriptionOptions}
                onChange={onFilterSubscriptionIdsChange}
              />
            </div>
          )}
          {!isDefaultSort && (
            <button
              type="button"
              onClick={onResetSort}
              className="text-xs text-text-muted hover:text-primary hover:bg-primary-light px-2 py-1 rounded transition-colors flex items-center gap-1"
              title="Volver al orden por fecha, más reciente primero"
            >
              <ArrowDownWideNarrow className="size-3.5" />
              Volver a fecha reciente
            </button>
          )}
          {hasActiveFilters && (
            <button onClick={onClearFilters} className="text-xs text-text-muted hover:text-expense hover:bg-expense/5 px-2 py-1 rounded transition-colors flex items-center gap-1 sm:ml-auto">
              Limpiar <X className="size-3 text-expense/70" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
