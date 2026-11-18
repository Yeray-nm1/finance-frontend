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

/** Token HS256 siniat/exp, igual que el que genera el backend para el correo. */
function signGoalContributionToken(payload: ContributionTokenPayload): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac('sha256', E2E_JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

test.describe('aportación programada con aceptación por correo', () => {
  test('no cobra sin aceptar y transfiere solo tras el POST autenticado', async ({ browser }) => {
    test.setTimeout(60_000);
    const databaseUrl = process.env.E2E_DATABASE_URL;
    if (!databaseUrl) throw new Error('E2E_DATABASE_URL is required');

    const pool = new Pool({ connectionString: databaseUrl });
    const context = await browser.newContext({ baseURL: FRONTEND_URL });
    const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const email = `contribution-${runId}@example.com`;
    const goalName = `Meta aportación ${runId}`;

    try {
      const register = await context.request.post('/api/v1/auth/register', {
        data: { email, password: PASSWORD },
      });
      expect(register.status(), await register.text()).toBe(201);
      const { user } = (await register.json()) as { user: { id: string } };

      async function createAccount(type: 'checking' | 'savings'): Promise<SeededAccount> {
        const response = await context.request.post('/api/v1/accounts', {
          data: { name: `${type} E2E ${runId}`, type },
        });
        expect(response.status(), await response.text()).toBe(201);
        return (await response.json()) as SeededAccount;
      }

      const checking = await createAccount('checking');
      const savings = await createAccount('savings');

      const goalResponse = await context.request.post('/api/v1/goals', {
        data: {
          name: goalName,
          targetAmount: 1000,
          accountId: savings.id,
          contributionScheduled: true,
          reminderDay: 1,
          reminderAmount: 50,
        },
      });
      expect(goalResponse.status(), await goalResponse.text()).toBe(201);
      const goal = (await goalResponse.json()) as { id: string };

      const period = new Date().toISOString().slice(0, 7);
      await pool.query(
        `INSERT INTO "GoalContribution"
          ("id", "userId", "goalId", "period", "amount", "goalAccountId", "status", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
        [randomUUID(), user.id, goal.id, period, 50, savings.id]
      );

      const token = signGoalContributionToken({
        sub: user.id,
        scope: 'goal_contribution',
        goalId: goal.id,
        period,
      });

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

      expect(await goalSaved()).toBe(0);
      expect(await transferCount()).toBe(0);

      const page = await context.newPage();
      await page.goto(`/goals/aceptar?token=${token}`);
      await expect(page.getByRole('heading', { name: 'Confirma tu aportación' })).toBeVisible();
      await expect(page.getByText(goalName)).toBeVisible();
      await expect(page.getByText(/50,00/)).toBeVisible();
      await expect(
        page.getByText(/No se cobrará nada sin tu confirmación/i)
      ).toBeVisible();
      await expectAccessible(page, '/goals/aceptar');

      // Abrir el enlace (GET) no mueve dinero.
      expect(await goalSaved()).toBe(0);
      expect(await transferCount()).toBe(0);

      await page.getByRole('combobox', { name: 'Cuenta origen' }).selectOption(checking.id);
      await page.getByRole('button', { name: 'Aceptar aportación' }).click();
      await expect(page.getByRole('heading', { name: 'Aportación confirmada' })).toBeVisible();

      expect(await goalSaved()).toBe(50);
      expect(await transferCount()).toBe(1);

      const transfers = await context.request.get('/api/v1/transactions', {
        params: { search: `Aportación a ${goalName}` },
      });
      const { data } = (await transfers.json()) as {
        data: Array<{ amount: number; accountId: string; transferAccountId: string }>;
      };
      expect(data[0]).toMatchObject({
        amount: -50,
        accountId: checking.id,
        transferAccountId: savings.id,
      });

      const notifications = await context.request.get('/api/v1/notifications');
      const { items } = (await notifications.json()) as {
        items: Array<{ type: string; title: string }>;
      };
      expect(
        items.some(
          (item) =>
            item.type === 'goal_contribution' &&
            item.title.startsWith('Aportación confirmada')
        )
      ).toBe(true);

      const repeated = await context.request.post('/api/v1/goal-contributions/accept', {
        data: { token, accountId: checking.id },
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
});
