"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
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
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");

  // El enlace del correo abre esta página en una pestaña nueva: avisamos a la
  // pestaña que ya tenía la app abierta para que también venga a aceptar.
  useEffect(() => {
    if (token) announceGoalContributionLink(token);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let active = true;
    setLoading(true);
    setError(null);
    setAccepted(false);

    api.goalContributions
      .getPending(token)
      .then((result) => {
        if (!active) return;
        setPending(result);
        setAccountId("");
        if (result.status === "accepted") setAccepted(true);
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !accountId) return;

    setAccepting(true);
    setError(null);

    try {
      await api.goalContributions.accept(token, accountId);
      setAccepted(true);
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setAccepting(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="mx-auto max-w-md space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {accepted ? "Aportación confirmada" : "Confirma tu aportación"}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Aportación programada a una meta de ahorro
          </p>
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
              Se ha registrado {formatCurrency(pending.amount)} en la cuenta de ahorro de
              «{pending.goalName}».
            </p>
            <Link
              href="/goals"
              className="inline-block text-sm font-medium text-primary hover:text-primary-hover"
            >
              Volver a metas
            </Link>
          </section>
        )}

        {pending && !accepted && (
          <section className="space-y-4 rounded-lg border border-border bg-white p-5">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Meta</dt>
                <dd className="font-medium text-text-primary">{pending.goalName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Periodo</dt>
                <dd className="font-medium text-text-primary">{pending.period}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Importe</dt>
                <dd className="font-semibold text-text-primary">
                  {formatCurrency(pending.amount)}
                </dd>
              </div>
            </dl>

            <p className="rounded-md bg-bg-elevated px-3 py-2 text-xs leading-snug text-text-secondary">
              No se cobrará nada sin tu confirmación. Si no aceptas, el importe no se acumulará
              al mes siguiente.
            </p>

            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={accepting || !accountId}>
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
