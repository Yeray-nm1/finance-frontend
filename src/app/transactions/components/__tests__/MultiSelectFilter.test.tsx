import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultiSelectFilter } from "../MultiSelectFilter";

beforeAll(() => {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { /* noop */ }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  };
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

const options = [
  { value: "cat-1", label: "Comida" },
  { value: "cat-2", label: "Ahorro" },
  { value: "cat-3", label: "Luz" },
];

describe("MultiSelectFilter", () => {
  it("muestra el número de valores activos", () => {
    const { rerender } = render(
      <MultiSelectFilter
        values={[]}
        placeholder="Categoría"
        options={options}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole("combobox", { name: "Categoría" })).toHaveTextContent("Categoría");

    rerender(
      <MultiSelectFilter
        values={["cat-1", "cat-2"]}
        placeholder="Categoría"
        options={options}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole("combobox", { name: "Categoría" })).toHaveTextContent(
      "Categoría (2)"
    );
  });

  it("añade un valor al marcarlo y lo quita al desmarcarlo", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <MultiSelectFilter
        values={[]}
        placeholder="Categoría"
        options={options}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("combobox", { name: "Categoría" }));
    await user.click(screen.getByRole("checkbox", { name: "Comida" }));
    expect(onChange).toHaveBeenCalledWith(["cat-1"]);

    rerender(
      <MultiSelectFilter
        values={["cat-1"]}
        placeholder="Categoría"
        options={options}
        onChange={onChange}
      />
    );
    await user.click(screen.getByRole("checkbox", { name: "Comida" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("se deshabilita y muestra el texto vacío cuando no hay opciones", () => {
    render(
      <MultiSelectFilter
        values={[]}
        placeholder="Cuenta"
        options={[]}
        onChange={vi.fn()}
        disabled
        emptyLabel="Sin cuentas"
      />
    );
    const trigger = screen.getByRole("combobox", { name: "Cuenta" });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveTextContent("Sin cuentas");
  });

  it("filtra las opciones con el buscador cuando hay muchas", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 9 }, (_, index) => ({
      value: `cat-${index}`,
      label: `Categoría ${index}`,
    }));
    render(
      <MultiSelectFilter
        values={[]}
        placeholder="Categoría"
        options={many}
        onChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole("combobox", { name: "Categoría" }));
    const search = screen.getByRole("textbox", { name: "Buscar categoría" });
    await user.type(search, "Categoría 8");

    expect(screen.getByRole("checkbox", { name: "Categoría 8" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Categoría 0" })).not.toBeInTheDocument();
  });

  it("limpia todos los valores desde el popover", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelectFilter
        values={["cat-1", "cat-2"]}
        placeholder="Categoría"
        options={options}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("combobox", { name: "Categoría" }));
    await user.click(screen.getByRole("button", { name: "Limpiar" }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
