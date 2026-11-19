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

function emailAccordion() {
  return screen.getByRole("button", { name: /Correo electrónico/ });
}

async function openEmailAccordion(user: ReturnType<typeof userEvent.setup>) {
  await user.click(emailAccordion());
}

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
    const user = userEvent.setup();
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
      screen.getByRole("switch", { name: "Activar avisos de metas" })
    ).toBeChecked();

    await openEmailAccordion(user);
    expect(
      await screen.findByRole("checkbox", {
        name: "Enviar aviso de suscripción próxima por email",
      })
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: "Enviar resumen de gastos por email",
      })
    ).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Enviar recordatorio de metas por email" })
    ).toBeChecked();
  });

  it("abre y cierra el acordeón de correo y refleja el estado con los checkboxes", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({
      subscriptionDue: { enabled: true, emailEnabled: true, daysBefore: 3 },
      spendingSummary: { enabled: true, emailEnabled: false, frequency: "weekly" },
      goalReminder: { enabled: false, emailEnabled: false },
    });

    render(<NotificationSettings email="user@example.com" />);
    await screen.findByRole("switch", {
      name: "Activar aviso de suscripción próxima",
    });

    const trigger = emailAccordion();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("checkbox")).toBeNull();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      await screen.findByRole("checkbox", {
        name: "Enviar aviso de suscripción próxima por email",
      })
    ).toBeChecked();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("guarda las preferencias del recordatorio mensual de metas", async () => {
    const user = userEvent.setup();
    render(<NotificationSettings email="user@example.com" />);

    const saveButton = await screen.findByRole("button", {
      name: "Guardar preferencias",
    });
    await user.click(
      screen.getByRole("switch", { name: "Activar avisos de metas" })
    );
    await openEmailAccordion(user);
    await user.click(
      await screen.findByRole("checkbox", { name: "Enviar recordatorio de metas por email" })
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
        name: "Activar avisos de metas",
      })
    ).not.toBeChecked();
  });

  it("CA-WI5.5 muestra el título, la nota adaptada y un enlace a Metas", async () => {
    render(<NotificationSettings email="user@example.com" />);

    expect(
      await screen.findByRole("heading", { name: "Avisos de metas" })
    ).toBeVisible();
    expect(
      screen.getByText(
        "Te avisamos el día elegido en cada meta para revisar y confirmar tu aportación."
      )
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir a Metas" })).toHaveAttribute(
      "href",
      "/goals"
    );
  });

  it("CA-WI5.5 «Ir a Metas» se muestra en su propia línea", async () => {
    render(<NotificationSettings email="user@example.com" />);

    const link = await screen.findByRole("link", { name: "Ir a Metas" });
    expect(link.parentElement?.tagName).toBe("P");
    expect(link.parentElement).toHaveTextContent("Ir a Metas");
    expect(
      screen.getByText(
        "Te avisamos el día elegido en cada meta para revisar y confirmar tu aportación."
      ).textContent
    ).not.toContain("Ir a Metas");
  });

  it("CA-WI5.5 al venir del aviso de una meta el foco va al switch global", async () => {
    window.history.pushState({}, "", "/preferences?focus=goalReminder");
    render(<NotificationSettings email="user@example.com" />);

    const goalSwitch = await screen.findByRole("switch", {
      name: "Activar avisos de metas",
    });
    await waitFor(() => expect(document.activeElement).toBe(goalSwitch));
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
    expect(screen.getByRole("button", { name: /Correo/ })).toBeInTheDocument();
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

  it("guarda emailEnabled por regla cuando cambia una opción del acordeón de correo", async () => {
    const user = userEvent.setup();
    render(<NotificationSettings email="user@example.com" />);

    const saveButton = await screen.findByRole("button", {
      name: "Guardar preferencias",
    });
    await user.click(
      screen.getByRole("switch", { name: "Activar aviso de suscripción próxima" })
    );
    await openEmailAccordion(user);
    await user.click(
      await screen.findByRole("checkbox", {
        name: "Enviar aviso de suscripción próxima por email",
      })
    );
    await user.click(saveButton);

    await waitFor(() => expect(mockSave).toHaveBeenCalledOnce());
    expect(mockSave).toHaveBeenCalledWith({
      subscriptionDue: { enabled: true, emailEnabled: true, daysBefore: 3 },
      spendingSummary: { enabled: false, emailEnabled: false, frequency: "weekly" },
      goalReminder: { enabled: false, emailEnabled: false },
    });
    expect(toast).toHaveBeenCalledWith({
      title: "Preferencias de notificaciones guardadas",
    });
  });

  it("deshabilita las opciones de correo mientras su aviso general está apagado", async () => {
    const user = userEvent.setup();
    render(<NotificationSettings email="user@example.com" />);

    await screen.findByRole("switch", { name: "Activar aviso de suscripción próxima" });
    await openEmailAccordion(user);

    expect(
      screen.getByRole("checkbox", { name: "Enviar aviso de suscripción próxima por email" })
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Enviar resumen de gastos por email" })
    ).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Enviar recordatorio de metas por email" })
    ).toBeDisabled();

    await user.click(screen.getByRole("switch", { name: "Activar resumen de gastos" }));

    expect(
      screen.getByRole("checkbox", { name: "Enviar resumen de gastos por email" })
    ).toBeEnabled();
    expect(
      screen.getByRole("checkbox", { name: "Enviar aviso de suscripción próxima por email" })
    ).toBeDisabled();
  });

  it("apagar un aviso general desmarca y deshabilita su opción de correo", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({
      subscriptionDue: { enabled: true, emailEnabled: true, daysBefore: 3 },
      spendingSummary: { enabled: true, emailEnabled: true, frequency: "monthly" },
      goalReminder: { enabled: true, emailEnabled: true },
    });
    render(<NotificationSettings email="user@example.com" />);

    await screen.findByRole("switch", { name: "Activar aviso de suscripción próxima" });
    await openEmailAccordion(user);
    expect(
      screen.getByRole("checkbox", { name: "Enviar aviso de suscripción próxima por email" })
    ).toBeChecked();

    await user.click(
      screen.getByRole("switch", { name: "Activar aviso de suscripción próxima" })
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Enviar aviso de suscripción próxima por email",
    });
    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Enviar resumen de gastos por email" })
    ).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Guardar preferencias" }));
    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionDue: { enabled: false, emailEnabled: false, daysBefore: 3 },
        })
      )
    );
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
