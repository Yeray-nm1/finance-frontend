"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { Subscription, SubscriptionCandidate } from "@/types";
import { formatCurrency } from "@/lib/format";

const freqLabels: Record<string, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [candidates, setCandidates] = useState<SubscriptionCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newFrequency, setNewFrequency] = useState("monthly");
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);

  function loadData() {
    setLoading(true);
    setError(null);
    Promise.all([
      api.subscriptions.list(),
      api.subscriptions.detect().then((r) => r.candidates).catch(() => []),
    ])
      .then(([subs, cands]) => {
        setSubscriptions(subs);
        setCandidates(cands);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newAmount) return;
    setSaving(true);
    try {
      await api.subscriptions.create({
        name: newName.trim(),
        amount: Number(newAmount),
        frequency: newFrequency,
      });
      setNewName("");
      setNewAmount("");
      setNewFrequency("monthly");
      setDialogOpen(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear suscripción");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.subscriptions.delete(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar suscripción");
    }
  }

  async function handleDetect() {
    setDetecting(true);
    try {
      const res = await api.subscriptions.detect();
      setCandidates(res.candidates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al detectar suscripciones");
    } finally {
      setDetecting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-text-muted">Cargando...</p>
        </div>
      </main>
    );
  }

  if (error && subscriptions.length === 0) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-expense">{error}</p>
          <button onClick={loadData} className="text-primary text-sm hover:underline mt-2">
            Reintentar
          </button>
        </div>
      </main>
    );
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
            <Button variant="outline" onClick={handleDetect} disabled={detecting}>
              <Sparkles className="size-4" /> {detecting ? "Detectando..." : "Detectar"}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="size-4" /> Anadir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Suscripcion</DialogTitle>
                  <DialogDescription>
                    Anade un pago recurrente manual
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      placeholder="Ej: Netflix"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Importe</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frecuencia</Label>
                    <Select defaultValue="monthly" value={newFrequency} onValueChange={setNewFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? "Creando..." : "Crear"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {candidates.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-4">
              Candidatos detectados
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              {candidates.map((c) => (
                <Card key={c.name}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-sm text-text-primary">{c.name}</h3>
                        <p className="text-xs text-text-muted mt-0.5">
                          {formatCurrency(c.amount)} · {freqLabels[c.frequency]} ·{" "}
                          {Math.round(c.confidence * 100)}% confianza
                        </p>
                      </div>
                      <Button size="sm">Aceptar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <Card key={sub.id}>
              <CardContent className="p-5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <h3 className="font-medium text-sm text-text-primary">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        {formatCurrency(sub.amount)} · {freqLabels[sub.frequency]}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      sub.source === "manual"
                        ? "bg-[#d9eaf7] text-[#005696]"
                        : "badge-warning"
                    }`}>
                      {sub.source === "manual" ? "Manual" : "Detectada"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)}>
                      <Trash2 className="size-4 text-expense" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
