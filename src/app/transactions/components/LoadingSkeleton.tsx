"use client";

export function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-bg-page p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                {["Fecha", "Descripcion", "Categoria", "Cuenta", "Suscripci&oacute;n", "Importe", ""].map((h) => (
                  <th key={h} className="h-10 px-4 text-left text-sm font-medium text-text-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={`skeleton-row-${i}`}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={`skeleton-cell-${j}`} className="px-4 py-1.5">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
