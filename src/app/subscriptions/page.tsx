"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Subscription } from "@/types/subscriptions";
import { SubscriptionListContent } from "./components/SubscriptionListContent";
import { DetectCandidatesModal } from "./components/DetectCandidatesModal";
import { EditSubscriptionDialog } from "./components/EditSubscriptionDialog";
import { CreateSubscriptionDialog } from "./components/CreateSubscriptionDialog";
import { SubscriptionHistoryDialog } from "./components/SubscriptionHistoryDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { toast } from "@/hooks/use-toast";
import { animateRowToTab } from "@/lib/animate-to-tab";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detectOpen, setDetectOpen] = useState(false);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [deleteSub, setDeleteSub] = useState<Subscription | null>(null);
  const [historySub, setHistorySub] = useState<Subscription | null>(null);

  function loadData() {
    setLoading(true);
    setError(null);
    api.subscriptions.list()
      .then((subs) => setSubscriptions(subs))
      .catch((err) => {
        console.error(err);
        setError("No se pudieron cargar las suscripciones");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleDelete() {
    if (!deleteSub) return;
    try {
      await api.subscriptions.delete(deleteSub.id);
      setDeleteSub(null);
      loadData();
    } catch (err) {
      console.error(err);
      setError("Error al eliminar suscripción");
      setDeleteSub(null);
    }
  }

  function setSubscriptionActive(subId: string, active: boolean) {
    setSubscriptions((prev) =>
      prev.map((sub) => (sub.id === subId ? { ...sub, active } : sub))
    );
  }

  function animateSubscriptionToTab(subId: string, active: boolean) {
    const source = document.querySelector<HTMLElement>(
      `[data-subscription-row="${subId}"]`
    );
    const target = document.querySelector<HTMLElement>(
      `[data-subscription-tab="${active ? "active" : "cancelled"}"]`
    );
    animateRowToTab(source, target);
  }

  async function handleToggleActive(sub: Subscription) {
    const nextActive = sub.active === false;

    animateSubscriptionToTab(sub.id, nextActive);
    setSubscriptionActive(sub.id, nextActive);

    try {
      await api.subscriptions.update(sub.id, { active: nextActive });
      toast({
        title: nextActive ? "Suscripción reactivada" : "Suscripción cancelada",
        actionLabel: "Deshacer",
        onAction: async () => {
          const previousActive = !nextActive;
          animateSubscriptionToTab(sub.id, previousActive);
          setSubscriptionActive(sub.id, previousActive);
          try {
            await api.subscriptions.update(sub.id, { active: previousActive });
            toast({ title: "Cambios deshechos" });
          } catch (err) {
            console.error(err);
            setSubscriptionActive(sub.id, nextActive);
            toast({ title: "No se pudo deshacer", variant: "destructive" });
          }
        },
      });
    } catch (err) {
      console.error(err);
      setSubscriptionActive(sub.id, !nextActive);
      setError("Error al cambiar el estado de la suscripción");
    }
  }

  async function handleUpdateAmount(sub: Subscription, amount: number) {
    try {
      await api.subscriptions.update(sub.id, { amount });
      loadData();
    } catch (err) {
      console.error(err);
      setError("Error al actualizar importe");
    }
  }

  async function handleDismissPriceChange(sub: Subscription) {
    try {
      await api.subscriptions.dismissPriceChanges(sub.id);
      loadData();
    } catch (err) {
      console.error(err);
      setError("Error al descartar cambio de precio");
    }
  }

  function handleDetectConfirm() {
    setDetectOpen(false);
    loadData();
  }

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">
              Suscripciones
            </h1>
            <p className="text-sm text-text-muted mt-1">Gestiona tus pagos recurrentes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDetectOpen(true)}>
              <Sparkles className="size-4" /> Detectar
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> Anadir
            </Button>
            <CreateSubscriptionDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              onCreated={() => { setCreateOpen(false); loadData(); }}
              existingNames={subscriptions.map((s) => s.name)}
            />
          </div>
        </div>

        <SubscriptionListContent
          loading={loading}
          error={error}
          subscriptions={subscriptions}
          onRetry={loadData}
          onDismissError={() => setError(null)}
          onEdit={setEditSub}
          onDelete={setDeleteSub}
          onToggleActive={handleToggleActive}
          onHistory={setHistorySub}
          onUpdateAmount={handleUpdateAmount}
          onDismissPriceChange={handleDismissPriceChange}
        />
        
        <DetectCandidatesModal
          open={detectOpen}
          onOpenChange={setDetectOpen}
          onConfirm={handleDetectConfirm}
        />

        {editSub && (
          <EditSubscriptionDialog
            subscription={editSub}
            existingNames={subscriptions.map((s) => s.name)}
            open={true}
            onOpenChange={(open) => { if (!open) setEditSub(null); }}
            onSaved={() => { setEditSub(null); loadData(); }}
          />
        )}

        <ConfirmDeleteDialog
          open={deleteSub !== null}
          title="Eliminar suscripcion"
          description={<>Se eliminará &quot;{deleteSub?.name}&quot; y se desvincularán sus transacciones. Esta acción no se puede deshacer.</>}
          onConfirm={handleDelete}
          onCancel={() => setDeleteSub(null)}
        />

        <SubscriptionHistoryDialog
          subscription={historySub}
          open={historySub !== null}
          onOpenChange={(open) => { if (!open) setHistorySub(null); }}
        />
      </div>
    </main>
  );
}
