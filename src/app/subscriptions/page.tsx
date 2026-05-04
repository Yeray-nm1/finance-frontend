"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import type { Subscription, SubscriptionCandidate } from "@/types";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [candidates, setCandidates] = useState<SubscriptionCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
  });
  const { isAuthenticated } = useAuth();

  async function loadData() {
    try {
      const data = await api.subscriptions.list();
      setSubscriptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await api.subscriptions.update(editing.id, {
          name: form.name,
          amount: parseFloat(form.amount),
          frequency: form.frequency,
        });
      } else {
        await api.subscriptions.create({
          name: form.name,
          amount: parseFloat(form.amount),
          frequency: form.frequency,
        });
      }
      setForm({ name: "", amount: "", frequency: "monthly" });
      setEditing(null);
      setDialogOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("¿Eliminar esta suscripción?")) {
      await api.subscriptions.delete(id);
      loadData();
    }
  }

  async function handleDetect() {
    setDetecting(true);
    try {
      const data = await api.subscriptions.detect();
      setCandidates(data.candidates);
    } catch (err) {
      console.error(err);
    } finally {
      setDetecting(false);
    }
  }

  async function handleAutoDetect() {
    if (confirm("¿Auto-detectar y guardar suscripciones?")) {
      try {
        const result = await api.subscriptions.autoDetect();
        alert(`Detectadas ${result.detected} suscripciones`);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function acceptCandidate(candidate: SubscriptionCandidate) {
    try {
      await api.subscriptions.create({
        name: candidate.name,
        amount: candidate.amount,
        frequency: candidate.frequency,
      });
      setCandidates((prev) => prev.filter((c) => c.name !== candidate.name));
      loadData();
    } catch (err) {
      console.error(err);
    }
  }

  function openEdit(sub: Subscription) {
    setEditing(sub);
    setForm({
      name: sub.name,
      amount: String(sub.amount),
      frequency: sub.frequency,
    });
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <p className="font-serif text-xl text-gray-400">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-gray-800">
            Suscripciones
          </h1>
          <p className="text-gray-500 mt-1">Gestiona tus pagos recurrentes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDetect} disabled={detecting}>
            <Sparkles className="size-4" /> Detectar
          </Button>
          <Button variant="outline" onClick={handleAutoDetect}>
            Auto-detectar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditing(null);
                  setForm({ name: "", amount: "", frequency: "monthly" });
                }}
              >
                <Plus className="size-4" /> Añadir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Editar Suscripción" : "Nueva Suscripción"}
                </DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Actualiza los datos de la suscripción"
                    : "Añade un pago recurrente manual"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Ej: Netflix"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Importe</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v) =>
                      setForm({ ...form, frequency: v })
                    }
                  >
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
                <Button type="submit" className="w-full">
                  {editing ? "Actualizar" : "Crear"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Candidates */}
      {candidates.length > 0 && (
        <div className="mb-6">
          <h2 className="font-serif text-xl mb-4">Candidatos Detectados</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {candidates.map((c) => (
              <Card key={c.name}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{c.name}</h3>
                      <p className="text-sm text-gray-400">
                        {formatCurrency(c.amount)} · {c.frequency} ·{" "}
                        {Math.round(c.confidence * 100)}% confianza
                      </p>
                    </div>
                    <Button size="sm" onClick={() => acceptCandidate(c)}>
                      Aceptar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Manual Subscriptions */}
      <div className="space-y-4">
        {subscriptions.length === 0 && (
          <p className="text-gray-400 text-sm">No hay suscripciones</p>
        )}
        {subscriptions.map((sub) => (
          <Card key={sub.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-lg font-medium">
                    {sub.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {formatCurrency(sub.amount)} · {sub.frequency} ·{" "}
                    {sub.source === "manual" ? "Manual" : "Detectada"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(sub)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(sub.id)}
                  >
                    <Trash2 className="size-4 text-coral" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
