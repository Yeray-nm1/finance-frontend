import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BudgetHeaderProps } from "@/types/budgets";

export function BudgetHeader({
  monthLabel,
  badge,
  canGoBack,
  canGoForward,
  showEditButton,
  editButtonLabel,
  onPrevMonth,
  onNextMonth,
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
          className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-5 text-text-muted" />
        </button>
        <span className="text-base font-medium text-text-primary">
          {monthLabel}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
          {badge.text}
        </span>
        <button
          onClick={onNextMonth}
          disabled={!canGoForward}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="size-5 text-text-muted" />
        </button>
      </div>
    </header>
  );
}
