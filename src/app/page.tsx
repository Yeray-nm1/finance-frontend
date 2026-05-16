"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-page">
      <p className="text-sm text-text-muted animate-fade-in">Redirigiendo...</p>
    </main>
  );
}
