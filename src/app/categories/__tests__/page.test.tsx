import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api";
import CategoriesPage from "../page";

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { void 0; }
    unobserve() { void 0; }
    disconnect() { void 0; }
  };
});

vi.mock("@/lib/api", () => ({
  api: {
    categories: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

const category = {
  id: "category-1",
  userId: "user-1",
  name: "Supermercado",
  type: "needs" as const,
};

describe("CategoriesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.categories.list).mockResolvedValue([]);
    vi.mocked(api.categories.create).mockResolvedValue(category);
    vi.mocked(api.categories.update).mockResolvedValue({ ...category, name: "Compra" });
    vi.mocked(api.categories.delete).mockResolvedValue(undefined);
  });

  it("muestra el estado vacío y permite crear la primera categoría", async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    expect(await screen.findByText("Aún no tienes categorías")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Crear mi primera categoría" }));
    await user.type(screen.getByLabelText("Nombre"), "Supermercado");
    await user.click(screen.getByRole("button", { name: "Crear categoría" }));

    await waitFor(() => {
      expect(api.categories.create).toHaveBeenCalledWith({
        name: "Supermercado",
        type: "needs",
      });
    });
    expect(await screen.findByText("Supermercado")).toBeInTheDocument();
    expect(screen.queryByText("Aún no tienes categorías")).not.toBeInTheDocument();
  });

  it("agrupa las categorías por tipo", async () => {
    vi.mocked(api.categories.list).mockResolvedValue([
      category,
      { ...category, id: "category-2", name: "Cine", type: "leisure" },
    ]);
    render(<CategoriesPage />);

    expect(await screen.findByText("Supermercado")).toBeInTheDocument();
    expect(screen.getByText("Cine")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Necesidades/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Ocio/ })).toBeInTheDocument();
  });

  it("permite editar el nombre de una categoría", async () => {
    vi.mocked(api.categories.list).mockResolvedValue([category]);
    const user = userEvent.setup();
    render(<CategoriesPage />);

    await user.click(await screen.findByRole("button", { name: "Editar Supermercado" }));
    const input = screen.getByLabelText("Nombre");
    await user.clear(input);
    await user.type(input, "Compra");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(api.categories.update).toHaveBeenCalledWith("category-1", {
        name: "Compra",
        type: "needs",
      });
    });
    expect(await screen.findByText("Compra")).toBeInTheDocument();
  });

  it("elimina una categoría avisando a los movimientos y presupuestos", async () => {
    vi.mocked(api.categories.list).mockResolvedValue([category]);
    const user = userEvent.setup();
    render(<CategoriesPage />);

    await user.click(await screen.findByRole("button", { name: "Eliminar Supermercado" }));

    expect(screen.getByText(/se quedarán sin categoría/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => {
      expect(api.categories.delete).toHaveBeenCalledWith("category-1");
    });
    expect(await screen.findByText("Aún no tienes categorías")).toBeInTheDocument();
  });

  it("muestra el error del backend al crear una categoría duplicada", async () => {
    const user = userEvent.setup();
    render(<CategoriesPage />);

    await screen.findByText("Aún no tienes categorías");
    vi.mocked(api.categories.create).mockRejectedValue(
      new Error("Ya existe una categoría con ese nombre")
    );
    const { toast } = await import("@/hooks/use-toast");

    await user.click(screen.getByRole("button", { name: "Crear mi primera categoría" }));
    await user.type(screen.getByLabelText("Nombre"), "Ocio");
    await user.click(screen.getByRole("button", { name: "Crear categoría" }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: "Ya existe una categoría con ese nombre",
        variant: "destructive",
      });
    });
  });
});
