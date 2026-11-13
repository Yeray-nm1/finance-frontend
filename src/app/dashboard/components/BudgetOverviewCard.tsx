"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { typeLabels } from "@/lib/budget-constants";
import { DOT_COLORS, getProgressAccent, typeIcons } from "@/components/ui/variants/budget.variants";
import { ProgressBar } from "./ProgressBar";
import { GoalsCard } from "./GoalsCard";
import type { BudgetOverviewCardProps } from "./types/BudgetOverviewCard.types";

const TYPE_ORDER = ["needs", "leisure", "savings", "other"];
const UNCATEGORIZED_KEY = "uncategorized";
const GROUP_ORDER = [...TYPE_ORDER, UNCATEGORIZED_KEY];

type CardView = "budget" | "goals";

interface OverviewRow {
  categoryId: string | null;
  category: string;
  spent: number;
  budgeted: number | null;
}

interface OverviewGroup {
  key: string;
  label: string;
  type: string | null;
  rows: OverviewRow[];
  spent: number;
  budgeted: number;
}

function rowDot(row: OverviewRow): string {
  if (row.budgeted === null) return "bg-border";
  if (row.budgeted === 0) return row.spent > 0 ? DOT_COLORS.over : "bg-border";
  const progress = (row.spent / row.budgeted) * 100;
  if (progress > 100) return DOT_COLORS.over;
  if (progress >= 80) return DOT_COLORS.warning;
  return DOT_COLORS.ok;
}

function transactionsHref(
  categoryId: string | null,
  categoryName: string,
  monthValue: string,
): string {
  const params = new URLSearchParams({ flow: "expense" });
  if (categoryId) params.set("category", categoryName);
  else params.set("uncategorized", "true");
  params.set("month", monthValue);
  return `/transactions?${params.toString()}`;
}

function buildGroups(
  budgets: BudgetOverviewCardProps["budgets"],
  spending: BudgetOverviewCardProps["spending"],
): OverviewGroup[] {
  const groups = new Map<string, OverviewGroup>();

  const ensureGroup = (key: string, label: string, type: string | null) => {
    let group = groups.get(key);
    if (!group) {
      group = { key, label, type, rows: [], spent: 0, budgeted: 0 };
      groups.set(key, group);
    }
    return group;
  };

  const spendingById = new Map<string, number>();
  for (const item of spending) {
    if (item.categoryId) spendingById.set(item.categoryId, item.amount);
  }

  const budgetedIds = new Set<string>();

  for (const budget of budgets) {
    const group = ensureGroup(
      budget.categoryType,
      typeLabels[budget.categoryType] ?? budget.categoryType,
      budget.categoryType,
    );
    group.budgeted += budget.budgeted;

    if (!budget.categoryId) continue;

    budgetedIds.add(budget.categoryId);
    group.rows.push({
      categoryId: budget.categoryId,
      category: budget.category,
      spent: spendingById.get(budget.categoryId) ?? budget.spent,
      budgeted: budget.budgeted,
    });
  }

  for (const item of spending) {
    if (item.categoryId && budgetedIds.has(item.categoryId)) continue;

    const key = item.categoryType ?? UNCATEGORIZED_KEY;
    const label = item.categoryType
      ? (typeLabels[item.categoryType] ?? item.categoryType)
      : "Sin categoría";
    const group = ensureGroup(key, label, item.categoryType);

    group.rows.push({
      categoryId: item.categoryId,
      category: item.category,
      spent: item.amount,
      budgeted: null,
    });
  }

  return Array.from(groups.values())
    .filter((group) => group.rows.length > 0 || group.budgeted > 0)
    .map((group) => ({
      ...group,
      spent: group.rows.reduce((sum, row) => sum + row.spent, 0),
      rows: group.rows
        .slice()
        .sort((a, b) => b.spent - a.spent || a.category.localeCompare(b.category)),
    }))
    .sort((a, b) => GROUP_ORDER.indexOf(a.key) - GROUP_ORDER.indexOf(b.key));
}

