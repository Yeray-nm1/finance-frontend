"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type {
  DaysBefore,
  NotificationRules,
  SummaryFrequency,
} from "@/types/notifications";

const DEFAULT_RULES: NotificationRules = {
  subscriptionDue: { enabled: false, daysBefore: 3 },
  spendingSummary: { enabled: false, frequency: "weekly" },
};

export function NotificationSettings() {
  const [rules, setRules] = useState<NotificationRules>(DEFAULT_RULES);
  const [savedRules, setSavedRules] = useState<NotificationRules>(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api.notifications.rules
      .get()
      .then((loaded) => {
        if (!active) return;
        setRules(loaded);
        setSavedRules(loaded);
      })
      .catch(() => {
        // Si no se pueden cargar, se muestran los valores por defecto.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const dirty = JSON.stringify(rules) !== JSON.stringify(savedRules);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.notifications.rules.save(rules);
      setRules(updated);
      setSavedRules(updated);
      toast({ title: "Preferencias de notificaciones guardadas" });
    } catch {
      toast({
        title: "No se pudieron guardar las preferencias",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-sm text-text-muted">Cargando preferencias...</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            <div>
              <p className="text-sm text-text-primary">Suscripción próxima</p>
              <p className="text-xs text-text-muted mt-0.5">
                Avisa antes de que se cobre una suscripción activa.
              </p>
            </div>
            <Switch
              aria-label="Activar aviso de suscripción próxima"
              checked={rules.subscriptionDue.enabled}
              onCheckedChange={(enabled) =>
                setRules((prev) => ({
                  ...prev,
                  subscriptionDue: { ...prev.subscriptionDue, enabled },
                }))
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="notification-days-before"
              className="text-sm text-text-primary"
            >
              Avisar con
            </label>
            <Select
              value={String(rules.subscriptionDue.daysBefore)}
              onValueChange={(value) =>
                setRules((prev) => ({
                  ...prev,
                  subscriptionDue: {
                    ...prev.subscriptionDue,
                    daysBefore: Number(value) as DaysBefore,
                  },
                }))
              }
            >
              <SelectTrigger id="notification-days-before" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 día antes</SelectItem>
                <SelectItem value="3">3 días antes</SelectItem>
                <SelectItem value="7">7 días antes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
            <div>
              <p className="text-sm text-text-primary">Resumen de gastos</p>
              <p className="text-xs text-text-muted mt-0.5">
                Recibe un resumen periódico de tus gastos.
              </p>
            </div>
            <Switch
              aria-label="Activar resumen de gastos"
              checked={rules.spendingSummary.enabled}
              onCheckedChange={(enabled) =>
                setRules((prev) => ({
                  ...prev,
                  spendingSummary: { ...prev.spendingSummary, enabled },
                }))
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="notification-summary-frequency"
              className="text-sm text-text-primary"
            >
              Frecuencia
            </label>
            <Select
              value={rules.spendingSummary.frequency}
              onValueChange={(value) =>
                setRules((prev) => ({
                  ...prev,
                  spendingSummary: {
                    ...prev.spendingSummary,
                    frequency: value as SummaryFrequency,
                  },
                }))
              }
            >
              <SelectTrigger
                id="notification-summary-frequency"
                className="w-36"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end pt-3 border-t border-border">
            <Button onClick={() => void handleSave()} disabled={!dirty || saving}>
              {saving ? "Guardando..." : "Guardar preferencias"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
