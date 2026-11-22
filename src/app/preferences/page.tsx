"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/Card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ChangePasswordDialog } from "./components/ChangePasswordDialog";
import { DeleteAccountDialog } from "./components/DeleteAccountDialog";
import { DeleteDataDialog } from "./components/DeleteDataDialog";
import { NotificationSettings } from "./components/NotificationSettings";

type PreferenceTab = "profile" | "notifications";

const TABS: ReadonlyArray<{ key: PreferenceTab; label: string }> = [
  { key: "profile", label: "Perfil" },
  { key: "notifications", label: "Notificaciones" },
];

/** Los espacios cuentan como uno y no cambios: "Ana   Pérez" ≡ "Ana Pérez". */
function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export default function PreferencesPage() {
  const { user, logout, updateName } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PreferenceTab>("profile");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [nameDraft, setNameDraft] = useState(user?.name ?? "");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setDisplayName(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("focus") === "goalReminder" || params.get("unsubscribed") === "1") {
      setActiveTab("notifications");
    }
  }, []);

  const normalizedDraft = normalizeName(nameDraft);
  const spacesOnly = nameDraft.length > 0 && nameDraft.trim().length === 0;
  const nameChanged = normalizedDraft !== normalizeName(displayName);
  const canSaveName = !savingName && nameChanged && !spacesOnly;

  function startEditingName() {
    setNameDraft(displayName);
    setEditingName(true);
  }

  function cancelEditingName() {
    setNameDraft(displayName);
    setEditingName(false);
  }

  async function handleSaveName() {
    if (!canSaveName) return;
    setSavingName(true);
    try {
      await updateName(normalizedDraft);
      setDisplayName(normalizedDraft);
      setEditingName(false);
      toast({ title: "Nombre actualizado" });
    } catch {
      toast({ title: "No se pudo guardar el nombre", variant: "destructive" });
    } finally {
      setSavingName(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 animate-fade-in">
          <h1 className="text-xl font-semibold text-text-primary">Preferencias</h1>
          <p className="mt-1 text-sm text-text-muted">
            Gestiona tu perfil y tus notificaciones
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Secciones de preferencias"
          className="mb-4 flex gap-4 border-b border-border"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`preferences-tab-${tab.key}`}
              aria-selected={activeTab === tab.key}
              aria-controls={`preferences-panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "-mb-px shrink-0 whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-primary text-text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          id={`preferences-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`preferences-tab-${activeTab}`}
          className="animate-fade-in"
        >
          {activeTab === "profile" && (
            <div className="space-y-4">
              <Card className="px-5 py-2">
                <h2 className="py-3 text-xs uppercase tracking-widest text-text-muted">
                  CUENTA
                </h2>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3">
                  <div>
                    <p className="text-xs font-medium text-text-secondary">Nombre</p>
                    {editingName ? (
                      <>
                        <Input
                          id="account-name"
                          aria-label="Nombre"
                          className="mt-1 max-w-xs"
                          placeholder="Añade tu nombre"
                          value={nameDraft}
                          onChange={(event) => setNameDraft(event.target.value)}
                          maxLength={50}
                          autoFocus
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button variant="destructive" onClick={cancelEditingName}>
                            Cancelar
                          </Button>
                          <Button onClick={() => void handleSaveName()} disabled={!canSaveName}>
                            {savingName ? "Guardando..." : "Guardar"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="mt-1 text-sm font-medium text-text-primary">
                        {displayName || (
                          <span className="text-text-muted">Añade tu nombre</span>
                        )}
                      </p>
                    )}
                  </div>
                  {!editingName && (
                    <Button variant="outline" onClick={startEditingName}>
                      Cambiar nombre
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-text-secondary">Email</p>
                    <p className="mt-1 text-sm font-medium text-text-primary">{user?.email}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3">
                  <div>
                    <p className="text-sm text-text-primary">Contraseña</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Cámbiala cuando lo necesites.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setPasswordOpen(true)}>
                    Cambiar contraseña
                  </Button>
                </div>
              </Card>

              <Card className="px-5 py-2">
                <h2 className="py-3 text-xs uppercase tracking-widest text-text-muted">
                  TUS DATOS
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-3">
                  <div>
                    <p className="text-xs text-text-secondary">Exportar mis datos</p>
                    <p className="mt-1 text-sm font-medium text-text-primary">
                      Movimientos, cuentas y metas en un archivo.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-border bg-bg-elevated px-4 py-2 text-sm font-medium text-text-muted">
                    Próximamente
                  </span>
                </div>
              </Card>

              <section>
                <h2 className="mb-3 mt-3 text-xs uppercase tracking-widest text-expense">
                  ZONA DE PELIGRO
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="flex flex-col gap-2 border-expense/40">
                    <h3 className="text-sm font-semibold text-text-primary">Borrar mis datos</h3>
                    <p className="flex-1 text-xs leading-relaxed text-text-muted">
                      Elimina movimientos, cuentas y el resto de tus datos. Conservas tu cuenta y tu contraseña.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2 w-full border-expense text-expense"
                      onClick={() => setDeleteDataOpen(true)}
                    >
                      Borrar mis datos
                    </Button>
                  </Card>
                  <Card className="flex flex-col gap-2 border-expense/40">
                    <h3 className="text-sm font-semibold text-text-primary">Borrar mi cuenta</h3>
                    <p className="flex-1 text-xs leading-relaxed text-text-muted">
                      Elimina tu cuenta y todos tus datos. Te pediremos la contraseña y escribir BORRAR para confirmar.
                    </p>
                    <Button
                      variant="destructive"
                      className="mt-2 w-full"
                      onClick={() => setDeleteAccountOpen(true)}
                    >
                      Borrar mi cuenta
                    </Button>
                  </Card>
                </div>
              </section>
            </div>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardTitle>Notificaciones</CardTitle>
              <NotificationSettings email={user?.email} />
            </Card>
          )}
        </div>
      </div>

      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        onChanged={() => toast({ title: "Contraseña actualizada" })}
      />

      <DeleteDataDialog
        open={deleteDataOpen}
        onOpenChange={setDeleteDataOpen}
        onDeleted={() => {
          toast({ title: "Datos borrados correctamente" });
          router.refresh();
        }}
      />

      <DeleteAccountDialog
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
        onDeleted={() => void logout()}
      />
    </main>
  );
}
