import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteAccountDialog } from "../DeleteAccountDialog";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    me: {
      deleteAccount: vi.fn(),
    },
  },
}));

function renderDialog(
  overrides: Partial<React.ComponentProps<typeof DeleteAccountDialog>> = {}
) {
  return render(
    <DeleteAccountDialog
      open={true}
      onOpenChange={vi.fn()}
      onDeleted={vi.fn()}
      {...overrides}
    />
  );
}

describe("DeleteAccountDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.me.deleteAccount).mockResolvedValue(undefined);
  });

  it("borra la cuenta con la contraseña introducida", async () => {
    const onOpenChange = vi.fn();
    const onDeleted = vi.fn();
    renderDialog({ onOpenChange, onDeleted });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Contraseña"), "MiPass123");
    await user.click(screen.getByRole("button", { name: "Borrar cuenta" }));

    expect(api.me.deleteAccount).toHaveBeenCalledWith("MiPass123");
    expect(onDeleted).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("muestra el error cuando la contraseña no es correcta", async () => {
    vi.mocked(api.me.deleteAccount).mockRejectedValue(
      new Error("La contraseña no es correcta")
    );
    const onDeleted = vi.fn();
    renderDialog({ onDeleted });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Contraseña"), "WrongPass1");
    await user.click(screen.getByRole("button", { name: "Borrar cuenta" }));

    expect(
      await screen.findByText("La contraseña no es correcta")
    ).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
