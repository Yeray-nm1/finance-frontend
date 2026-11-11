import type { CsvField, CsvMapping } from "@/types/transactions";

export type CsvEncoding = "utf-8" | "windows-1252";

const CSV_MAPPING_STORAGE_PREFIX = "finance:csv-mapping:";

const MAPPING_FIELDS: CsvField[] = ["date", "amount", "description", "type"];

export function detectCsvEncoding(buffer: ArrayBuffer): CsvEncoding {
  const bytes = new Uint8Array(buffer);

  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return "utf-8";
  }

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return "utf-8";
  } catch {
    return "windows-1252";
  }
}

export function decodeCsvFile(buffer: ArrayBuffer): { text: string; encoding: CsvEncoding } {
  const encoding = detectCsvEncoding(buffer);
  const text = new TextDecoder(encoding).decode(buffer).replace(/^\uFEFF/, "");

  return { text, encoding };
}

export function normalizeCsvHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * El mapeo se recuerda por conjunto de cabeceras: dos exports del mismo banco
 * comparten huella aunque cambie el orden de las columnas.
 */
export function getCsvMappingFingerprint(headers: readonly string[]): string {
  return headers
    .map(normalizeCsvHeader)
    .filter(Boolean)
    .sort()
    .join("|");
}

export function isCsvMappingComplete(mapping: CsvMapping): boolean {
  return Boolean(mapping.date && mapping.amount && mapping.description);
}

function isCsvMapping(value: unknown): value is CsvMapping {
  if (value === null || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;

  return MAPPING_FIELDS.every((field) => {
    if (!Object.prototype.hasOwnProperty.call(record, field)) return false;
    const column = record[field];
    return column === null || typeof column === "string";
  });
}

type MappingStorage = Pick<Storage, "getItem" | "setItem">;

function getDefaultStorage(): MappingStorage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadStoredCsvMapping(
  headers: readonly string[],
  storage: MappingStorage | null = getDefaultStorage()
): CsvMapping | null {
  if (!storage) return null;

  const fingerprint = getCsvMappingFingerprint(headers);
  if (!fingerprint) return null;

  try {
    const raw = storage.getItem(`${CSV_MAPPING_STORAGE_PREFIX}${fingerprint}`);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    return isCsvMapping(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredCsvMapping(
  headers: readonly string[],
  mapping: CsvMapping,
  storage: MappingStorage | null = getDefaultStorage()
): void {
  if (!storage) return;

  const fingerprint = getCsvMappingFingerprint(headers);
  if (!fingerprint) return;

  try {
    storage.setItem(`${CSV_MAPPING_STORAGE_PREFIX}${fingerprint}`, JSON.stringify(mapping));
  } catch {
    // Si el almacenamiento no está disponible, el mapeo simplemente no se recuerda.
  }
}
