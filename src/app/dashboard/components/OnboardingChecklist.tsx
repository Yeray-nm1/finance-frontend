"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { api } from "@/lib/api";

interface OnboardingState {
  ready: boolean;
  hasAccounts: boolean;
  hasTransactions: boolean;
  hasBudget: boolean;
}

const EMPTY_STATE: OnboardingState = {
  ready: false,
  hasAccounts: false,
  hasTransactions: false,
  hasBudget: false,
};

export function OnboardingChecklist() {
  const [state, setState] = useState<OnboardingState>(EMPTY_STATE);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const now = new Date();

    Promise.all([
      api.accounts.list(),
      api.transactions.list({ page: 1, limit: 1 }),
      api.budgets.monthly.get(now.getMonth() + 1, now.getFullYear()),
    ])
      .then(([accounts, transactions, budget]) => {
        if (!active) return;
        setState({
          ready: true,
          hasAccounts: accounts.length > 0,
          hasTransactions: transactions.total > 0,
          hasBudget: budget !== null,
        });
      })
      .catch(() => {
        if (active) setState((prev) => ({ ...prev, ready: false }));
      });

    return () => {
      active = false;
    };
  }, []);

  if (!state.ready) return null;

  const steps = [
    {
      label: "Crea tu cuenta",
      done: state.hasAccounts,
      href: "/accounts",
      cta: "Gestionar cuentas",
    },
    {
      label: "Añade o importa un movimiento",
      done: state.hasTransactions,
      href: "/transactions",
      cta: "Ir a movimientos",
    },
    {
      label: "Define tu presupuesto",
      done: state.hasBudget,
      href: "/budgets",
      cta: "Definir presupuesto",
    },
  ];

  const completed = steps.filter((step) => step.done).length;
  if (completed === steps.length) return null;

  return (
    <section
      aria-labelledby="onboarding-title"
      className={`mb-4 rounded-lg border border-border bg-white animate-fade-in ${
        open ? "p-5" : "px-3 py-2"
      }`}
    >
      <div className={`flex flex-wrap items-center justify-between gap-2 ${open ? "mb-3" : ""}`}>
        <div>
          <div className="flex items-center gap-1.5">
            <h2
              id="onboarding-title"
              className={`font-semibold ${
                open ? "text-sm text-text-primary" : "text-xs text-text-muted"
              }`}
            >
              Primeros pasos
            </h2>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-controls="onboarding-steps"
              aria-label={open ? "Contraer primeros pasos" : "Desplegar primeros pasos"}
              className="rounded p-0.5 text-text-muted transition-colors hover:bg-bg-elevated hover:text-primary"
            >
              {open ? (
                <ChevronUp className="size-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
          <p className={`text-text-muted ${open ? "mt-0.5 text-xs" : "text-[11px]"}`}>
            {completed} de {steps.length} completados
          </p>
        </div>
        <div className="flex items-center gap-1" aria-hidden="true">
          {steps.map((step) => (
            <span
              key={step.label}
              className={`rounded-full ${
                open ? "h-1.5 w-8" : "h-1 w-5"
              } ${step.done ? "bg-primary" : "bg-bg-elevated"}`}
            />
          ))}
        </div>
      </div>

      {open && (
        <ol id="onboarding-steps" className="space-y-1">
          {steps.map((step) => (
            <li key={step.label}>
              <Link
                href={step.href}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm no-underline transition-colors hover:bg-bg-elevated"
              >
                {step.done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-income" aria-hidden="true" />
                ) : (
                  <Circle className="size-5 shrink-0 text-text-muted" aria-hidden="true" />
                )}
                <span
                  className={`min-w-0 flex-1 ${
                    step.done ? "text-text-muted line-through" : "text-text-primary"
                  }`}
                >
                  {step.label}
                </span>
                {!step.done && (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                    {step.cta}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
