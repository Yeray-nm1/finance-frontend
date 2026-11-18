"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <Card>
        <p className="text-sm text-text-secondary">
          El enlace no es válido o ha caducado. Solicita uno nuevo para continuar.
        </p>
        <Link
          href="/forgot-password"
          className="block text-center text-sm text-primary hover:text-primary-hover font-medium"
        >
          Solicitar nuevo enlace
        </Link>
      </Card>
    );
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== repeat) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un dígito.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(token!, password);
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs text-text-secondary font-medium">
            Nueva contraseña
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="repeat" className="text-xs text-text-secondary font-medium">
            Repetir contraseña
          </Label>
          <Input
            id="repeat"
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {error && (
          <div className="bg-delete-bg text-expense text-sm font-medium px-4 py-2.5 rounded-lg">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Guardando..." : "Guardar contraseña"}
        </Button>
      </form>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-text-primary">Nueva contraseña</h1>
          <p className="text-sm text-text-muted mt-1">Elige una contraseña segura para tu cuenta</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-6 shadow-sm space-y-5">
          {children}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-bg-page" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
