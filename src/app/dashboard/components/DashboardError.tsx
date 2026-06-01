"use client";

import { AlertCircle } from "lucide-react";
import type { DashboardErrorProps } from "@/types/dashboard";

export function DashboardError({ error, onRetry }: Readonly<DashboardErrorProps>) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <AlertCircle className="w-12 h-12 text-expense mb-4" />
      <p className="text-sm text-text-primary mb-4 text-center">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
