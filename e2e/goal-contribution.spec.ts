import { createHmac, randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { test, expect } from '@playwright/test';
import { expectAccessible } from './support/axe';

const FRONTEND_URL = 'http://localhost:3101';
const PASSWORD = 'E2ePassword123';
// Debe coincidir con el JWT_SECRET que playwright.config.ts inyecta en el backend aislado.
const E2E_JWT_SECRET = 'e2e-jwt-secret-not-used-in-production';

interface SeededAccount {
  id: string;
  name: string;
}

interface ContributionTokenPayload {
  sub: string;
  scope: 'goal_contribution';
  goalId: string;
  period: string;
}

function base64url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

/** Token HS256 sin iat/exp, igual que el que genera el backend para el correo. */
function signGoalContributionToken(payload: ContributionTokenPayload): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac('sha256', E2E_JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

test.describe('aviso mensual de metas con aceptación por correo', () => {
  test('el aviso no anuncia importe, la aceptación lo elige y reabrir no repite el cargo', async ({ browser }) => {
    test.setTimeout(90_000);
    const databaseUrl = process.env.E2E_DATABASE_URL;
    if (!databaseUrl) throw new Error('E2E_DATABASE_URL is required');

    const pool = new Pool({ connectionString: databaseUrl });
    const context = await browser.newContext({ baseURL: FRONTEND_URL });
    const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const email = `contribution-${runId}@example.com`;
    const goalName = `Meta aviso ${runId}`;

    try {
      const register = await context.request.post('/api/v1/auth/register', {
        data: { email, password: PASSWORD },
      });
      expect(register.status(), await register.text()).toBe(201);
      const { user } = (await register.json()) as { user: { id: string } };

      // El aviso global de Preferencias manda: lo encendemos para que la
      // tarjeta muestre el indicador verde (meta y global activos).
      const rules = await context.request.put('/api/v1/notifications/rules', {
        data: {
          subscriptionDue: { enabled: false, emailEnabled: false, daysBefore: 3 },
          spendingSummary: { enabled: false, emailEnabled: false, frequency: 'weekly' },
          goalReminder: { enabled: true, emailEnabled: true },
        },
      });
      expect(rules.status(), await rules.text()).toBe(200);

      async function createAccount(type: 'checking' | 'savings'): Promise<SeededAccount> {
        const response = await context.request.post('/api/v1/accounts', {
          data: { name: `${type} E2E ${runId}`, type },
        });
        expect(response.status(), await response.text()).toBe(201);
        return (await response.json()) as SeededAccount;
      }

      const checking = await createAccount('checking');
      const savings = await createAccount('savings');

      // La meta nace con el aviso encendido y una sugerencia de 50 € que NO se
      // anuncia en el correo ni en la campana.
      const goalResponse = await context.request.post('/api/v1/goals', {
        data: {
          name: goalName,
          targetAmount: 1000,
          accountId: savings.id,
          reminderEnabled: true,
          reminderDay: 1,
          reminderAmount: 50,
        },
      });
      expect(goalResponse.status(), await goalResponse.text()).toBe(201);
      const goal = (await goalResponse.json()) as { id: string; reminderAmount: number };

      const month = new Date().toISOString().slice(0, 7);
      const period = `M:${month}`;
      await pool.query(
        `INSERT INTO "GoalContribution"
          ("id", "userId", "goalId", "period", "amount", "goalAccountId", "status", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
        [randomUUID(), user.id, goal.id, period, goal.reminderAmount, savings.id]
      );

      const token = signGoalContributionToken({
        sub: user.id,
        scope: 'goal_contribution',
        goalId: goal.id,
        period,
      });

      const notificationKey = `goal_contribution:${goal.id}:${period}`;
      await pool.query(
        `INSERT INTO "Notification"
          ("id", "userId", "key", "type", "title", "body", "actionUrl", "createdAt")
         VALUES ($1, $2, $3, 'goal_contribution', $4, $5, $6, NOW())`,
        [
          randomUUID(),
          user.id,
          notificationKey,
          `Recordatorio de meta: ${goalName}`,
          'Tienes una aportación pendiente. Confírmala desde aquí.',
          `/goals/aceptar?token=${token}`,
        ]
      );

      async function goalSaved(): Promise<number> {
        const response = await context.request.get('/api/v1/goals');
        expect(response.ok()).toBe(true);
        const goals = (await response.json()) as Array<{ id: string; saved: number }>;
        return goals.find((item) => item.id === goal.id)?.saved ?? -1;
      }

      async function transferCount(): Promise<number> {
        const response = await context.request.get('/api/v1/transactions', {
          params: { search: `Aportación a ${goalName}` },
        });
        expect(response.ok()).toBe(true);
        const result = (await response.json()) as { total: number };
        return result.total;
      }

      async function suggestedAmount(): Promise<number> {
        const { rows } = await pool.query<{ reminderAmount: number }>(
          'SELECT "reminderAmount" FROM "SavingsGoal" WHERE "id" = $1',
          [goal.id]
        );
        return rows[0].reminderAmount;
      }

      expect(await goalSaved()).toBe(0);
      expect(await transferCount()).toBe(0);
      expect(await suggestedAmount()).toBe(50);

      const page = await context.newPage();
      await page.goto('/goals');
      await expect(
        page.getByRole('status', { name: 'Avisos de la meta activos' })
      ).toBeVisible();
      await page.getByRole('button', { name: /^Notificaciones/ }).first().click();
      await expect(page.getByText('Tienes una aportación pendiente. Confírmala desde aquí.')).toBeVisible();
      await expect(page.getByText(/50,00/)).toHaveCount(0);
      await page.getByRole('link', { name: 'Aceptar aportación' }).click();
      await expect(page).toHaveURL(/\/goals\/aceptar\?token=/);
      await expect.poll(async () => {
        const row = await pool.query<{ readAt: Date | null }>(
          'SELECT "readAt" FROM "Notification" WHERE "key" = $1',
          [notificationKey]
        );
        return row.rows[0]?.readAt != null;
      }).toBe(true);

      await expect(page.getByRole('heading', { name: 'Confirma tu aportación' })).toBeVisible();
      await expect(page.getByText(`Aportación programada · ${period}`)).toBeVisible();
      const amountField = page.getByLabel('Importe de la aportación (€)');
      await expect(amountField).toHaveValue('50');
      const updateSuggestion = page.getByRole('checkbox', {
        name: 'Actualizar el importe para futuras aportaciones',
      });
      await expect(updateSuggestion).toBeDisabled();
      await expect(updateSuggestion).not.toBeChecked();
      await expect(
        page.getByText(/No se realizará el movimiento hasta que confirmes/i)
      ).toBeVisible();
      await expect(page.getByText(/50,00/)).toHaveCount(0);
      await expectAccessible(page, '/goals/aceptar');

      // Abrir el enlace (GET) no mueve dinero.
      expect(await goalSaved()).toBe(0);
      expect(await transferCount()).toBe(0);

      await amountField.fill('25');
      await expect(updateSuggestion).toBeEnabled();
      await expect(updateSuggestion).not.toBeChecked();
      await updateSuggestion.check();
      await page.getByRole('combobox', { name: 'Cuenta origen' }).selectOption(checking.id);
      await page.getByRole('button', { name: 'Aceptar aportación' }).click();
      await expect(page.getByRole('heading', { name: 'Aportación confirmada' })).toBeVisible();
      await expect(page.getByText(`Aportación programada · ${period}`)).toBeVisible();
      await expect(page.getByRole('link', { name: 'Ver movimientos' })).toHaveAttribute(
        'href',
        `/transactions?goalId=${goal.id}&month=${month}`
      );
      await expect(page.getByRole('link', { name: 'Volver a metas' })).toHaveAttribute('href', '/goals');

      // 3B: el enlace llega filtrado por meta y mes, con el chip correspondiente.
      await page.getByRole('link', { name: 'Ver movimientos' }).click();
      await expect(page).toHaveURL(
        new RegExp(`/transactions\\?goalId=${goal.id}&month=${month}`)
      );
      await expect(page.getByRole('group', { name: 'Filtro de meta' })).toContainText(goalName);
      await expect(
        page.getByRole('cell', { name: `Aportación a ${goalName}`, exact: true })
      ).toBeVisible();
      await page.goBack();

      expect(await goalSaved()).toBe(25);
      expect(await transferCount()).toBe(1);
      expect(await suggestedAmount()).toBe(25);

      const transfers = await context.request.get('/api/v1/transactions', {
        params: { search: `Aportación a ${goalName}` },
      });
      const { data } = (await transfers.json()) as {
        data: Array<{ amount: number; accountId: string; transferAccountId: string }>;
      };
      expect(data[0]).toMatchObject({
        amount: -25,
        accountId: checking.id,
        transferAccountId: savings.id,
      });

      const notifications = await context.request.get('/api/v1/notifications');
      const { items } = (await notifications.json()) as {
        items: Array<{ type: string; title: string; body: string }>;
      };
      // 4A: la campana conserva el aviso previo, pero no repite la confirmación.
      expect(items.some((item) => item.title.startsWith('Recordatorio de meta'))).toBe(true);
      expect(items.some((item) => item.title.startsWith('Aportación confirmada'))).toBe(false);

      // Reabrir el enlace muestra la doble confirmación y no mueve dinero.
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Ya confirmaste esta aportación' })).toBeVisible();
      await expect(
        page.getByText(
          `Esta aportación ya se hizo anteriormente para el periodo ${period}. No se ha vuelto a realizar el movimiento.`
        )
      ).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Cuenta origen' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Ver movimientos' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Volver a metas' })).toBeVisible();
      expect(await goalSaved()).toBe(25);
      expect(await transferCount()).toBe(1);

      const repeated = await context.request.post('/api/v1/goal-contributions/accept', {
        data: { token, accountId: checking.id, amount: 25, updateSuggestion: false },
      });
      expect(repeated.status(), await repeated.text()).toBe(200);
      expect((await repeated.json()) as { alreadyAccepted: boolean }).toMatchObject({
        alreadyAccepted: true,
      });
      expect(await transferCount()).toBe(1);
    } finally {
      await context.close();
      await pool.end();
    }
  });

  test('el enlace del correo deja el formulario en la pestaña nueva y lleva la vieja a /goals', async ({ browser }) => {
    test.setTimeout(60_000);
    const databaseUrl = process.env.E2E_DATABASE_URL;
    if (!databaseUrl) throw new Error('E2E_DATABASE_URL is required');

    const pool = new Pool({ connectionString: databaseUrl });
    const context = await browser.newContext({ baseURL: FRONTEND_URL });
    const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const email = `broadcast-${runId}@example.com`;
    const goalName = `Meta broadcast ${runId}`;

    try {
      const register = await context.request.post('/api/v1/auth/register', {
        data: { email, password: PASSWORD },
      });
      expect(register.status(), await register.text()).toBe(201);
      const { user } = (await register.json()) as { user: { id: string } };

      async function createAccount(type: 'checking' | 'savings'): Promise<SeededAccount> {
        const response = await context.request.post('/api/v1/accounts', {
          data: { name: `${type} BC ${runId}`, type },
        });
        expect(response.status(), await response.text()).toBe(201);
        return (await response.json()) as SeededAccount;
      }

      const savings = await createAccount('savings');
      const goalResponse = await context.request.post('/api/v1/goals', {
        data: {
          name: goalName,
          targetAmount: 1000,
          accountId: savings.id,
          reminderEnabled: true,
          reminderDay: 1,
          reminderAmount: 25,
        },
      });
      expect(goalResponse.status(), await goalResponse.text()).toBe(201);
      const goal = (await goalResponse.json()) as { id: string };

      const period = `M:${new Date().toISOString().slice(0, 7)}`;
      await pool.query(
        `INSERT INTO "GoalContribution"
          ("id", "userId", "goalId", "period", "amount", "goalAccountId", "status", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
        [randomUUID(), user.id, goal.id, period, 25, savings.id]
      );
      const token = signGoalContributionToken({
        sub: user.id,
        scope: 'goal_contribution',
        goalId: goal.id,
        period,
      });

      // Pestaña vieja: tiene la app abierta en otra ruta y escucha el canal.
      const oldTab = await context.newPage();
      await oldTab.goto('/dashboard');
      await expect(oldTab.getByRole('button', { name: /^Notificaciones/ }).first()).toBeVisible();

      // Pestaña nueva: es la que abre el enlace del correo y publica el aviso.
      const mailTab = await context.newPage();
      for (let attempt = 0; attempt < 3; attempt++) {
        await mailTab.goto(`/goals/aceptar?token=${token}`);
        try {
          await expect(oldTab).toHaveURL(/\/goals\/?$/, { timeout: 2000 });
          break;
        } catch (error) {
          if (attempt === 2) throw error;
        }
      }

      // La pestaña vieja confirma con ACK y se retira: queda un solo formulario,
      // el de la pestaña donde se abrió el enlace.
      await expect(oldTab).toHaveURL(/\/goals\/?$/, { timeout: 5000 });
      await expect(oldTab.getByRole('combobox', { name: 'Cuenta origen' })).toHaveCount(0);

      await expect(mailTab).toHaveURL(/\/goals\/aceptar\?token=/);
      await expect(mailTab.getByRole('heading', { name: 'Confirma tu aportación' })).toBeVisible();
      await expect(mailTab.getByRole('combobox', { name: 'Cuenta origen' })).toBeEnabled();
      await expect(mailTab.getByLabel('Importe de la aportación (€)')).toHaveValue('25');
      // La pestaña nueva no se retira aunque siga abierta la vieja.
      await mailTab.waitForTimeout(500);
      await expect(mailTab).toHaveURL(/\/goals\/aceptar\?token=/);
      await expect(oldTab).toHaveURL(/\/goals\/?$/);

      // El aviso no mueve dinero: solo lo hace el POST autenticado.
      const goals = await context.request.get('/api/v1/goals');
      const goalItems = (await goals.json()) as Array<{ id: string; saved: number }>;
      expect(goalItems.find((item) => item.id === goal.id)?.saved).toBe(0);
      const transfers = await context.request.get('/api/v1/transactions', {
        params: { search: `Aportación a ${goalName}` },
      });
      expect(((await transfers.json()) as { total: number }).total).toBe(0);
    } finally {
      await context.close();
      await pool.end();
    }
  });
});