export function BudgetOverviewCard({
  budgets,
  spending,
  monthValue,
  fillRow = true,
}: Readonly<BudgetOverviewCardProps>) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    () => new Set(),
  );
  const [view, setView] = useState<CardView>("budget");
  const groups = buildGroups(budgets, spending);

  const toggleType = (key: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const tabClass = (isActive: boolean) =>
    `-mb-px border-b-2 pb-2 text-xs uppercase tracking-widest transition-colors ${
      isActive
        ? "border-primary text-text-primary"
        : "border-transparent text-text-muted hover:text-text-secondary"
    }`;

  return (
    <section
      className={`relative flex flex-col rounded-lg border border-border bg-white p-5 ${
        fillRow ? "lg:p-0" : ""
      }`}
    >
      <div
        className={`flex flex-1 flex-col ${
          fillRow ? "lg:absolute lg:inset-0 lg:p-5" : ""
        }`}
      >
        <div
          role="tablist"
          aria-label="Presupuesto y metas de ahorro"
          className="mb-5 flex shrink-0 items-center gap-4 border-b border-border"
        >
          <button
            type="button"
            role="tab"
            id="dashboard-budget-tab"
            aria-selected={view === "budget"}
            aria-controls="dashboard-budget-panel"
            onClick={() => setView("budget")}
            className={tabClass(view === "budget")}
          >
            Presupuesto
          </button>
          <button
            type="button"
            role="tab"
            id="dashboard-goals-tab"
            aria-selected={view === "goals"}
            aria-controls="dashboard-goals-panel"
            onClick={() => setView("goals")}
            className={tabClass(view === "goals")}
          >
            Metas
          </button>
        </div>

        {view === "budget" ? (
          <div
            id="dashboard-budget-panel"
            role="tabpanel"
            aria-labelledby="dashboard-budget-tab"
            className="flex min-h-0 flex-1 flex-col"
          >
            {groups.length === 0 ? (
              <p className="flex flex-1 items-center justify-center text-xs text-text-muted">
                Sin presupuestos ni gastos este mes
              </p>
            ) : (
              <div
                data-testid="budget-scroll"
                className="mb-4 min-h-0 flex-1 space-y-2 overflow-y-scroll pr-1 scrollbar-thin [scrollbar-gutter:stable]"
              >
                {groups.map((group) => {
                  const isExpanded = expandedTypes.has(group.key);
                  const hasRows = group.rows.length > 0;
                  const progress = group.budgeted > 0 ? (group.spent / group.budgeted) * 100 : null;
                  const progressAccent = getProgressAccent(progress ?? 0);
                  const iconData = group.type ? typeIcons[group.type] : typeIcons.other;

                  const header = (
                    <div className="flex items-center gap-2 p-3">
                      <span className="shrink-0">{iconData?.icon ?? null}</span>
                      <span className="text-xs font-medium text-text-primary flex-1 truncate">
                        {group.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-text-muted whitespace-nowrap">
                          {formatCurrency(group.spent)}
                          {!hasRows && group.budgeted > 0 && ` / ${formatCurrency(group.budgeted)}`}
                        </span>
                        {progress !== null && (
                          <>
                            <ProgressBar value={progress} color={progressAccent} />
                            <span className="text-[11px] text-text-muted font-medium w-9 text-right">
                              {Math.round(progress)}%
                            </span>
                          </>
                        )}
                        {hasRows && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
                      </div>
                    </div>
                  );

                  return (
                    <div key={group.key} className="border border-border rounded-lg overflow-hidden">
                      {hasRows ? (
                        <button
                          type="button"
                          onClick={() => toggleType(group.key)}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? "Contraer" : "Expandir"} ${group.label}`}
                          className="w-full text-left hover:bg-bg-elevated transition-colors"
                        >
                          {header}
                        </button>
                      ) : (
                        header
                      )}

                      {hasRows && isExpanded && (
                        <div className="border-t border-border px-3 py-2 space-y-1 bg-bg-elevated/50">
                          {group.rows.map((row) => (
                            <Link
                              key={row.categoryId ?? `uncategorized-${row.category}`}
                              href={transactionsHref(row.categoryId, row.category, monthValue)}
                              aria-label={`Ver transacciones de ${row.category}`}
                              className="flex justify-between items-center gap-3 rounded-md -mx-1 px-1 py-1 text-xs hover:bg-bg-elevated transition-colors group"
                            >
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${rowDot(row)}`} />
                                <span className="text-text-primary truncate group-hover:text-primary">
                                  {row.category}
                                </span>
                              </span>
                              <span className="text-text-muted whitespace-nowrap shrink-0">
                                {formatCurrency(row.spent)}
                                {row.budgeted !== null && ` / ${formatCurrency(row.budgeted)}`}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <Link
              href="/budgets"
              className="mt-auto block shrink-0 text-center text-xs bg-primary text-white font-bold rounded-md px-3 py-1.5 hover:bg-primary/90 transition-colors"
            >
              {budgets.length > 0 ? "Gestionar presupuesto" : "Definir presupuesto"}
            </Link>
          </div>
        ) : (
          <div
            id="dashboard-goals-panel"
            role="tabpanel"
            aria-labelledby="dashboard-goals-tab"
            className="flex min-h-0 flex-1 flex-col"
          >
            <GoalsCard />

            <Link
              href="/goals"
              className="mt-auto block shrink-0 text-center text-xs bg-primary text-white font-bold rounded-md px-3 py-1.5 hover:bg-primary/90 transition-colors"
            >
              Ver metas
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
