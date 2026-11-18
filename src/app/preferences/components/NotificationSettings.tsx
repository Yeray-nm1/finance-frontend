"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ChartColumn, ChevronDown, Mail, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type {
  DaysBefore,
  NotificationRules,
  SummaryFrequency,
} from "@/types/notifications";

const DEFAULT_RULES: NotificationRules = {
  subscriptionDue: { enabled: false, emailEnabled: false, daysBefore: 3 },
  spendingSummary: { enabled: false, emailEnabled: false, frequency: "weekly" },
  goalReminder: { enabled: false, emailEnabled: false },
};

/** Las reglas guardadas antes de existir el recordatorio no traen goalReminder. */
function normalizeRules(loaded: Partial<NotificationRules>): NotificationRules {
  return {
    subscriptionDue: loaded.subscriptionDue ?? DEFAULT_RULES.subscriptionDue,
    spendingSummary: loaded.spendingSummary ?? DEFAULT_RULES.spendingSummary,
    goalReminder: loaded.goalReminder ?? DEFAULT_RULES.goalReminder,
  };
}

interface NotificationSettingsProps {
  /** Correo de la cuenta, en modo lectura: no se puede editar ni verificar aquí. */
  email?: string;
}

export function NotificationSettings({ email }: NotificationSettingsProps) {
  const [rules, setRules] = useState<NotificationRules>(DEFAULT_RULES);
  const [savedRules, setSavedRules] = useState<NotificationRules>(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // El enlace de baja del correo redirige aquí con este marcador.
    if (new URLSearchParams(window.location.search).get("unsubscribed") === "1") {
      toast({
        title: "Suscripción por email desactivada",
        description: "Ya no recibirás avisos por correo. Puedes volver a activarlos aquí.",
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.notifications.rules
      .get()
      .then((loaded) => {
        if (!active) return;
        const normalized = normalizeRules(loaded);
        setRules(normalized);
        setSavedRules(normalized);
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
  const emailCount =
    Number(rules.subscriptionDue.emailEnabled) +
    Number(rules.spendingSummary.emailEnabled) +
    Number(rules.goalReminder.emailEnabled);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = normalizeRules(await api.notifications.rules.save(rules));
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

  if (loading) {
    return <p className="text-sm text-text-muted">Cargando preferencias...</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-border bg-bg-elevated/60 px-3 py-2.5 text-xs leading-snug text-text-muted">
        <Mail size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          Los avisos por correo se envían a{" "}
          <span className="font-medium text-text-secondary">
            {email ?? "tu correo de cuenta"}
          </span>
          .
        </span>
      </div>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
        <section>
          <div className="flex items-center gap-3 p-4">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors",
                rules.subscriptionDue.enabled
                  ? "bg-primary-light text-primary"
                  : "bg-bg-elevated text-text-muted"
              )}
              aria-hidden="true"
            >
              <CalendarClock size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-text-primary">
                Suscripción próxima
              </h3>
              <p className="mt-0.5 text-xs leading-snug text-text-muted">
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
          <div className="flex items-center gap-3 border-t border-border bg-bg-elevated/60 px-4 py-2.5">
            <span className="w-9 shrink-0" aria-hidden="true" />
            <label
              htmlFor="notification-days-before"
              className="min-w-0 flex-1 cursor-pointer text-xs font-medium text-text-secondary"
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
              <SelectTrigger
                id="notification-days-before"
                className="h-9 w-36 shrink-0 border-border/70 bg-white text-xs shadow-sm sm:text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 día antes</SelectItem>
                <SelectItem value="3">3 días antes</SelectItem>
                <SelectItem value="7">7 días antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 p-4">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors",
                rules.spendingSummary.enabled
                  ? "bg-primary-light text-primary"
                  : "bg-bg-elevated text-text-muted"
              )}
              aria-hidden="true"
            >
              <ChartColumn size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-text-primary">
                Resumen de gastos
              </h3>
              <p className="mt-0.5 text-xs leading-snug text-text-muted">
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
          <div className="flex items-center gap-3 border-t border-border bg-bg-elevated/60 px-4 py-2.5">
            <span className="w-9 shrink-0" aria-hidden="true" />
            <label
              htmlFor="notification-summary-frequency"
              className="min-w-0 flex-1 cursor-pointer text-xs font-medium text-text-secondary"
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
                className="h-9 w-36 shrink-0 border-border/70 bg-white text-xs shadow-sm sm:text-sm"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 p-4">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-[10px] transition-colors",
                rules.goalReminder.enabled
                  ? "bg-primary-light text-primary"
                  : "bg-bg-elevated text-text-muted"
              )}
              aria-hidden="true"
            >
              <Target size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-text-primary">
                Recordatorio mensual de metas
              </h3>
              <p className="mt-0.5 text-xs leading-snug text-text-muted">
                Te avisamos el día elegido en cada meta para confirmar tu aportación manual.
              </p>
            </div>
            <Switch
              aria-label="Activar recordatorio mensual de metas"
              checked={rules.goalReminder.enabled}
              onCheckedChange={(enabled) =>
                setRules((prev) => ({
                  ...prev,
                  goalReminder: { ...prev.goalReminder, enabled },
                }))
              }
            />
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 p-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-bg-elevated text-text-muted" aria-hidden="true">
              <Mail size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-text-primary">Correo electrónico</h3>
              <p className="mt-0.5 text-xs leading-snug text-text-muted">
                Recibe también por email los avisos que tengas activados.
              </p>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5 px-2.5 text-xs">
                  Correo: {emailCount === 0 ? "Desactivado" : `${emailCount} activo${emailCount === 1 ? "" : "s"}`}
                  <ChevronDown size={14} aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-2">
                <p className="px-2 pb-1.5 text-xs font-medium text-text-secondary">
                  Enviar también por email
                </p>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs text-text-primary hover:bg-bg-elevated">
                  <Checkbox
                    aria-label="Enviar aviso de suscripción próxima por email"
                    checked={rules.subscriptionDue.emailEnabled}
                    onCheckedChange={(value) =>
                      setRules((prev) => ({
                        ...prev,
                        subscriptionDue: { ...prev.subscriptionDue, emailEnabled: value === true },
                      }))
                    }
                  />
                  Suscripciones
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs text-text-primary hover:bg-bg-elevated">
                  <Checkbox
                    aria-label="Enviar resumen de gastos por email"
                    checked={rules.spendingSummary.emailEnabled}
                    onCheckedChange={(value) =>
                      setRules((prev) => ({
                        ...prev,
                        spendingSummary: { ...prev.spendingSummary, emailEnabled: value === true },
                      }))
                    }
                  />
                  Resumen de gastos
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs text-text-primary hover:bg-bg-elevated">
                  <Checkbox
                    aria-label="Enviar recordatorio de metas por email"
                    checked={rules.goalReminder.emailEnabled}
                    onCheckedChange={(value) =>
                      setRules((prev) => ({
                        ...prev,
                        goalReminder: { ...prev.goalReminder, emailEnabled: value === true },
                      }))
                    }
                  />
                  Recordatorio de metas
                </label>
              </PopoverContent>
            </Popover>
          </div>
        </section>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          onClick={() => void handleSave()}
          disabled={!dirty || saving}
          className="w-full sm:w-auto"
        >
          {saving ? "Guardando..." : "Guardar preferencias"}
        </Button>
      </div>
    </div>
  );
}
