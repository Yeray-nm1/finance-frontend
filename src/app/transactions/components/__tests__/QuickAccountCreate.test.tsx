import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/lib/api";
import { QuickAccountCreate } from "../QuickAccountCreate";

vi.mock("@/lib/api", () => ({
  api: {
    accounts: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

const account = {
  id: "account-1",
  userId: "user-1",
  name: "Cuenta nueva",
  type: "checking" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("QuickAccountCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.accounts.create).mockResolvedValue(account);
  });

  it("crea la cuenta sin enviar el formulario de la transacción", async () => {
    const onCreated = vi.fn();
    const onSubmit = vi.fn((e: React.SyntheticEvent) => e.preventDefault());
    const user = userEvent.setup();

    render(
      <form onSubmit={onSubmit}>
        <QuickAccountCreate onCreated={onCreated} />
      </form>
    );

    await user.click(screen.getByRole("button", { name: "+ Nueva cuenta" }));
    await user.type(screen.getByLabelText("Nombre de la nueva cuenta"), "  Cuenta nueva  {Enter}");

    await waitFor(() => {
      expect(api.accounts.create).toHaveBeenCalledWith({
        name: "Cuenta nueva",
        type: "checking",
      });
    });
    expect(onCreated).toHaveBeenCalledWith(account);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "+ Nueva cuenta" })).toBeInTheDocument();
  });

  it("muestra el error del backend y mantiene el formulario abierto", async () => {
    vi.mocked(api.accounts.create).mockRejectedValue(
      new Error("El nombre de la cuenta es obligatorio")
    );
    const onCreated = vi.fn();
    const user = userEvent.setup();

    render(<QuickAccountCreate onCreated={onCreated} />);

    await user.click(screen.getByRole("button", { name: "+ Nueva cuenta" }));
    await user.type(screen.getByLabelText("Nombre de la nueva cuenta"), "Cuenta");
    await user.click(screen.getByRole("button", { name: "Crear" }));

    expect(
      await screen.findByText("El nombre de la cuenta es obligatorio")
    ).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nombre de la nueva cuenta")).toBeInTheDocument();
  });
});
