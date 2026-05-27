"use client";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: Readonly<ErrorStateProps>) {
  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm text-expense">{error}</p>
        <button onClick={onRetry} className="text-primary text-sm hover:underline mt-2">
          Reintentar
        </button>
      </div>
    </main>
  );
}
