import { test, expect, type APIRequestContext } from '@playwright/test';
import { readFixtures } from './support/fixtures';

interface NotificationItem {
  id: string;
  title: string;
  readAt: string | null;
}

interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

async function getNotifications(request: APIRequestContext): Promise<NotificationsResponse> {
  const response = await request.get('/api/v1/notifications');
  expect(response.ok(), `notifications -> ${response.status()} ${await response.text()}`).toBe(true);
  return (await response.json()) as NotificationsResponse;
}

function dateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T12:00:00.000Z`;
}

test.describe('notificaciones in-app', () => {
  test('configura las reglas, muestra los avisos y los marca como leídos', async ({
    page,
    request,
  }) => {
    const fixtures = readFixtures();

    // Los reintentos comparten usuario: devolver las reglas a su estado inicial
    // evita que un intento fallido deje los switches activados para el siguiente.
    await request.put('/api/v1/notifications/rules', {
      data: {
        subscriptionDue: { enabled: false, emailEnabled: false, daysBefore: 3 },
        spendingSummary: { enabled: false, emailEnabled: false, frequency: 'weekly' },
      },
    });

    await page.goto('/preferences');
    await expect(page.getByRole('heading', { name: 'Preferencias' })).toBeVisible();

    const subscriptionSwitch = page.getByRole('switch', {
      name: 'Activar aviso de suscripción próxima',
    });
    const summarySwitch = page.getByRole('switch', {
      name: 'Activar resumen de gastos',
    });
    await expect(subscriptionSwitch).not.toBeChecked();
    await expect(summarySwitch).not.toBeChecked();

    await subscriptionSwitch.click();
    await summarySwitch.click();
    await page.getByRole('combobox', { name: 'Avisar con' }).click();
    await page.getByRole('option', { name: '7 días antes' }).click();
    await page.getByRole('combobox', { name: 'Frecuencia' }).click();
    await page.getByRole('option', { name: 'Mensual' }).click();
    await page.getByRole('button', { name: 'Guardar preferencias' }).click();
    await expect(
      page.getByText('Preferencias de notificaciones guardadas', { exact: true })
    ).toBeVisible();

    const rulesResponse = await request.get('/api/v1/notifications/rules');
    expect(rulesResponse.ok()).toBe(true);
    const rules = await rulesResponse.json();
    expect(rules).toEqual({
      subscriptionDue: { enabled: true, emailEnabled: false, daysBefore: 7 },
      spendingSummary: { enabled: true, emailEnabled: false, frequency: 'monthly' },
      goalReminder: { enabled: false, emailEnabled: false },
    });

    // Suscripción semanal cuyo último cobro fue hace 7 días: el próximo cae hoy.
    const name = `Suscripcion ${fixtures.runId}`;
    const createTransaction = await request.post('/api/v1/transactions', {
      data: {
        date: dateDaysAgo(7),
        amount: 12.99,
        description: name,
        type: 'expense',
        accountId: fixtures.accounts.checking.id,
      },
    });
    expect(createTransaction.ok(), await createTransaction.text()).toBe(true);

    const createSubscription = await request.post('/api/v1/subscriptions', {
      data: { name, amount: 12.99, frequency: 'weekly' },
    });
    expect(createSubscription.ok(), await createSubscription.text()).toBe(true);

    const bell = page.getByRole('button', { name: /Notificaciones/ });
    await expect(bell).toHaveCount(1);
    await bell.click();

    const panel = page.locator('[data-slot="popover-content"]');
    await expect(panel.getByText(`Próximo cobro: ${name}`)).toBeVisible();
    await expect(panel.getByText('Resumen de gastos')).toBeVisible();
    await expect(panel.getByText(/Has gastado/)).toBeVisible();

    const first = await getNotifications(request);
    expect(first.unreadCount).toBeGreaterThanOrEqual(2);
    const second = await getNotifications(request);
    expect(second.items.map((item) => item.id)).toEqual(first.items.map((item) => item.id));

    await panel.getByRole('button', { name: 'Marcar todas como leídas' }).click();
    await expect(page.getByRole('button', { name: 'Notificaciones', exact: true })).toBeVisible();

    const afterRead = await getNotifications(request);
    expect(afterRead.unreadCount).toBe(0);
    expect(afterRead.items.every((item) => item.readAt !== null)).toBe(true);
  });
});

test.describe('notificaciones en móvil', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('muestra la campana en la barra superior y abre el panel', async ({ page }) => {
    await page.goto('/dashboard');

    const bell = page
      .getByRole('banner')
      .getByRole('button', { name: /Notificaciones/ });
    await expect(bell).toBeVisible();
    await bell.click();

    await expect(page.locator('[data-slot="popover-content"]')).toBeVisible();
  });
});
