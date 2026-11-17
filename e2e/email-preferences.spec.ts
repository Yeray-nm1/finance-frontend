import { test, expect } from '@playwright/test';

interface NotificationRules {
  subscriptionDue: { enabled: boolean; emailEnabled: boolean; daysBefore: number };
  spendingSummary: {
    enabled: boolean;
    emailEnabled: boolean;
    frequency: string;
  };
}

const initialRules: NotificationRules = {
  subscriptionDue: { enabled: true, emailEnabled: false, daysBefore: 3 },
  spendingSummary: { enabled: true, emailEnabled: false, frequency: 'weekly' },
};

test.describe('preferencias de email', () => {
  test('guarda emailEnabled por regla y lo conserva al recargar', async ({
    browser,
    request,
  }) => {
    // Usuario propio: este test activa reglas y generaría avisos, así que no
    // debe compartir el usuario sembrado por el setup del resto de la suite.
    const email = `e2e-email-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@example.com`;
    const password = 'E2ePassword123';
    const registered = await request.post('/api/v1/auth/register', {
      data: { email, password },
    });
    expect(registered.status(), await registered.text()).toBe(201);

    const setCookie = registered.headers()['set-cookie'];
    const raw = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie ?? '');
    const token = /finance_token=([^;]+)/.exec(raw)?.[1];
    expect(token, 'la respuesta de registro debe devolver la cookie de sesión').toBeTruthy();

    const context = await browser.newContext({
      storageState: {
        cookies: [
          {
            name: 'finance_token',
            value: token!,
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            secure: false,
            sameSite: 'Strict',
          },
        ],
        origins: [],
      },
    });
    const page = await context.newPage();
    const api = context.request;

    try {
      await api.put('/api/v1/notifications/rules', { data: initialRules });

      await page.goto('/preferences');
      await expect(page.getByRole('heading', { name: 'Preferencias' })).toBeVisible();
      await expect(page.getByText(email, { exact: true }).first()).toBeVisible();

      const subscriptionEmail = page.getByRole('switch', {
        name: 'Enviar aviso de suscripción próxima por email',
      });
      const summaryEmail = page.getByRole('switch', {
        name: 'Enviar resumen de gastos por email',
      });

      await expect(subscriptionEmail).not.toBeChecked();
      await expect(summaryEmail).not.toBeChecked();
      // Los nombres accesibles anteriores siguen intactos.
      await expect(
        page.getByRole('switch', { name: 'Activar aviso de suscripción próxima' })
      ).toBeChecked();
      await expect(
        page.getByRole('switch', { name: 'Activar resumen de gastos' })
      ).toBeChecked();

      await subscriptionEmail.click();
      await page.getByRole('button', { name: 'Guardar preferencias' }).click();
      await expect(
        page.getByText('Preferencias de notificaciones guardadas', { exact: true })
      ).toBeVisible();

      const response = await api.get('/api/v1/notifications/rules');
      expect(response.ok()).toBe(true);
      expect(await response.json()).toEqual({
        ...initialRules,
        subscriptionDue: { ...initialRules.subscriptionDue, emailEnabled: true },
      });

      await page.reload();
      await expect(page.getByRole('switch', {
        name: 'Enviar aviso de suscripción próxima por email',
      })).toBeChecked();
      await expect(page.getByRole('switch', {
        name: 'Enviar resumen de gastos por email',
      })).not.toBeChecked();
    } finally {
      await context.close();
    }
  });
});
