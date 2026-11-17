import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationSettings } from "../NotificationSettings";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { NotificationRules } from "@/types/notifications";

vi.mock("@/lib/api", () => ({
  api: {
    notifications: {
      rules: {
        get: vi.fn(),
        save: vi.fn(),
      },
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

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

const defaults: NotificationRules = {
  subscriptionDue: { enabled: false, daysBefore: 3 },
  spendingSummary: { enabled: false, frequency: "weekly" },
};

const mockGet = vi.mocked(api.notifications.rules.get);
const mockSave = vi.mocked(api.notifications.rules.save);

describe("NotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue(defaults);
    mockSave.mockImplementation(async (rules) => rules);
  });

  it("carga las reglas y refleja el estado de los switches", async () => {
    mockGet.mockResolvedValue({
      subscriptionDue: { enabled: true, daysBefore: 7 },
      spendingSummary: { enabled: true, frequency: "monthly" },
    });

    render(<NotificationSettings />);

    expect(
      await screen.findByRole("switch", {
        name: "Activar aviso de suscripción próxima",
      })
    ).toBeChecked();
    expect(
      screen.getByRole("switch", { name: "Activar resumen de gastos" })
    ).toBeChecked();
  });

  it("mantiene el botón de guardar deshabilitado sin cambios", async () => {
    render(<NotificationSettings />);

    const saveButton = await screen.findByRole("button", {
      name: "Guardar preferencias",
    });
    expect(saveButton).toBeDisabled();
  });

  it("guardar envía las reglas modificadas y muestra un toast", async () => {
    const user = userEvent.setup();
    render(<NotificationSettings />);

    const saveButton = await screen.findByRole("button", {
      name: "Guardar preferencias",
    });
    await user.click(
      screen.getByRole("switch", {
        name: "Activar aviso de suscripción próxima",
      })
    );
    await user.click(saveButton);

    await waitFor(() => expect(mockSave).toHaveBeenCalledOnce());
    expect(mockSave).toHaveBeenCalledWith({
      ...defaults,
      subscriptionDue: { enabled: true, daysBefore: 3 },
    });
    expect(toast).toHaveBeenCalledWith({
      title: "Preferencias de notificaciones guardadas",
    });
  });

  it("muestra un toast de error cuando falla el guardado", async () => {
    const user = userEvent.setup();
    mockSave.mockRejectedValue(new Error("boom"));
    render(<NotificationSettings />);

    const saveButton = await screen.findByRole("button", {
      name: "Guardar preferencias",
    });
    await user.click(
      screen.getByRole("switch", { name: "Activar resumen de gastos" })
    );
    await user.click(saveButton);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith({
        title: "No se pudieron guardar las preferencias",
        variant: "destructive",
      })
    );
  });
});
