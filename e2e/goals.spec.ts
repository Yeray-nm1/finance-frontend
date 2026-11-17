import { test, expect, type Browser, type BrowserContext } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3101';
const PASSWORD = 'E2ePassword123';

interface SeededAccount {
  id: string;
  name: string;
}

interface IsolatedUser {
  context: BrowserContext;
  runId: string;
  checking: SeededAccount;
  savings: SeededAccount;
}

async function createUserWithAccounts(browser: Browser): Promise<IsolatedUser> {
  const context = await browser.newContext({ baseURL: FRONTEND_URL });
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const email = `goals-${runId}@example.com`;

  const register = await context.request.post('/api/v1/auth/register', {
    data: { email, password: PASSWORD },
  });
  expect(register.status(), await register.text()).toBe(201);

  const checkingResponse = await context.request.post('/api/v1/accounts', {
    data: { name: `Cuenta E2E ${runId}`, type: 'checking' },
  });
  expect(checkingResponse.status(), await checkingResponse.text()).toBe(201);
  const checking = (await checkingResponse.json()) as SeededAccount;

  const savingsResponse = await context.request.post('/api/v1/accounts', {
    data: { name: `Ahorro E2E ${runId}`, type: 'savings' },
  });
  expect(savingsResponse.status(), await savingsResponse.text()).toBe(201);
  const savings = (await savingsResponse.json()) as SeededAccount;

  return { context, runId, checking, savings };
}

test.describe('metas de ahorro', () => {
  test('crea, aporta, archiva, reactiva y elimina una meta', async ({ browser }) => {
    const { context, runId, checking, savings } = await createUserWithAccounts(browser);
    const goalName = `Meta E2E ${runId}`;

    try {
      const page = await context.newPage();
      await page.goto('/goals');
      await expect(
        page.getByRole('heading', { name: 'Metas de ahorro', exact: true })
      ).toBeVisible();

      const activeTab = page.getByRole('tab', { name: /Activas/ });
      const archivedTab = page.getByRole('tab', { name: /Archivadas/ });

      // Alta
      await page.getByRole('button', { name: 'Nueva meta' }).click();
      const createDialog = page.getByRole('dialog');
      await expect(
        createDialog.getByRole('heading', { name: 'Nueva meta de ahorro' })
      ).toBeVisible();
      await createDialog.getByLabel('Nombre').fill(goalName);
      await createDialog.getByLabel('Objetivo (€)').fill('100');
      await createDialog.getByRole('combobox', { name: 'Cuenta de ahorro' }).click();
      await page.getByRole('option', { name: savings.name }).click();
      await createDialog.getByRole('button', { name: 'Crear meta' }).click();

      await expect(createDialog).toBeHidden();
      await expect(page.getByText('Meta creada', { exact: true })).toBeVisible();

      const card = page
        .locator('[data-goal-card]')
        .filter({ has: page.getByRole('heading', { name: goalName, exact: true }) });
      await expect(card).toBeVisible();
      await expect(card).toContainText('100,00');
      await expect(card).toContainText('Faltan 100,00');

      // Aportación
      await card.getByRole('button', { name: 'Aportar' }).click();
      const contributionDialog = page.getByRole('dialog');
      await expect(
        contributionDialog.getByRole('heading', { name: `Aportar a ${goalName}` })
      ).toBeVisible();
      await contributionDialog.getByLabel('Importe (€)').fill('25');
      await contributionDialog.getByRole('combobox', { name: 'Cuenta origen' }).click();
      await page.getByRole('option', { name: checking.name }).click();
      await contributionDialog.getByRole('button', { name: 'Registrar aportación' }).click();

      await expect(contributionDialog).toBeHidden();
      await expect(page.getByText('Aportación registrada', { exact: true })).toBeVisible();
      await expect(card).toContainText('25,00');
      await expect(card).toContainText('Faltan 75,00');
      await expect(card).toContainText('25%');

      // Historial y borrado de la aportación
      await card.getByRole('button', { name: 'Aportaciones (1)' }).click();
      const history = page.getByRole('dialog');
      await expect(
        history.getByRole('heading', { name: `Aportaciones de ${goalName}` })
      ).toBeVisible();
      await expect(history).toContainText('25,00');
      await history
        .getByRole('button', { name: /Eliminar aportación de 25,00/ })
        .click();
      await history.getByRole('button', { name: 'Eliminar', exact: true }).click();
      await expect(history.getByText('Todavía no hay aportaciones.')).toBeVisible();
      await history.getByRole('button', { name: 'Close' }).click();
      await expect(card).toContainText('Faltan 100,00');

      // Archivar y reactivar
      await card.getByRole('button', { name: `Archivar ${goalName}` }).click();
      await expect(page.getByText('Meta archivada', { exact: true })).toBeVisible();
      await expect(archivedTab).toContainText('Archivadas (1)');
      await archivedTab.click();
      await expect(card).toBeVisible();
      await card.getByRole('button', { name: `Reactivar ${goalName}` }).click();
      await expect(page.getByText('Meta reactivada', { exact: true })).toBeVisible();
      await activeTab.click();
      await expect(card).toBeVisible();

      // Borrado de la meta
      await card.getByRole('button', { name: `Eliminar ${goalName}` }).click();
      const confirmDialog = page.getByRole('dialog');
      await expect(confirmDialog.getByRole('heading', { name: 'Eliminar meta' })).toBeVisible();
      await confirmDialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
      await expect(page.getByText('Meta eliminada', { exact: true })).toBeVisible();
      await expect(card).toHaveCount(0);
      await expect(activeTab).toContainText('Activas (0)');
    } finally {
      await context.close();
    }
  });
});
