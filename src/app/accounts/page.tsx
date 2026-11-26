"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CsvUploadDialog } from "@/components/CsvUploadDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ErrorState } from "@/components/ErrorState";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { buildAccountSummary, getLinkedGoal } from "@/lib/account-summary";
import type { Account } from "@/types/accounts";
import type { SavingsGoal } from "@/types/goals";
import type { Transaction } from "@/types/transactions";
import { AccountDetail } from "./components/AccountDetail";
import { AccountDialog } from "./components/AccountDialog";
import { AccountList } from "./components/AccountList";

function AccountsSkeleton() {
  return (
    <main className="min-h-screen bg-[#F2F2F2] p-4 md:p-8">
      <div className="mx-auto w-full max-w-[1000px]">
        <div className="mb-8 h-12 w-56 animate-pulse rounded-md bg-bg-elevated" />
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <div className="h-72 animate-pulse rounded-xl border border-border bg-white" />
          <div className="h-72 animate-pulse rounded-xl border border-border bg-white" />
        </div>
      </div>
    </main>
  );
}

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loadedAccounts, loadedTransactions, loadedGoals] = await Promise.all([
        api.accounts.list(),
        api.transactions.listAll(),
        api.goals.list(),
      ]);
      setAccounts(loadedAccounts);
      setTransactions(loadedTransactions);
      setGoals(loadedGoals);
      setSelectedId((current) =>
        current && loadedAccounts.some((account) => account.id === current)
          ? current
          : (loadedAccounts[0]?.id ?? null)
      );
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las cuentas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const summary = useMemo(() => buildAccountSummary(transactions), [transactions]);
  const selectedAccount = accounts.find((account) => account.id === selectedId) ?? null;
  const linkedGoal = getLinkedGoal(goals, selectedAccount?.id ?? null);

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
        setSelectedId(created.id);
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
      const deletedId = deleteTarget.id;
      setAccounts((prev) => prev.filter((acc) => acc.id !== deletedId));
      setSelectedId((current) => (current === deletedId ? null : current));
      setDeleteTarget(null);
      toast({ title: "Cuenta eliminada" });
    } catch (err) {
      console.error(err);
      toast({ title: "No se pudo eliminar la cuenta", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  function goToUnassigned() {
    router.push("/transactions?account=Sin+cuenta");
  }

  if (loading) return <AccountsSkeleton />;

  if (error) {
    return <ErrorState message={error} onRetry={loadData} fullPage />;
  }

  return (
    <main className="min-h-screen bg-[#F2F2F2] p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-4">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">
              Cuentas bancarias
            </h1>
            <p className="mt-1.5 text-sm text-text-muted">Tu dinero por cuenta</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              Importar extracto
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Nueva cuenta
            </Button>
          </div>
        </header>

        {summary.unassigned.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-2.5">
            <span className="text-sm text-[#9A3412]">
              {summary.unassigned.length} movimientos sin cuenta asignada
            </span>
            <button
              type="button"
              onClick={goToUnassigned}
              className="text-sm font-medium text-primary hover:underline"
            >
              Asignar →
            </button>
          </div>
        )}

        {accounts.length === 0 ? (
          <section className="rounded-xl border border-border bg-white p-8 text-center">
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
          <div
            data-testid="accounts-layout"
            className="grid w-full max-w-[1000px] grid-cols-1 items-start gap-4 lg:grid-cols-[340px_1fr]"
          >
            <div data-testid="account-list">
              <AccountList
                accounts={accounts}
                balances={summary.balances}
                selectedId={selectedId}
                onSelectAccount={setSelectedId}
              />
            </div>

            {selectedAccount ? (
              <div data-testid="account-detail">
                <AccountDetail
                  account={selectedAccount}
                  balance={summary.balances[selectedAccount.id] ?? 0}
                  goal={linkedGoal}
                  movements={summary.recentByAccount[selectedAccount.id] ?? []}
                  onEdit={() => openEdit(selectedAccount)}
                  onDelete={() => setDeleteTarget(selectedAccount)}
                  onImport={() => setImportOpen(true)}
                />
              </div>
            ) : (
              <section className="rounded-xl border border-border bg-white p-6 text-sm text-text-muted">
                Selecciona una cuenta para ver su detalle.
              </section>
            )}
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
        onSubmit={(name, type) => void handleSubmit(name, type)}
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
        onConfirm={() => void handleDelete()}
      />

      <CsvUploadDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          setImportOpen(false);
          void loadData();
        }}
      />
    </main>
  );
}
