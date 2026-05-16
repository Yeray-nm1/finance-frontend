"use client";

import { useState } from "react";
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
import { MOCK_SUBSCRIPTIONS, MOCK_SUBSCRIPTION_CANDIDATES } from "@/lib/mock-data";
import type { Subscription, SubscriptionCandidate } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

const freqLabels: Record<string, string> = {
  weekly: "Semanal",
  monthly: "Mensual",
  yearly: "Anual",
};

export default function SubscriptionsPage() {
  const [subscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);
  const [candidates] = useState<SubscriptionCandidate[]>(MOCK_SUBSCRIPTION_CANDIDATES);
  const [dialogOpen, setDialogOpen] = useState(false);

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
            <Button variant="outline">
              <Sparkles className="size-4" /> Detectar
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
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input placeholder="Ej: Netflix" />
                  </div>
                  <div className="space-y-2">
                    <Label>Importe</Label>
                    <Input type="number" step="0.01" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Frecuencia</Label>
                    <Select defaultValue="monthly">
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
                    Crear
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Candidates */}
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

        {/* Subscriptions */}
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
                    <Button variant="ghost" size="icon">
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
