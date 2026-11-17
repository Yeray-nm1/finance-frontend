import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteDataDialog } from "../DeleteDataDialog";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    me: {
      deleteData: vi.fn(),
    },
  },
}));

function renderDialog(
  overrides: Partial<React.ComponentProps<typeof DeleteDataDialog>> = {}
) {
  return render(
    <DeleteDataDialog
      open={true}
      onOpenChange={vi.fn()}
      onDeleted={vi.fn()}
      {...overrides}
    />
  );
}

describe("DeleteDataDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.me.deleteData).mockResolvedValue(undefined);
  });

  it("borra los datos, avisa y cierra el diálogo", async () => {
    const onOpenChange = vi.fn();
    const onDeleted = vi.fn();
    renderDialog({ onOpenChange, onDeleted });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Borrar datos" }));

    expect(api.me.deleteData).toHaveBeenCalledOnce();
    expect(onDeleted).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("muestra el error y no avisa cuando falla el borrado", async () => {
    vi.mocked(api.me.deleteData).mockRejectedValue(new Error("Fallo al borrar"));
    const onDeleted = vi.fn();
    renderDialog({ onDeleted });

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Borrar datos" }));

    expect(await screen.findByText("Fallo al borrar")).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
