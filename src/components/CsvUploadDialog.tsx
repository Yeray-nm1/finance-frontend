"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import {
  decodeCsvFile,
  isCsvMappingComplete,
  loadStoredCsvMapping,
  saveStoredCsvMapping,
  type CsvEncoding,
} from "@/lib/csv-import";
import type {
  CsvField,
  CsvMapping,
  CsvPreviewResult,
  CsvRowStatus,
  ImportCsvResult,
  TransactionType,
} from "@/types/transactions";

interface CsvUploadDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onImported: () => void;
}

interface CsvFileData {
  name: string;
  encoding: CsvEncoding;
  headers: string[];
  rows: Record<string, string>[];
}

type Step = "upload" | "review" | "result";

const FIELD_CONFIG: ReadonlyArray<{
  field: CsvField;
  label: string;
  required: boolean;
}> = [
  { field: "date", label: "Fecha", required: true },
  { field: "amount", label: "Importe", required: true },
  { field: "description", label: "Concepto", required: true },
  {
    field: "type",
    label: "Tipo",
    required: false,
  },
];

const TYPE_LABELS: Record<TransactionType, string> = {
  income: "Ingreso",
  expense: "Gasto",
  transfer: "Transferencia",
};

const STATUS_LABELS: Record<CsvRowStatus, string> = {
  ok: "Lista",
  error: "Error",
  duplicate: "Duplicada",
};

const STATUS_CLASSES: Record<CsvRowStatus, string> = {
  ok: "border-income/40 bg-income/5 text-income",
  error: "border-expense/40 bg-expense/5 text-expense",
  duplicate: "border-warning/40 bg-warning/5 text-warning",
};

function isNonEmptyRow(row: Record<string, string>): boolean {
  return Object.values(row).some(
    (value) => typeof value === "string" && value.trim() !== ""
  );
}

function buildResultSummary(result: ImportCsvResult): string[] {
  const summary = [`${result.imported} de ${result.total} filas importadas`];

  if (result.duplicates > 0) {
    summary.push(`${result.duplicates} ${result.duplicates === 1 ? "duplicada" : "duplicadas"}`);
  }

  if (result.invalid > 0) {
    summary.push(`${result.invalid} ${result.invalid === 1 ? "inválida" : "inválidas"}`);
  }

  return summary;
}

