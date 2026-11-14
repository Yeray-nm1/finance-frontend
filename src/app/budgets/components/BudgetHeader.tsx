import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BudgetHeaderProps } from "./types/BudgetHeader.types";

export function BudgetHeader({
  monthOptions,
  selectedMonthValue,
  badge,
  canGoBack,
  canGoForward,
  nextMonthLabel,
  showEditButton,
  editButtonLabel,
  onPrevMonth,
  onNextMonth,
  onMonthChange,
  onStartEdit,
}: Readonly<BudgetHeaderProps>) {
  return (
    <header className="mb-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <h1 className="row-start-1 font-serif text-2xl font-semibold text-text-primary sm:col-start-1 sm:row-start-1 sm:text-3xl">
          Presupuestos
        </h1>
        {showEditButton && (
          <Button
            className="row-start-4 w-full sm:col-start-3 sm:row-start-3 sm:w-auto sm:justify-self-end"
            onClick={onStartEdit}
          >
            {editButtonLabel}
          </Button>
        )}
        <div className="row-start-3 flex items-center gap-2 sm:col-span-2 sm:col-start-1 sm:row-start-3">
          <button
            onClick={onPrevMonth}
            disabled={!canGoBack}
            aria-label="Mes anterior con presupuesto"
            title={canGoBack ? "Mes anterior con presupuesto" : "No hay presupuestos anteriores"}
            className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-5 text-text-muted" />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-thin">
            {monthOptions.map((opt) => {
              const isActive = opt.value === selectedMonthValue;

              return (
                <button
                  key={opt.value}
                  onClick={() => onMonthChange(opt.value)}
                  aria-pressed={isActive}
                  aria-current={opt.isCurrent ? "date" : undefined}
                  aria-label={`Ir a ${opt.label}${opt.hasBudget ? "" : " (sin presupuesto)"}`}
                  title={opt.isCurrent ? "Mes actual" : `Ir a ${opt.label}`}
                  className={[
                    "flex h-10 shrink-0 flex-col items-center justify-center rounded-lg border px-2 transition-colors sm:h-11 sm:px-3",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    isActive
                      ? "border-primary bg-primary text-white"
                      : opt.hasBudget
                        ? "border-border bg-white text-text-secondary hover:border-primary-border hover:text-primary"
                        : "border-dashed border-border bg-white text-text-muted hover:border-primary-border hover:text-primary",
                  ].join(" ")}
                >
                  <span className="text-[11px] font-medium whitespace-nowrap sm:text-xs">
                    {opt.shortLabel ? (
                      <>
                        <span className="sm:hidden">{opt.shortLabel}</span>
                        <span className="hidden sm:inline">{opt.label}</span>
                      </>
                    ) : (
                      opt.label
                    )}
                  </span>
                  {opt.isCurrent && (
                    <span
                      className={[
                        "flex h-3.5 items-center text-[10px] font-semibold uppercase tracking-wide",
                        isActive ? "text-white/80" : "text-text-muted",
                      ].join(" ")}
                    >
                      (Actual)
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={onNextMonth}
            disabled={!canGoForward}
            aria-label="Mes siguiente"
            title={canGoForward ? `Ir a ${nextMonthLabel}` : "Mes siguiente"}
            className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="size-5 text-text-muted" />
          </button>

          <div aria-hidden="true" className="hidden h-8 w-px shrink-0 bg-border sm:block" />
        </div>

        <span
          className={`row-start-2 w-fit justify-self-start rounded-full px-2 py-0.5 text-xs font-medium sm:col-start-1 sm:row-start-2 sm:justify-self-start ${badge.className}`}
        >
          {badge.text}
        </span>
      </div>
    </header>
  );
}
