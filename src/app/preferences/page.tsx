"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function PreferencesPage() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen bg-bg-primary p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 animate-slide-up">
          <h1 className="font-display text-3xl font-bold text-text-primary">
            PREFERENCIAS
          </h1>
          <p className="text-text-muted text-xs uppercase tracking-widest mt-1">
            Gestiona tu cuenta y notificaciones
          </p>
        </header>

        {/* Account Info */}
        <section className="terminal-card p-5 mb-4 animate-slide-up stagger-1">
          <h2 className="text-xs uppercase tracking-widest text-text-muted mb-4">
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
        <section className="terminal-card p-5 mb-4 animate-slide-up stagger-2">
          <h2 className="text-xs uppercase tracking-widest text-text-muted mb-4">
            Notificaciones
          </h2>
          <p className="text-xs text-text-muted">
            Proximamente: configura alertas para presupuestos y suscripciones
          </p>
        </section>

        {/* Session */}
        <section className="terminal-card p-5 animate-slide-up stagger-3">
          <h2 className="text-xs uppercase tracking-widest text-text-muted mb-4">
            Sesion
          </h2>
          <div className="space-y-3">
            <button
              onClick={logout}
              className="text-xs font-mono uppercase tracking-wider text-terminal-red hover:text-red transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Cerrar sesion
            </button>
            <div className="pt-3 border-t border-border">
              <button
                onClick={() => {
                  if (confirm("¿Estas seguro de que quieres borrar todos tus datos? Esta accion no se puede deshacer.")) {
                    alert("Funcion no implementada aun");
                  }
                }}
                className="text-xs font-mono uppercase tracking-wider text-terminal-red hover:text-red transition-colors"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Borrar todos mis datos
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
