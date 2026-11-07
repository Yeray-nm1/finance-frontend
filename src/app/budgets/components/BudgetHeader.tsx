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
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-text-primary">
          Presupuestos
        </h1>
        {showEditButton && (
          <Button onClick={onStartEdit}>
            {editButtonLabel}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={onPrevMonth}
          disabled={!canGoBack}
          aria-label="Mes anterior con presupuesto"
          title={canGoBack ? "Mes anterior con presupuesto" : "No hay presupuestos anteriores"}
          className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-bg-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-5 text-text-muted" />
        </button>

        <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
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
                  "flex h-11 shrink-0 flex-col items-center justify-center rounded-lg border px-3 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  isActive
                    ? "border-primary bg-primary text-white"
                    : opt.hasBudget
                      ? "border-border bg-white text-text-secondary hover:border-primary-border hover:text-primary"
                      : "border-dashed border-border bg-white text-text-muted hover:border-primary-border hover:text-primary",
                ].join(" ")}
              >
                <span className="text-xs font-medium whitespace-nowrap">{opt.label}</span>
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
        <span className={`ml-auto shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
          {badge.text}
        </span>
      </div>
    </header>
  );
}
