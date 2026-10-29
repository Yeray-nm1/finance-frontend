"use client";

import { cn } from "@/lib/utils";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
  fullPage?: boolean;
}

export function ErrorState({ message, onRetry, className, fullPage }: Readonly<ErrorStateProps>) {
  const content = (
    <div className={cn("text-center py-12", className)}>
      <p className="text-sm text-expense">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-primary text-sm hover:underline mt-2">
          Reintentar
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <main className="min-h-screen bg-bg-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">{content}</div>
      </main>
    );
  }

  return content;
}
