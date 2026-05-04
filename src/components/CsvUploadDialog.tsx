"use client";

import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { parse } from "papaparse";

interface CsvUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function CsvUploadDialog({ open, onClose, onImported }: CsvUploadDialogProps) {
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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#111111",
          border: "1px solid #252525",
          borderRadius: "12px",
          padding: "32px",
          width: "90%",
          maxWidth: "480px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "20px",
            fontWeight: "bold",
            color: "#e8e8e8",
            marginBottom: "4px",
          }}>
            SUBIR CSV
          </h3>
          <p style={{
            fontSize: "11px",
            color: "#888888",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Arrastra tu archivo o haz clic para seleccionar
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("csv-upload-input")?.click()}
          style={{
            border: `2px dashed ${dragging ? "#a6e22e" : "#252525"}`,
            borderRadius: "8px",
            padding: "40px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "rgba(166, 226, 46, 0.03)" : "transparent",
            transition: "all 0.3s",
          }}
        >
          <input
            id="csv-upload-input"
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />

          <div style={{ marginBottom: "16px", color: "#888888" }}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ margin: "0 auto" }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <p style={{
            fontSize: "13px",
            color: importing ? "#555555" : "#888888",
            marginBottom: "4px",
          }}>
            {importing ? "IMPORTANDO..." : "ARRASTRA TU CSV AQUÍ"}
          </p>
          <p style={{
            fontSize: "11px",
            color: "#555555",
          }}>
            o haz clic para seleccionar archivo
          </p>

          {message && (
            <p
              style={{
                marginTop: "16px",
                fontSize: "12px",
                color: message.error ? "#f44747" : "#a6e22e",
              }}
            >
              {message.text}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "10px",
            background: "none",
            border: "1px solid #252525",
            borderRadius: "4px",
            color: "#888888",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#a6e22e";
            e.currentTarget.style.color = "#a6e22e";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#252525";
            e.currentTarget.style.color = "#888888";
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
