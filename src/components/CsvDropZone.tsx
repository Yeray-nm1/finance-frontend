"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { parse } from "papaparse";

interface CsvDropZoneProps {
  onImported: () => void;
}

export function CsvDropZone({ onImported }: CsvDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setMessage({ text: "Solo archivos .csv", error: true });
      return;
    }

    setImporting(true);
    setMessage(null);

    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as Record<string, string>[];
          if (rows.length === 0) {
            setMessage({ text: "El archivo está vacío", error: true });
            setImporting(false);
            return;
          }
          const res = await api.transactions.importCsv(rows);
          setMessage({
            text: `${res.imported} de ${res.total} filas importadas`,
            error: false,
          });
          onImported();
        } catch {
          setMessage({ text: "Error al importar", error: true });
        } finally {
          setImporting(false);
        }
      },
      error: () => {
        setMessage({ text: "Error al leer el archivo", error: true });
        setImporting(false);
      },
    });
  }, [onImported]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="animate-slide-up stagger-1">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`drop-zone p-12 text-center cursor-pointer ${
          dragging ? "dragging" : ""
        } ${importing ? "opacity-50 pointer-events-none" : ""}`}
        onClick={() => document.getElementById("csv-input")?.click()}
      >
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInput}
        />

        <div className="mb-4">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto text-text-muted"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <p className="text-sm text-text-secondary mb-1">
          {importing ? "IMPORTANDO..." : "ARRASTRA TU CSV AQUÍ"}
        </p>
        <p className="text-xs text-text-muted">
          o haz clic para seleccionar archivo
        </p>

        {message && (
          <p
            className={`mt-4 text-xs ${
              message.error ? "text-red" : "text-acid"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
