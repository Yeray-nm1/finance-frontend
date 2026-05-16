"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { parse } from "papaparse";
interface CsvUploadDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onImported: () => void;
}

export function CsvUploadDialog({ open, onClose, onImported }: Readonly<CsvUploadDialogProps>) {
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    if (!open) {
      setMessage(null);
      setDragging(false);
    }
  }, [open]);

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
          setTimeout(() => {
            onImported();
            onClose();
          }, 1000);
        } catch {
          setMessage({ text: "Error al importar", error: true });
          setImporting(false);
        }
      },
      error: () => {
        setMessage({ text: "Error al leer el archivo", error: true });
        setImporting(false);
      },
    });
  }, [onImported, onClose]);

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-8 w-[90%] max-w-[480px] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            Importar CSV
          </h3>
          <p className="text-xs text-text-secondary uppercase tracking-wide">
            Arrastra tu archivo o haz clic para seleccionar
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("csv-upload-input")?.click()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            dragging
              ? "border-primary bg-primary-light/20"
              : "border-border hover:border-primary-border"
          }`}
        >
          <input
            id="csv-upload-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInput}
          />

          <div className="mb-4 text-text-muted">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto"
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
                message.error ? "text-expense" : "text-income"
              }`}
            >
              {message.text}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 border border-border rounded-lg text-sm text-text-secondary hover:border-primary-border hover:text-primary transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
