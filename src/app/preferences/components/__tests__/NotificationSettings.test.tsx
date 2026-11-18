import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
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
  subscriptionDue: { enabled: false, emailEnabled: false, daysBefore: 3 },
  spendingSummary: { enabled: false, emailEnabled: false, frequency: "weekly" },
  goalReminder: { enabled: false, emailEnabled: false },
};

const mockGet = vi.mocked(api.notifications.rules.get);
const mockSave = vi.mocked(api.notifications.rules.save);

describe("NotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/preferences");
    mockGet.mockResolvedValue(defaults);
    mockSave.mockImplementation(async (rules) => rules);
  });

  afterEach(() => {
    window.history.pushState({}, "", "/preferences");
  });

  it("carga las reglas y refleja el estado de los switches in-app y de email", async () => {
    mockGet.mockResolvedValue({
      subscriptionDue: { enabled: true, emailEnabled: true, daysBefore: 7 },
      spendingSummary: { enabled: true, emailEnabled: false, frequency: "monthly" },
      goalReminder: { enabled: true, emailEnabled: true },
    });

    render(<NotificationSettings email="user@example.com" />);

    expect(
      await screen.findByRole("switch", {
        name: "Activar aviso de suscripción próxima",
      })
    ).toBeChecked();
    expect(
      screen.getByRole("switch", { name: "Activar resumen de gastos" })
    ).toBeChecked();
    expect(
      screen.getByRole("switch", {
        name: "Enviar aviso de suscripción próxima por email",
      })
    ).toBeChecked();
    expect(
      screen.getByRole("switch", {
        name: "Enviar resumen de gastos por email",
      })
    ).not.toBeChecked();
    expect(
      screen.getByRole("switch", { name: "Activar recordatorio mensual de metas" })
    ).toBeChecked();
    expect(
      screen.getByRole("switch", { name: "Enviar recordatorio de metas por email" })
    ).toBeChecked();
  });

  it("guarda las preferencias del recordatorio mensual de metas", async () => {
    const user = userEvent.setup();
    render(<NotificationSettings email="user@example.com" />);

    const saveButton = await screen.findByRole("button", {
      name: "Guardar preferencias",
    });
    await user.click(
      screen.getByRole("switch", { name: "Activar recordatorio mensual de metas" })
    );
    await user.click(
      screen.getByRole("switch", { name: "Enviar recordatorio de metas por email" })
    );
    await user.click(saveButton);

    await waitFor(() => expect(mockSave).toHaveBeenCalledOnce());
    expect(mockSave).toHaveBeenCalledWith({
      subscriptionDue: { enabled: false, emailEnabled: false, daysBefore: 3 },
      spendingSummary: { enabled: false, emailEnabled: false, frequency: "weekly" },
      goalReminder: { enabled: true, emailEnabled: true },
    });
  });

  it("rellena goalReminder con valores por defecto si el backend no lo devuelve", async () => {
    mockGet.mockResolvedValue({
      subscriptionDue: { enabled: false, emailEnabled: false, daysBefore: 3 },
      spendingSummary: { enabled: false, emailEnabled: false, frequency: "weekly" },
    } as NotificationRules);

    render(<NotificationSettings email="user@example.com" />);

    expect(
      await screen.findByRole("switch", {
        name: "Activar recordatorio mensual de metas",
      })
    ).not.toBeChecked();
  });

  it("muestra la dirección de correo de la cuenta en modo lectura", async () => {
    render(<NotificationSettings email="user@example.com" />);

    await screen.findByRole("switch", {
      name: "Activar aviso de suscripción próxima",
    });
    expect(screen.getByText("user@example.com")).toBeVisible();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("mantiene los nombres accesibles de los controles existentes", async () => {
    render(<NotificationSettings email="user@example.com" />);

    expect(
      await screen.findByRole("switch", {
        name: "Activar aviso de suscripción próxima",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", { name: "Activar resumen de gastos" })
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Avisar con" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Frecuencia" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Guardar preferencias" })
    ).toBeInTheDocument();
  });

  it("mantiene el botón de guardar deshabilitado sin cambios", async () => {
    render(<NotificationSettings email="user@example.com" />);

    const saveButton = await screen.findByRole("button", {
      name: "Guardar preferencias",
    });
    expect(saveButton).toBeDisabled();
  });

  it("guarda emailEnabled por regla cuando cambia un switch de email", async () => {
    const user = userEvent.setup();
    render(<NotificationSettings email="user@example.com" />);

    const saveButton = await screen.findByRole("button", {
      name: "Guardar preferencias",
    });
    await user.click(
      screen.getByRole("switch", {
        name: "Enviar aviso de suscripción próxima por email",
      })
    );
    await user.click(saveButton);

    await waitFor(() => expect(mockSave).toHaveBeenCalledOnce());
    expect(mockSave).toHaveBeenCalledWith({
      subscriptionDue: { enabled: false, emailEnabled: true, daysBefore: 3 },
      spendingSummary: { enabled: false, emailEnabled: false, frequency: "weekly" },
      goalReminder: { enabled: false, emailEnabled: false },
    });
    expect(toast).toHaveBeenCalledWith({
      title: "Preferencias de notificaciones guardadas",
    });
  });

  it("guarda las reglas in-app modificadas sin perder emailEnabled", async () => {
    const user = userEvent.setup();
    render(<NotificationSettings email="user@example.com" />);

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
      subscriptionDue: { enabled: true, emailEnabled: false, daysBefore: 3 },
      spendingSummary: { enabled: false, emailEnabled: false, frequency: "weekly" },
      goalReminder: { enabled: false, emailEnabled: false },
    });
  });

  it("muestra un toast de error cuando falla el guardado", async () => {
    const user = userEvent.setup();
    mockSave.mockRejectedValue(new Error("boom"));
    render(<NotificationSettings email="user@example.com" />);

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

  it("avisa cuando el usuario vuelve del enlace de baja", async () => {
    window.history.pushState({}, "", "/preferences?unsubscribed=1");
    render(<NotificationSettings email="user@example.com" />);

    await screen.findByRole("switch", {
      name: "Activar aviso de suscripción próxima",
    });
    expect(toast).toHaveBeenCalledWith({
      title: "Suscripción por email desactivada",
      description: "Ya no recibirás avisos por correo. Puedes volver a activarlos aquí.",
    });
  });
});
