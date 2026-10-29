"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/Card";

export default function PreferencesPage() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 animate-fade-in">
          <h1 className="text-xl font-semibold text-text-primary">
            Preferencias
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Gestiona tu cuenta y notificaciones
          </p>
        </header>

        <Card className="mb-4 animate-fade-in stagger-1">
          <CardTitle>Cuenta</CardTitle>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider">Email</p>
              <p className="text-sm text-text-primary mt-1">{user?.email}</p>
            </div>
          </div>
        </Card>

        <Card className="mb-4 animate-fade-in stagger-2">
          <CardTitle>Notificaciones</CardTitle>
          <p className="text-sm text-text-muted">
            Proximamente: configura alertas para presupuestos y suscripciones
          </p>
        </Card>

        <Card className="animate-fade-in stagger-3">
          <CardTitle>Sesion</CardTitle>
          <div className="space-y-4">
            <Button variant="outline" onClick={logout}>
              Cerrar sesion
            </Button>
            <div className="pt-4 border-t border-border">
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("¿Estas seguro de que quieres borrar todos tus datos? Esta accion no se puede deshacer.")) {
                    alert("Funcion no implementada aun");
                  }
                }}
              >
                Borrar todos mis datos
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
