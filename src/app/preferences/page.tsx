"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type PreferenceTab = "profile" | "accounts" | "notifications" | "session";

const TABS: ReadonlyArray<{ key: PreferenceTab; label: string }> = [
  { key: "profile", label: "Perfil" },
  { key: "accounts", label: "Cuentas bancarias" },
  { key: "notifications", label: "Notificaciones" },
  { key: "session", label: "Sesión" },
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
            Gestiona tu perfil, tus cuentas bancarias y las notificaciones
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
            <Card>
              <CardTitle>Cuenta</CardTitle>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
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
                      <p className="mt-1 text-sm text-text-primary">
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

                <div className="border-t border-border pt-3">
                  <p className="text-xs uppercase tracking-wider text-text-secondary">Email</p>
                  <p className="mt-1 text-sm text-text-primary">{user?.email}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
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
              </div>
            </Card>
          )}

          {activeTab === "accounts" && (
            <Card>
              <CardTitle>Cuentas bancarias</CardTitle>
              <p className="text-sm text-text-muted">
                Organiza tus movimientos por cuenta y elige dónde importar cada extracto.
              </p>
              <Button variant="outline" className="mt-3" asChild>
                <Link href="/accounts">Gestionar cuentas</Link>
              </Button>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardTitle>Notificaciones</CardTitle>
              <NotificationSettings email={user?.email} />
            </Card>
          )}

          {activeTab === "session" && (
            <Card>
              <CardTitle>Sesión</CardTitle>
              <div className="space-y-4">
                <Button variant="outline" onClick={logout}>
                  Cerrar sesión
                </Button>
                <div className="space-y-3 border-t border-border pt-4">
                  <div>
                    <Button variant="destructive" onClick={() => setDeleteDataOpen(true)}>
                      Borrar todos mis datos
                    </Button>
                    <p className="mt-1.5 text-xs text-text-muted">
                      Elimina tus movimientos, cuentas y el resto de tus datos, pero conserva tu
                      cuenta y tu contraseña.
                    </p>
                  </div>
                  <div className="border-t border-border pt-3">
                    <Button variant="destructive" onClick={() => setDeleteAccountOpen(true)}>
                      Borrar mi cuenta
                    </Button>
                    <p className="mt-1.5 text-xs text-text-muted">
                      Elimina tu cuenta y todos tus datos, y cierra la sesión. Requiere tu
                      contraseña.
                    </p>
                  </div>
                </div>
              </div>
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
