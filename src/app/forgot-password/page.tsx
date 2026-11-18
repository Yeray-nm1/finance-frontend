"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.auth.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el enlace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-text-primary">Recuperar contraseña</h1>
          <p className="text-sm text-text-muted mt-1">
            Te enviaremos un enlace para elegir una nueva
          </p>
        </div>

        <div className="bg-white border border-border rounded-lg p-6 shadow-sm">
          {sent ? (
            <div className="space-y-5">
              <p className="text-sm text-text-secondary">
                Si el email está registrado, te hemos enviado un enlace para restablecer tu contraseña.
                Revisa también la carpeta de spam.
              </p>
              <Link
                href="/login"
                className="block text-center text-sm text-primary hover:text-primary-hover font-medium"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-text-secondary font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="bg-delete-bg text-expense text-sm font-medium px-4 py-2.5 rounded-lg">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Finance Dashboard &copy; 2026
        </p>
      </div>
    </main>
  );
}
