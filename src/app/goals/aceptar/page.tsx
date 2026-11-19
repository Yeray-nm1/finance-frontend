"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { announceGoalContributionLink } from "@/lib/goal-contribution-channel";
import type { PendingGoalContribution } from "@/types/goals";

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "No se pudo procesar la aportación";
}

function AcceptContributionForm({ token }: { readonly token: string | null }) {
  const [pending, setPending] = useState<PendingGoalContribution | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [confirmedAmount, setConfirmedAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [originalAmount, setOriginalAmount] = useState<number | null>(null);
  const [updateSuggestion, setUpdateSuggestion] = useState(false);

  // El enlace del correo abre esta página en una pestaña nueva: avisamos a la
  // pestaña que ya tenía la app abierta. Si confirma que se retira a /goals,
  // esta pestaña se queda con el formulario.
  useEffect(() => {
    if (!token) return;
    return announceGoalContributionLink(token);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let active = true;
    setLoading(true);
    setError(null);
    setAccepted(false);
    setAlreadyAccepted(false);
    setOriginalAmount(null);
    setUpdateSuggestion(false);

    api.goalContributions
      .getPending(token)
      .then((result) => {
        if (!active) return;
        setPending(result);
        setAccountId("");
        setAmount(result.amount == null ? "" : String(result.amount));
        setOriginalAmount(result.amount ?? null);
        const previouslyAccepted = result.status === "accepted";
        setAlreadyAccepted(previouslyAccepted);
        setAccepted(previouslyAccepted);
        setConfirmedAmount(result.amount);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(messageFrom(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const numericAmount = Number(amount);
  const validAmount =
    amount.trim().length > 0 && Number.isFinite(numericAmount) && numericAmount > 0;
  // El importe original no es «una edición»: volver a él deshabilita y desmarca la opción.
  const amountChanged = amount.trim().length > 0 && numericAmount !== originalAmount;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !accountId || !validAmount) return;

    setAccepting(true);
    setError(null);

    try {
      const result = await api.goalContributions.accept(
        token,
        accountId,
        numericAmount,
        updateSuggestion
      );
      setAlreadyAccepted(result.alreadyAccepted);
      setConfirmedAmount(result.amount ?? numericAmount);
      setAccepted(true);
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setAccepting(false);
    }
  }

  const subtitle = pending
    ? `Aportación programada · ${pending.period}`
    : "Aportación programada a una meta de ahorro";
  const heading = accepted
    ? alreadyAccepted
      ? "Ya confirmaste esta aportación"
      : "Aportación confirmada"
    : "Confirma tu aportación";

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="mx-auto max-w-md space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{heading}</h1>
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        </div>

        {error && (
          <div role="alert" className="rounded-md bg-delete-bg px-3 py-2 text-sm text-expense">
            {error}
          </div>
        )}

        {loading && <p className="text-sm text-text-muted">Cargando aportación...</p>}

        {!token && !loading && (
          <p className="text-sm text-text-secondary">
            El enlace no es válido o ha caducado. Solicita uno nuevo desde tus metas.
          </p>
        )}

        {accepted && pending && (
          <section className="space-y-4 rounded-lg border border-border bg-white p-5">
            <p className="text-sm text-text-secondary">
              {alreadyAccepted ? (
                <>
                  Esta aportación ya se hizo anteriormente para el periodo {pending.period}. No
                  se ha vuelto a realizar el movimiento.
                </>
              ) : (
                <>
                  Se ha registrado {formatCurrency(confirmedAmount ?? numericAmount)} en la
                  cuenta de ahorro de «{pending.goalName}».
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/transactions?goalId=${pending.goalId}&month=${pending.period}`}
                className="text-sm font-medium text-primary hover:text-primary-hover"
              >
                Ver movimientos
              </Link>
              <Link
                href="/goals"
                className="text-sm font-medium text-primary hover:text-primary-hover"
              >
                Volver a metas
              </Link>
            </div>
          </section>
        )}

        {pending && !accepted && (
          <section className="space-y-4 rounded-lg border border-border bg-white p-5">
            <p className="rounded-md bg-bg-elevated px-3 py-2 text-xs leading-snug text-text-secondary">
              El aviso no incluye importe: decide ahora cuánto quieres aportar. No se realizará
              el movimiento hasta que confirmes.
            </p>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contribution-amount">Importe de la aportación (€)</Label>
                <Input
                  id="contribution-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setUpdateSuggestion(false);
                  }}
                  required
                />
              </div>

              <label
                className={cn(
                  "flex items-start gap-2.5 text-xs leading-5",
                  amountChanged
                    ? "cursor-pointer text-text-primary"
                    : "cursor-not-allowed text-text-muted opacity-70"
                )}
                title={amountChanged ? undefined : "Edita el importe para activar esta opción"}
              >
                <Checkbox
                  checked={updateSuggestion}
                  disabled={!amountChanged}
                  onCheckedChange={(checked) => setUpdateSuggestion(checked === true)}
                  aria-label="Actualizar el importe para futuras aportaciones"
                />
                Actualizar el importe para futuras aportaciones
              </label>

              <div className="space-y-2">
                <Label htmlFor="contribution-source-account">Cuenta origen</Label>
                <select
                  id="contribution-source-account"
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                  aria-describedby="contribution-source-hint"
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  required
                >
                  <option value="">Elige la cuenta origen</option>
                  {pending.accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                <p id="contribution-source-hint" className="text-xs text-text-muted">
                  El destino es la cuenta de ahorro de la meta y no se puede cambiar.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={accepting || !accountId || !validAmount}
              >
                {accepting ? "Aceptando..." : "Aceptar aportación"}
              </Button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}

function AcceptContributionWithParams() {
  const token = useSearchParams().get("token");
  return <AcceptContributionForm token={token} />;
}

export default function AcceptContributionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-bg-page p-4 md:p-8">
          <p className="text-sm text-text-muted">Cargando aportación...</p>
        </main>
      }
    >
      <AcceptContributionWithParams />
    </Suspense>
  );
}
