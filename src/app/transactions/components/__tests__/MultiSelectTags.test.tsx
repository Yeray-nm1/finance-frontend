import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultiSelectTags } from "../MultiSelectTags";

const options = [
  { value: "cat-1", label: "Comida" },
  { value: "cat-2", label: "Ahorro" },
  { value: "cat-3", label: "Luz" },
];

describe("MultiSelectTags", () => {
  it("no renderiza nada sin valores", () => {
    const { container } = render(
      <MultiSelectTags values={[]} options={options} onChange={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra solo los valores seleccionados", () => {
    render(
      <MultiSelectTags values={["cat-1", "cat-3"]} options={options} onChange={vi.fn()} />
    );
    expect(screen.getByText("Comida")).toBeInTheDocument();
    expect(screen.getByText("Luz")).toBeInTheDocument();
    expect(screen.queryByText("Ahorro")).not.toBeInTheDocument();
  });

  it("quita el valor del chip al pulsar la X", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelectTags
        values={["cat-1", "cat-2"]}
        options={options}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("button", { name: "Quitar filtro Comida" }));
    expect(onChange).toHaveBeenCalledWith(["cat-2"]);
  });
});
