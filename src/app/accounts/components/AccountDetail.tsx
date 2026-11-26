"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAmountNumber, formatSignedAmount } from "@/lib/format";
import { formatMovementDate } from "@/lib/account-summary";
import { cn } from "@/lib/utils";
import { TYPE_LABELS } from "../constants";
import type { AccountDetailProps } from "./types/AccountDetail.types";

const TYPE_BADGE_CLASSES: Record<string, string> = {
  checking: "bg-primary-light text-primary",
  savings: "bg-[#DCFCE7] text-[#166534]",
};

export function AccountDetail({
  account,
  balance,
  goal,
  movements,
  onEdit,
  onDelete,
  onImport,
}: Readonly<AccountDetailProps>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = Math.min(100, Math.max(0, Math.round(goal?.progress ?? 0)));

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="m-0 text-xl font-semibold text-text-primary">
            {account.name}
          </h2>
          <span
            className={cn(
              "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
              TYPE_BADGE_CLASSES[account.type] ?? "bg-bg-elevated text-text-secondary"
            )}
          >
            {TYPE_LABELS[account.type] ?? account.type}
          </span>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            aria-label="Más acciones"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-11 items-center justify-center rounded-[10px] text-text-secondary hover:bg-bg-elevated"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="4" cy="10" r="1.6" fill="currentColor" />
              <circle cx="10" cy="10" r="1.6" fill="currentColor" />
              <circle cx="16" cy="10" r="1.6" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-border bg-white p-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="block w-full rounded px-3 py-2 text-left text-sm text-text-primary hover:bg-bg-elevated"
              >
                Editar cuenta
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="block w-full rounded px-3 py-2 text-left text-sm text-expense hover:bg-bg-elevated"
              >
                Eliminar cuenta
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-[0.08em] text-text-muted">
          SALDO
        </div>
        <div className="mt-1 text-[32px] font-bold leading-tight text-text-primary">
          <span>{formatAmountNumber(balance)}</span>{" "}
          <span className="text-xl">€</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onImport}>Importar extracto</Button>
        <Button
          variant="outline"
          aria-label={`Editar ${account.name}`}
          onClick={onEdit}
        >
          Editar cuenta
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Eliminar ${account.name}`}
          onClick={onDelete}
        >
          <Trash2 className="size-4 text-expense" />
        </Button>
        <Link
          href={`/transactions?accountId=${account.id}`}
          className="ml-2 text-sm font-medium text-primary hover:underline"
        >
          Ver movimientos →
        </Link>
      </div>

      {goal && (
        <div className="flex flex-col gap-2 rounded-[10px] border border-border bg-[#F8FAFC] px-3.5 py-3">
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="text-text-muted">Meta vinculada</span>
            <strong className="text-right text-text-primary">
              {goal.name} · {progress} %
            </strong>
          </div>
          <div className="h-2 rounded-full bg-[#D1D5DB]">
            <div
              data-testid="goal-progress"
              className="h-2 rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div>
        <strong className="text-sm text-text-primary">Últimos movimientos</strong>
        {movements.map((movement) => (
          <div
            key={movement.id}
            className="flex justify-between gap-3 border-t border-border py-2.5 text-sm"
          >
            <span className="text-text-secondary">
              {formatMovementDate(movement.date)} · {movement.description}
            </span>
            <strong className="shrink-0 whitespace-nowrap">
              <span className={movement.amount >= 0 ? "text-income" : "text-expense"}>
                {formatSignedAmount(movement.amount)}
              </span>{" "}
              <span>€</span>
            </strong>
          </div>
        ))}
        {movements.length === 0 && (
          <p className="border-t border-border py-2.5 text-sm text-text-muted">
            Todavía no hay movimientos en esta cuenta.
          </p>
        )}
      </div>
    </section>
  );
}
