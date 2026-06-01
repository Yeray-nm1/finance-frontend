"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

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

        {/* Account Info */}
        <section className="bg-white border border-border rounded-lg p-5 mb-4 animate-fade-in stagger-1">
          <h2 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-4">
            Cuenta
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wider">Email</p>
              <p className="text-sm text-text-primary mt-1">{user?.email}</p>
            </div>
          </div>
        </section>

        {/* Notifications - Placeholder */}
        <section className="bg-white border border-border rounded-lg p-5 mb-4 animate-fade-in stagger-2">
          <h2 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-4">
            Notificaciones
          </h2>
          <p className="text-sm text-text-muted">
            Proximamente: configura alertas para presupuestos y suscripciones
          </p>
        </section>

        {/* Session */}
        <section className="bg-white border border-border rounded-lg p-5 animate-fade-in stagger-3">
          <h2 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-4">
            Sesion
          </h2>
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
        </section>
      </div>
    </main>
  );
}
