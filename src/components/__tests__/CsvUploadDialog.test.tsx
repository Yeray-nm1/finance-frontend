import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api";
import { CsvUploadDialog } from "@/components/CsvUploadDialog";
import {
  getCsvMappingFingerprint,
  loadStoredCsvMapping,
  saveStoredCsvMapping,
} from "@/lib/csv-import";
import type { CsvMapping, CsvPreviewResult } from "@/types/transactions";

vi.mock("@/lib/api", () => ({
  api: {
    accounts: {
      list: vi.fn(),
    },
    transactions: {
      previewCsv: vi.fn(),
      importCsv: vi.fn(),
    },
  },
}));

const accountsList = vi.mocked(api.accounts.list);
const previewCsv = vi.mocked(api.transactions.previewCsv);
const importCsv = vi.mocked(api.transactions.importCsv);
const account = {
  id: "account-1",
  userId: "user-1",
  name: "Cuenta principal",
  type: "checking" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const mapping: CsvMapping = {
  date: "Fecha",
  amount: "Importe",
  description: "Concepto",
  type: "Tipo",
};

function buildPreview(overrides: Partial<CsvPreviewResult> = {}): CsvPreviewResult {
  return {
    total: 2,
    valid: 1,
    invalid: 0,
    duplicates: 1,
    rows: [
      {
        row: 2,
        date: "2026-02-01",
        amount: -10,
        description: "Compra",
        type: "expense",
        status: "ok",
      },
      {
        row: 3,
        date: "2026-02-01",
        amount: -10,
        description: "Compra",
        type: "expense",
        status: "duplicate",
        reason: "Repetida en el archivo (no se importará)",
      },
    ],
    truncated: false,
    errors: [],
    mapping,
    detected: {
      date: "DD/MM/AAAA",
      amount: "1.234,56",
    },
    ...overrides,
  };
}

function createFile(
  content = "Fecha;Importe;Concepto;Tipo\n01/02/2026;10,00;Compra;cargo\n01/02/2026;10,00;Compra;cargo\n",
  name = "movimientos.csv"
) {
  return new File([content], name, { type: "text/csv" });
}

async function uploadFile(file = createFile()) {
  const input = screen.getByLabelText("Archivo CSV") as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  accountsList.mockResolvedValue([account]);
  previewCsv.mockResolvedValue(buildPreview());
  importCsv.mockResolvedValue({
    imported: 1,
    total: 2,
    valid: 1,
    duplicates: 1,
    invalid: 0,
    errors: [],
  });
});

describe("CsvUploadDialog", () => {
  it("muestra la vista previa, permite mapear y resume la importación", async () => {
    const user = userEvent.setup();
    const onImported = vi.fn();

    render(<CsvUploadDialog open onClose={vi.fn()} onImported={onImported} />);
    await uploadFile();

    await waitFor(() => {
      expect(previewCsv).toHaveBeenCalledTimes(1);
      expect(previewCsv.mock.calls[0][1]).toBeUndefined();
    });

    expect(await screen.findByText("DD/MM/AAAA")).toBeInTheDocument();
    expect(screen.getByText("1.234,56")).toBeInTheDocument();
    expect(screen.getByText(/Codificación detectada/)).toBeInTheDocument();
    expect(screen.getByText(/Indica qué columna del archivo corresponde a cada dato/)).toBeInTheDocument();
    expect(screen.getByText("1 lista")).toBeInTheDocument();
    expect(screen.getByText("1 duplicada")).toBeInTheDocument();
    expect(screen.getByText("Lista")).toBeInTheDocument();
    expect(screen.getByText("Duplicada")).toBeInTheDocument();
    expect(screen.getByText("Repetida en el archivo (no se importará)")).toBeInTheDocument();
    expect(screen.queryByText(/sin ella, «Nómina»/)).not.toBeInTheDocument();
    expect(screen.queryByText(/No tiene relación con las suscripciones/)).not.toBeInTheDocument();
    expect(screen.queryByText(/se deduce por el signo del importe/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Columna de fecha")).toHaveValue("Fecha");
    await waitFor(() => {
      expect(screen.getByLabelText("Cuenta de destino")).toHaveValue("account-1");
    });

    const importButton = screen.getByRole("button", { name: "Importar 1 fila" });
    await waitFor(() => expect(importButton).toBeEnabled());
    await user.click(importButton);

    await waitFor(() => {
      expect(importCsv).toHaveBeenCalledTimes(1);
      expect(importCsv.mock.calls[0][1]).toEqual(mapping);
      expect(importCsv.mock.calls[0][2]).toBe("account-1");
    });

    expect(await screen.findByText("1 de 2 filas importadas · 1 duplicada")).toBeInTheDocument();
    expect(onImported).toHaveBeenCalledTimes(1);
  });

  it("aplica el mapeo guardado para las mismas cabeceras sin mostrar un aviso", async () => {
    const headers = ["Fecha", "Importe", "Concepto", "Tipo"];
    saveStoredCsvMapping(headers, mapping);

    render(<CsvUploadDialog open onClose={vi.fn()} onImported={vi.fn()} />);
    await uploadFile();

    await waitFor(() => {
      expect(previewCsv).toHaveBeenCalledTimes(1);
      expect(previewCsv.mock.calls[0][1]).toEqual(mapping);
    });

    expect(screen.getByLabelText("Columna de fecha")).toHaveValue("Fecha");
    expect(screen.queryByText("Mapeo recordado")).not.toBeInTheDocument();
  });

  it("al cambiar una columna vuelve a analizar y guarda el nuevo mapeo", async () => {
    const user = userEvent.setup();
    const headers = ["Fecha", "Importe", "Valor", "Concepto", "Tipo"];

    render(<CsvUploadDialog open onClose={vi.fn()} onImported={vi.fn()} />);
    await uploadFile(
      createFile("Fecha;Importe;Valor;Concepto;Tipo\n01/02/2026;10,00;10,00;Compra;cargo\n")
    );

    await waitFor(() => expect(previewCsv).toHaveBeenCalledTimes(1));

    await user.selectOptions(screen.getByLabelText("Columna de importe"), "Valor");

    await waitFor(() => {
      expect(previewCsv).toHaveBeenCalledTimes(2);
      expect(previewCsv.mock.calls[1][1]).toMatchObject({ amount: "Valor" });
    });

    expect(loadStoredCsvMapping(headers)).toMatchObject({ amount: "Valor" });
  });

  it("bloquea la importación si falta un campo obligatorio", async () => {
    previewCsv.mockResolvedValue(
      buildPreview({
        valid: 0,
        duplicates: 0,
        invalid: 1,
        rows: [
          {
            row: 2,
            date: null,
            amount: null,
            description: "Compra",
            type: "expense",
            status: "error",
            reason: "Faltan campos: importe",
          },
        ],
        mapping: { ...mapping, amount: null },
      })
    );

    render(<CsvUploadDialog open onClose={vi.fn()} onImported={vi.fn()} />);
    await uploadFile();

    expect(
      await screen.findByText("Asigna una columna a fecha, importe y concepto para poder importar.")
    ).toBeInTheDocument();
    expect(screen.getByText("No hay filas nuevas que importar. Revisa el mapeo o el archivo.")).toBeInTheDocument();

    const importButton = screen.getByRole("button", { name: "Importar 0 filas" });
    expect(importButton).toBeDisabled();
  });

  it("guarda el mapeo bajo la huella de las cabeceras", () => {
    const headers = ["Fecha operación", "Importe", "Concepto"];

    expect(getCsvMappingFingerprint(headers)).toBe("concepto|fechaoperacion|importe");
  });
});
