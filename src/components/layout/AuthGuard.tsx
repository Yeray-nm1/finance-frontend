"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthGuardProps } from "./types";

export function AuthGuard({ children }: Readonly<AuthGuardProps>) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-serif text-xl text-gray-400">Cargando...</p>
      </main>
    );
  }

  return <>{children}</>;
}
