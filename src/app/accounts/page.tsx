"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ErrorState } from "@/components/ErrorState";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Account } from "@/types/accounts";
import { AccountDialog } from "./components/AccountDialog";

const TYPE_LABELS: Record<Account["type"], string> = {
  checking: "Cuenta corriente",
  savings: "Ahorro",
};

function AccountsSkeleton() {
  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 h-12 w-56 animate-pulse rounded-md bg-bg-elevated" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-lg border border-border bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await api.accounts.list());
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las cuentas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  function openCreate() {
    setEditingAccount(null);
    setDialogOpen(true);
  }

  function openEdit(account: Account) {
    setEditingAccount(account);
    setDialogOpen(true);
  }

  async function handleSubmit(name: string, type: Account["type"]) {
    setSaving(true);
    try {
      if (editingAccount) {
        const updated = await api.accounts.update(editingAccount.id, { name, type });
        setAccounts((prev) => prev.map((acc) => (acc.id === updated.id ? updated : acc)));
        toast({ title: "Cuenta actualizada" });
      } else {
        const created = await api.accounts.create({ name, type });
        setAccounts((prev) => [created, ...prev]);
        toast({ title: "Cuenta creada" });
      }
      setDialogOpen(false);
      setEditingAccount(null);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "No se pudo guardar la cuenta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.accounts.delete(deleteTarget.id);
      setAccounts((prev) => prev.filter((acc) => acc.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({ title: "Cuenta eliminada" });
    } catch (err) {
      console.error(err);
      toast({ title: "No se pudo eliminar la cuenta", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <AccountsSkeleton />;

  if (error) {
    return <ErrorState message={error} onRetry={loadAccounts} fullPage />;
  }

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Cuentas bancarias</h1>
            <p className="mt-1 text-sm text-text-muted">
              Organiza tus movimientos por cuenta
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Nueva cuenta
          </Button>
        </header>

        {accounts.length === 0 ? (
          <section className="rounded-lg border border-border bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <Wallet className="size-6" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">
              Aún no tienes cuentas
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
              Crea una cuenta para saber de dónde sale cada movimiento.
            </p>
            <Button className="mt-4" onClick={openCreate}>
              <Plus className="size-4" /> Crear mi primera cuenta
            </Button>
          </section>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {accounts.map((account) => (
              <section
                key={account.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-white p-5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 shrink-0 text-text-muted" />
                    <h2 className="truncate text-sm font-semibold text-text-primary">
                      {account.name}
                    </h2>
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    {TYPE_LABELS[account.type] ?? account.type}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${account.name}`}
                    onClick={() => openEdit(account)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar ${account.name}`}
                    onClick={() => setDeleteTarget(account)}
                  >
                    <Trash2 className="size-4 text-expense" />
                  </Button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <AccountDialog
        open={dialogOpen}
        account={editingAccount}
        saving={saving}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAccount(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Eliminar cuenta"
        description={
          <>
            ¿Eliminar «{deleteTarget?.name}»? Los movimientos seguirán existiendo,
            pero se quedarán sin cuenta asignada.
          </>
        }
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </main>
  );
}
