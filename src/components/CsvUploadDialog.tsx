"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { parse } from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CsvUploadDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onImported: () => void;
}

interface ImportMessage {
  text: string;
  error: boolean;
  details?: string[];
}

export function CsvUploadDialog({ open, onClose, onImported }: Readonly<CsvUploadDialogProps>) {
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<ImportMessage | null>(null);

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

          const duplicates = res.duplicates ?? 0;
          const invalid = res.invalid ?? 0;
          const errors = res.errors ?? [];

          const summary = [`${res.imported} de ${res.total} filas importadas`];
          if (duplicates > 0) {
            summary.push(`${duplicates} ${duplicates === 1 ? "duplicada" : "duplicadas"}`);
          }
          if (invalid > 0) {
            summary.push(`${invalid} ${invalid === 1 ? "inválida" : "inválidas"}`);
          }

          const details = errors.map((e) => `Fila ${e.row}: ${e.reason}`);
          if (invalid > details.length) {
            details.push(`… y ${invalid - details.length} fila(s) más`);
          }

          setMessage({
            text: summary.join(" · "),
            error: res.imported === 0,
            details,
          });
          setImporting(false);

          if (res.imported > 0) {
            onImported();
          }

          if (res.imported > 0 && duplicates === 0 && invalid === 0) {
            setTimeout(onClose, 1200);
          }
        } catch (err) {
          setMessage({
            text: err instanceof Error ? err.message : "Error al importar",
            error: true,
          });
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

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar CSV</DialogTitle>
          <DialogDescription>
            Arrastra tu archivo o haz clic para seleccionar
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("csv-upload-input")?.click()}
          className={`w-full border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors bg-transparent font-[inherit] ${
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
        </button>

        {message && (
          <div
            className={`rounded-lg border px-3 py-2 text-xs ${
              message.error
                ? "border-expense/40 bg-expense/5 text-expense"
                : "border-income/40 bg-income/5 text-income"
            }`}
            aria-live="polite"
          >
            <p className="font-medium">{message.text}</p>
            {message.details && message.details.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 text-text-secondary">
                {message.details.map((detail, index) => (
                  <li key={`${index}-${detail}`}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Button variant="outline" onClick={onClose} className="w-full">
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
