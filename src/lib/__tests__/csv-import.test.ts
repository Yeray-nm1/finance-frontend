import { describe, it, expect } from "vitest";
import {
  detectCsvEncoding,
  decodeCsvFile,
  getCsvMappingFingerprint,
  isCsvMappingComplete,
  loadStoredCsvMapping,
  normalizeCsvHeader,
  saveStoredCsvMapping,
} from "@/lib/csv-import";
import type { CsvMapping } from "@/types/transactions";

function bytes(text: string, encode?: (char: string) => number): Uint8Array {
  return new Uint8Array(
    Array.from(text).map((char) => encode?.(char) ?? char.charCodeAt(0))
  );
}

function toArrayBuffer(value: Uint8Array): ArrayBuffer {
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer;
}

function createStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
  };
}

describe("detectCsvEncoding", () => {
  it("detects plain UTF-8 text", () => {
    const buffer = toArrayBuffer(
      new TextEncoder().encode("Fecha;Concepto\n01/02/2026;Café")
    );

    expect(detectCsvEncoding(buffer)).toBe("utf-8");
  });

  it("detects UTF-8 with BOM", () => {
    const buffer = toArrayBuffer(
      new Uint8Array([0xef, 0xbb, 0xbf, 0x46, 0x65, 0x63, 0x68, 0x61])
    );

    expect(detectCsvEncoding(buffer)).toBe("utf-8");
  });

  it("falls back to windows-1252 when the bytes are not valid UTF-8", () => {
    const buffer = toArrayBuffer(bytes("Fecha;Concepto\n01/02/2026;Café", (char) =>
      char === "é" ? 0xe9 : char.charCodeAt(0)
    ));

    expect(detectCsvEncoding(buffer)).toBe("windows-1252");
  });
});

describe("decodeCsvFile", () => {
  it("decodes windows-1252 accents and strips the BOM", () => {
    const withBom = new TextEncoder().encode("\uFEFFFecha;Concepto\n01/02/2026;Café");
    const decoded = decodeCsvFile(toArrayBuffer(withBom));

    expect(decoded.encoding).toBe("utf-8");
    expect(decoded.text.startsWith("Fecha")).toBe(true);
    expect(decoded.text).toContain("Café");
  });

  it("decodes legacy accents with windows-1252", () => {
    const decoded = decodeCsvFile(
      toArrayBuffer(bytes("Año;Concepto\n2026;Piña", (char) => {
        if (char === "ñ") return 0xf1;
        return char.charCodeAt(0);
      }))
    );

    expect(decoded.encoding).toBe("windows-1252");
    expect(decoded.text).toContain("Año");
    expect(decoded.text).toContain("Piña");
  });
});

describe("getCsvMappingFingerprint", () => {
  it("ignores case, accents, punctuation and column order", () => {
    const first = getCsvMappingFingerprint(["Fecha operación", "Importe", "Concepto"]);
    const second = getCsvMappingFingerprint(["concepto", "FECHA OPERACION", "IMPORTE"]);

    expect(first).toBe(second);
    expect(normalizeCsvHeader("Fecha operación")).toBe("fechaoperacion");
  });

  it("returns an empty fingerprint when there are no headers", () => {
    expect(getCsvMappingFingerprint([])).toBe("");
  });
});

describe("isCsvMappingComplete", () => {
  it("requires date, amount and description", () => {
    const complete: CsvMapping = {
      date: "Fecha",
      amount: "Importe",
      description: "Concepto",
      type: null,
    };

    expect(isCsvMappingComplete(complete)).toBe(true);
    expect(isCsvMappingComplete({ ...complete, description: null })).toBe(false);
    expect(isCsvMappingComplete({ date: null, amount: null, description: null, type: null })).toBe(false);
  });
});

describe("mapping storage", () => {
  const headers = ["Fecha", "Importe", "Concepto"];
  const mapping: CsvMapping = {
    date: "Fecha",
    amount: "Importe",
    description: "Concepto",
    type: null,
  };

  it("saves and loads a mapping per header fingerprint", () => {
    const storage = createStorage();

    saveStoredCsvMapping(headers, mapping, storage);

    expect(loadStoredCsvMapping(headers, storage)).toEqual(mapping);
    expect(loadStoredCsvMapping(["Otra", "Cabecera"], storage)).toBeNull();
  });

  it("returns null when the stored value is corrupt or incomplete", () => {
    const storage = createStorage();
    const key = `finance:csv-mapping:${getCsvMappingFingerprint(headers)}`;

    storage.setItem(key, "not-json");
    expect(loadStoredCsvMapping(headers, storage)).toBeNull();

    storage.setItem(key, JSON.stringify({ date: "Fecha" }));
    expect(loadStoredCsvMapping(headers, storage)).toBeNull();
  });

  it("does nothing when storage is unavailable", () => {
    expect(() => saveStoredCsvMapping(headers, mapping, null)).not.toThrow();
    expect(loadStoredCsvMapping(headers, null)).toBeNull();
  });
});