export function CsvUploadDialog({ open, onClose, onImported }: Readonly<CsvUploadDialogProps>) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<CsvFileData | null>(null);
  const [mapping, setMapping] = useState<CsvMapping | null>(null);
  const [preview, setPreview] = useState<CsvPreviewResult | null>(null);
  const [result, setResult] = useState<ImportCsvResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRequestRef = useRef(0);
  const uploadInputId = useId();

  const resetState = useCallback(() => {
    previewRequestRef.current += 1;
    setStep("upload");
    setFile(null);
    setMapping(null);
    setPreview(null);
    setResult(null);
    setDragging(false);
    setReading(false);
    setPreviewLoading(false);
    setImporting(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) resetState();
  }, [open, resetState]);

  const runPreview = useCallback(
    async (rows: Record<string, string>[], nextMapping?: CsvMapping) => {
      const requestId = ++previewRequestRef.current;
      setPreviewLoading(true);
      setError(null);

      try {
        const res = await api.transactions.previewCsv(rows, nextMapping);
        if (requestId !== previewRequestRef.current) return;

        setPreview(res);
        setMapping((current) => current ?? res.mapping);
      } catch (err) {
        if (requestId !== previewRequestRef.current) return;

        setError(
          err instanceof Error ? err.message : "No se pudo analizar el archivo"
        );
      } finally {
        if (requestId === previewRequestRef.current) {
          setPreviewLoading(false);
        }
      }
    },
    []
  );

  const processFile = useCallback(
    async (selected: File) => {
      if (!selected.name.toLowerCase().endsWith(".csv")) {
        setError("Solo se admiten archivos .csv");
        return;
      }

      setReading(true);
      setError(null);
      setPreview(null);
      setResult(null);

      try {
        const buffer = await selected.arrayBuffer();
        const { text, encoding } = decodeCsvFile(buffer);
        const parsed = parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: "greedy",
        });

        const headers = (parsed.meta.fields ?? []).filter(Boolean);
        const rows = (parsed.data ?? []).filter(isNonEmptyRow);

        if (headers.length === 0) {
          throw new Error("No se encontraron columnas en el archivo");
        }

        if (rows.length === 0) {
          throw new Error("El archivo no contiene filas de datos");
        }

        const storedMapping = loadStoredCsvMapping(headers);
        const nextFile: CsvFileData = {
          name: selected.name,
          encoding,
          headers,
          rows,
        };

        setFile(nextFile);
        setMapping(storedMapping);
        setStep("review");
        setReading(false);

        await runPreview(rows, storedMapping ?? undefined);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo leer el archivo"
        );
        setReading(false);
      }
    },
    [runPreview]
  );

  const handleMappingChange = useCallback(
    (field: CsvField, value: string) => {
      if (!file || !mapping) return;

      const nextMapping: CsvMapping = {
        ...mapping,
        [field]: value === "" ? null : value,
      };

      setMapping(nextMapping);
      saveStoredCsvMapping(file.headers, nextMapping);
      void runPreview(file.rows, nextMapping);
    },
    [file, mapping, runPreview]
  );

  const handleImport = useCallback(async () => {
    if (!file || !mapping || !preview) return;

    setImporting(true);
    setError(null);

    try {
      const res = await api.transactions.importCsv(file.rows, mapping);
      setResult(res);
      setStep("result");

      if (res.imported > 0) {
        onImported();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar");
    } finally {
      setImporting(false);
    }
  }, [file, mapping, preview, onImported]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const selected = e.dataTransfer.files[0];
    if (selected) void processFile(selected);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) void processFile(selected);
    e.target.value = "";
  };

  const mappingComplete = mapping ? isCsvMappingComplete(mapping) : false;
  const canImport =
    Boolean(file && mapping && preview) &&
    mappingComplete &&
    !previewLoading &&
    !importing &&
    (preview?.valid ?? 0) > 0;

  const description =
    step === "upload"
      ? "Arrastra tu archivo o haz clic para seleccionar"
      : step === "review"
        ? "Revisa las columnas y las filas antes de importar. Las filas duplicadas o con error no se importarán."
        : "Resumen de la importación";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar CSV</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error && (
          <div
            className="rounded-lg border border-expense/40 bg-expense/5 px-3 py-2 text-xs text-expense"
            role="alert"
          >
            {error}
          </div>
        )}

        {step === "upload" && (
          <>
            <button
              type="button"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById(uploadInputId)?.click()}
              disabled={reading}
              className={`w-full cursor-pointer rounded-lg border-2 border-dashed bg-transparent p-10 text-center font-[inherit] transition-colors disabled:cursor-wait ${
                dragging
                  ? "border-primary bg-primary-light/20"
                  : "border-border hover:border-primary-border"
              }`}
            >
              <input
                id={uploadInputId}
                type="file"
                accept=".csv"
                aria-label="Archivo CSV"
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

              <p className="mb-1 text-sm text-text-secondary">
                {reading ? "LEYENDO ARCHIVO..." : "ARRASTRA TU CSV AQUÍ"}
              </p>
              <p className="text-xs text-text-muted">
                o haz clic para seleccionar archivo
              </p>
            </button>

            <Button variant="outline" onClick={onClose} className="w-full">
              Cerrar
            </Button>
          </>
        )}

        {step === "review" && file && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              <span className="font-medium text-text-primary">{file.name}</span>
              <span aria-hidden="true">·</span>
              <span>
                {file.rows.length} {file.rows.length === 1 ? "fila" : "filas"}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Codificación detectada:{" "}
                {file.encoding === "utf-8" ? "UTF-8" : "Windows-1252"}
              </span>
            </div>

            <p className="text-xs text-text-secondary">
              Indica qué columna del archivo corresponde a cada dato: fecha e
              importe para interpretar los valores, concepto para el texto de la
              transacción y tipo solo si el archivo lo incluye.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {FIELD_CONFIG.map(({ field, label, required }) => (
                <label key={field} className="block text-xs">
                  <span className="mb-1 block font-medium text-text-primary">
                    {label}
                    {required && <span className="ml-0.5 text-expense">*</span>}
                  </span>
                  <select
                    aria-label={`Columna de ${label.toLowerCase()}`}
                    value={mapping?.[field] ?? ""}
                    onChange={(e) => handleMappingChange(field, e.target.value)}
                    className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-sm text-text-primary"
                  >
                    <option value="">No importar</option>
                    {file.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            {!mappingComplete && (
              <p className="text-xs text-warning" role="status">
                Asigna una columna a fecha, importe y concepto para poder importar.
              </p>
            )}

            {preview && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                  <span>
                    Fecha detectada:{" "}
                    <strong className="text-text-primary">
                      {preview.detected.date ?? "sin detectar"}
                    </strong>
                  </span>
                  <span>
                    Importe detectado:{" "}
                    <strong className="text-text-primary">
                      {preview.detected.amount ?? "sin detectar"}
                    </strong>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs" aria-live="polite">
                  <Badge variant="secondary">{preview.total} filas</Badge>
                  <span className="rounded-full border border-income/40 bg-income/5 px-3 py-0.5 font-semibold text-income">
                    {preview.valid} {preview.valid === 1 ? "lista" : "listas"}
                  </span>
                  <span className="rounded-full border border-warning/40 bg-warning/5 px-3 py-0.5 font-semibold text-warning">
                    {preview.duplicates} {preview.duplicates === 1 ? "duplicada" : "duplicadas"}
                  </span>
                  <span className="rounded-full border border-expense/40 bg-expense/5 px-3 py-0.5 font-semibold text-expense">
                    {preview.invalid} {preview.invalid === 1 ? "inválida" : "inválidas"}
                  </span>
                </div>

                <div className="max-h-64 overflow-auto rounded-md border border-border">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-8 px-2 py-1">Fila</TableHead>
                        <TableHead className="h-8 px-2 py-1">Fecha</TableHead>
                        <TableHead className="h-8 px-2 py-1">Importe</TableHead>
                        <TableHead className="h-8 px-2 py-1">Concepto</TableHead>
                        <TableHead className="h-8 px-2 py-1">Tipo</TableHead>
                        <TableHead className="h-8 px-2 py-1">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.rows.map((row) => (
                        <TableRow key={`${row.row}-${row.status}`}>
                          <TableCell className="px-2 py-1.5 text-text-muted">{row.row}</TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-nowrap">
                            {row.date ?? "—"}
                          </TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-nowrap">
                            {row.amount === null ? "—" : formatCurrency(row.amount)}
                          </TableCell>
                          <TableCell className="px-2 py-1.5">{row.description || "—"}</TableCell>
                          <TableCell className="px-2 py-1.5 whitespace-nowrap">
                            {TYPE_LABELS[row.type]}
                          </TableCell>
                          <TableCell className="px-2 py-1.5">
                            <span
                              title={row.reason}
                              className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${STATUS_CLASSES[row.status]}`}
                            >
                              {STATUS_LABELS[row.status]}
                            </span>
                            {row.reason && (
                              <span className="mt-0.5 block text-[11px] text-text-muted">
                                {row.reason}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {preview.truncated && (
                  <p className="text-xs text-text-muted">
                    Mostrando las primeras {preview.rows.length} de {preview.total} filas.
                  </p>
                )}

                {preview.valid === 0 && (
                  <p className="text-xs text-warning" role="status">
                    No hay filas nuevas que importar. Revisa el mapeo o el archivo.
                  </p>
                )}
              </div>
            )}

            {previewLoading && (
              <p className="text-xs text-text-secondary" role="status">
                Analizando archivo...
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                onClick={resetState}
                disabled={importing}
              >
                Elegir otro archivo
              </Button>
              <Button onClick={handleImport} disabled={!canImport}>
                {importing
                  ? "Importando..."
                  : `Importar ${preview?.valid ?? 0} ${(preview?.valid ?? 0) === 1 ? "fila" : "filas"}`}
              </Button>
            </div>
          </>
        )}

        {step === "result" && result && (
          <>
            <div
              className={`rounded-lg border px-3 py-3 text-sm ${
                result.imported > 0
                  ? "border-income/40 bg-income/5 text-income"
                  : "border-warning/40 bg-warning/5 text-warning"
              }`}
              aria-live="polite"
            >
              <p className="font-medium">{buildResultSummary(result).join(" · ")}</p>
              {result.errors.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-text-secondary">
                  {result.errors.map((item) => (
                    <li key={`${item.row}-${item.reason}`}>
                      Fila {item.row}: {item.reason}
                    </li>
                  ))}
                </ul>
              )}
              {result.invalid > result.errors.length && (
                <p className="mt-2 text-xs text-text-secondary">
                  … y {result.invalid - result.errors.length} fila(s) más con errores.
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={resetState}>
                Importar otro archivo
              </Button>
              <Button onClick={onClose}>Cerrar</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
