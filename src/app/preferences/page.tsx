"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/Card";
import { toast } from "@/hooks/use-toast";
import { ChangePasswordDialog } from "./components/ChangePasswordDialog";

export default function PreferencesPage() {
  const { user, logout } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 animate-fade-in">
          <h1 className="text-xl font-semibold text-text-primary">
            Preferencias
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Gestiona tu perfil, tus cuentas bancarias y las notificaciones
          </p>
        </header>

        <Card className="mb-4 animate-fade-in stagger-1">
          <CardTitle>Cuenta</CardTitle>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider">Email</p>
              <p className="text-sm text-text-primary mt-1">{user?.email}</p>
            </div>
            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-text-primary">Contraseña</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Cámbiala cuando lo necesites.
                </p>
              </div>
              <Button variant="outline" onClick={() => setPasswordOpen(true)}>
                Cambiar contraseña
              </Button>
            </div>
          </div>
        </Card>

        <Card className="mb-4 animate-fade-in stagger-2">
          <CardTitle>Cuentas bancarias</CardTitle>
          <p className="text-sm text-text-muted">
            Organiza tus movimientos por cuenta y elige dónde importar cada extracto.
          </p>
          <Button variant="outline" className="mt-3" asChild>
            <Link href="/accounts">Gestionar cuentas</Link>
          </Button>
        </Card>

        <Card className="mb-4 animate-fade-in stagger-3">
          <CardTitle>Notificaciones</CardTitle>
          <p className="text-sm text-text-muted">
            Proximamente: configura alertas para presupuestos y suscripciones
          </p>
        </Card>

        <Card className="animate-fade-in stagger-4">
          <CardTitle>Sesión</CardTitle>
          <div className="space-y-4">
            <Button variant="outline" onClick={logout}>
              Cerrar sesión
            </Button>
            <div className="pt-4 border-t border-border">
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("¿Estás seguro de que quieres borrar todos tus datos? Esta acción no se puede deshacer.")) {
                    alert("Función no implementada aún");
                  }
                }}
              >
                Borrar todos mis datos
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        onChanged={() => toast({ title: "Contraseña actualizada" })}
      />
    </main>
  );
}
