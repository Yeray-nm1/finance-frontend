"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo/Title Area */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-mint/50 flex items-center justify-center mx-auto mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#6b7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-semibold text-gray-800">
            Crear Cuenta
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Comienza a gestionar tus finanzas
          </p>
        </div>

        <Card className="card-glass border-0 shadow-soft-lg animate-card-enter">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs text-gray-500 font-medium"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-white/50"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs text-gray-500 font-medium"
                >
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl bg-white/50"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="bg-coral-light text-coral text-sm font-medium px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Registrarse"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/login"
                  className="text-lavender hover:text-lavender/80 font-medium transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-300 mt-6">
          Finance Dashboard © 2026
        </p>
      </div>
    </main>
  );
}
