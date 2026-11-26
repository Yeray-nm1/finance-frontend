"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TYPE_LABELS } from "../constants";
import type { AccountListProps } from "./types/AccountList.types";

export function AccountList({
  accounts,
  balances,
  selectedId,
  onSelectAccount,
}: Readonly<AccountListProps>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("es");
    if (!needle) return accounts;
    return accounts.filter((account) =>
      account.name.toLocaleLowerCase("es").includes(needle)
    );
  }, [accounts, query]);

  return (
    <aside className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="p-3">
        <Input
          aria-label="Buscar cuenta"
          placeholder="Buscar cuenta…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 rounded-[10px] px-3.5"
        />
      </div>

      <div
        data-testid="account-list-scroll"
        className="scrollbar-thin max-h-[520px] overflow-y-auto"
      >
        {filtered.map((account) => {
          const selected = account.id === selectedId;

          return (
            <button
              key={account.id}
              type="button"
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelectAccount(account.id)}
              className={cn(
                "flex min-h-14 w-full items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-left transition-colors hover:bg-bg-elevated",
                selected && "bg-[#F0F7FD] hover:bg-[#F0F7FD]"
              )}
              style={selected ? { borderLeft: "3px solid #0B4F8A" } : undefined}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-text-primary">
                  {account.name}
                </div>
                <div className="text-xs text-text-muted">
                  {TYPE_LABELS[account.type] ?? account.type}
                </div>
              </div>
              <strong className="shrink-0 text-sm font-semibold text-text-primary">
                {formatCurrency(balances[account.id] ?? 0)}
              </strong>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="border-t border-border p-4 text-sm text-text-muted">
            No se encontraron cuentas
          </p>
        )}
      </div>
    </aside>
  );
}
