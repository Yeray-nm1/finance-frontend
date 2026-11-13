"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { ErrorState } from "@/components/ErrorState";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { animateRowToTab } from "@/lib/animate-to-tab";
import type { Account } from "@/types/accounts";
import type {
  GoalContributionInput,
  GoalInput,
  SavingsGoal,
} from "@/types/goals";
import { GoalCard } from "./components/GoalCard";
import { GoalDialog } from "./components/GoalDialog";
import { ContributionDialog } from "./components/ContributionDialog";
import { ContributionsDialog } from "./components/ContributionsDialog";

type Tab = "active" | "archived";

function GoalsSkeleton() {
  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 h-12 w-56 animate-pulse rounded-md bg-bg-elevated" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-48 animate-pulse rounded-lg border border-border bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("active");
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [viewingGoal, setViewingGoal] = useState<SavingsGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [goalList, accountList] = await Promise.all([
        api.goals.list(true),
        api.accounts.list(),
      ]);
      setGoals(goalList);
      setAccounts(accountList);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las metas");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadGoals = useCallback(async () => {
    try {
      setGoals(await api.goals.list(true));
    } catch (err) {
      console.error(err);
      toast({ title: "No se pudieron actualizar las metas", variant: "destructive" });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savingsAccounts = useMemo(
    () => accounts.filter((account) => account.type === "savings"),
    [accounts]
  );

  const activeGoals = goals.filter((goal) => !goal.isArchived);
  const archivedGoals = goals.filter((goal) => goal.isArchived);
  const visibleGoals = tab === "active" ? activeGoals : archivedGoals;

  function setGoalArchived(goalId: string, archived: boolean) {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId ? { ...goal, isArchived: archived } : goal
      )
    );
  }

  function animateGoalToTab(goalId: string, archived: boolean) {
    const source = document.querySelector<HTMLElement>(
      `[data-goal-card="${goalId}"]`
    );
    const target = document.querySelector<HTMLElement>(
      `[data-goal-tab="${archived ? "archived" : "active"}"]`
    );
    animateRowToTab(source, target);
  }

  function openCreate() {
    setEditingGoal(null);
    setGoalDialogOpen(true);
  }

  function openEdit(goal: SavingsGoal) {
    setEditingGoal(goal);
    setGoalDialogOpen(true);
  }

  function handleAccountCreated(account: Account) {
    setAccounts((prev) => [...prev, account]);
  }

  async function handleGoalSubmit(input: GoalInput) {
    setSaving(true);

    try {
      if (editingGoal) {
        await api.goals.update(editingGoal.id, input);
        toast({ title: "Meta actualizada" });
      } else {
        await api.goals.create(input);
        toast({ title: "Meta creada" });
        setTab("active");
      }

      setGoalDialogOpen(false);
      setEditingGoal(null);
      await loadGoals();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "No se pudo guardar la meta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleContribute(input: GoalContributionInput) {
    if (!contributingGoal) return;

    setSaving(true);

    try {
      await api.goals.contribute(contributingGoal.id, input);
      toast({ title: "Aportación registrada" });
      setContributingGoal(null);
      await loadGoals();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "No se pudo registrar la aportación",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleArchive(goal: SavingsGoal) {
    const nextArchived = !goal.isArchived;

    animateGoalToTab(goal.id, nextArchived);
    setGoalArchived(goal.id, nextArchived);

    try {
      await api.goals.update(goal.id, { isArchived: nextArchived });
      toast({ title: nextArchived ? "Meta archivada" : "Meta reactivada" });
    } catch (err) {
      setGoalArchived(goal.id, goal.isArchived);
      toast({
        title: err instanceof Error ? err.message : "No se pudo archivar la meta",
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await api.goals.delete(deleteTarget.id);
      setDeleteTarget(null);
      toast({ title: "Meta eliminada" });
      await loadGoals();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "No se pudo eliminar la meta",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <GoalsSkeleton />;

  if (error) {
    return <ErrorState message={error} onRetry={load} fullPage />;
  }

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Metas de ahorro</h1>
            <p className="mt-1 text-sm text-text-muted">
              Define un objetivo y registra tus aportaciones
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Nueva meta
          </Button>
        </header>

        <div
          className="mb-4 flex gap-1"
          role="tablist"
          aria-label="Metas de ahorro"
        >
          <button
            type="button"
            role="tab"
            data-goal-tab="active"
            aria-selected={tab === "active"}
            onClick={() => setTab("active")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "active"
                ? "bg-primary text-white"
                : "border border-border bg-white text-text-secondary hover:bg-bg-elevated"
            }`}
          >
            Activas ({activeGoals.length})
          </button>
          <button
            type="button"
            role="tab"
            data-goal-tab="archived"
            aria-selected={tab === "archived"}
            onClick={() => setTab("archived")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "archived"
                ? "bg-primary text-white"
                : "border border-border bg-white text-text-secondary hover:bg-bg-elevated"
            }`}
          >
            Archivadas ({archivedGoals.length})
          </button>
        </div>

        {visibleGoals.length === 0 ? (
          <section className="rounded-lg border border-border bg-white p-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-light text-primary">
              <Target className="size-6" strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">
              {tab === "active"
                ? "Aún no tienes metas de ahorro"
                : "No hay metas archivadas"}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
              {tab === "active"
                ? "Crea una meta y registra aportaciones para seguir tu progreso."
                : "Las metas que archives aparecerán aquí."}
            </p>
            {tab === "active" && (
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="size-4" /> Crear mi primera meta
              </Button>
            )}
          </section>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onContribute={setContributingGoal}
                onEdit={openEdit}
                onToggleArchive={(item) => void handleToggleArchive(item)}
                onDelete={setDeleteTarget}
                onViewContributions={setViewingGoal}
              />
            ))}
          </div>
        )}
      </div>

      <GoalDialog
        open={goalDialogOpen}
        goal={editingGoal}
        accounts={savingsAccounts}
        saving={saving}
        onOpenChange={(open) => {
          setGoalDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
        onSubmit={(input) => void handleGoalSubmit(input)}
        onAccountCreated={handleAccountCreated}
      />

      <ContributionDialog
        open={contributingGoal !== null}
        goal={contributingGoal}
        accounts={accounts}
        saving={saving}
        onOpenChange={(open) => {
          if (!open) setContributingGoal(null);
        }}
        onSubmit={(input) => void handleContribute(input)}
        onAccountCreated={handleAccountCreated}
      />

      <ContributionsDialog
        open={viewingGoal !== null}
        goal={viewingGoal}
        onOpenChange={(open) => {
          if (!open) setViewingGoal(null);
        }}
        onChanged={() => void loadGoals()}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Eliminar meta"
        description={
          <>
            ¿Eliminar «{deleteTarget?.name}»? Las aportaciones seguirán existiendo
            como transferencias, pero dejarán de estar vinculadas a la meta.
          </>
        }
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </main>
  );
}
