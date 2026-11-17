import { test, expect, type Browser, type BrowserContext } from '@playwright/test';

const FRONTEND_URL = 'http://localhost:3101';
const PASSWORD = 'E2ePassword123';

interface IsolatedUser {
  context: BrowserContext;
  email: string;
}

async function createUser(browser: Browser): Promise<IsolatedUser> {
  const context = await browser.newContext({ baseURL: FRONTEND_URL });
  const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const email = `delete-${runId}@example.com`;

  const response = await context.request.post('/api/v1/auth/register', {
    data: { email, password: PASSWORD },
  });
  expect(response.status(), await response.text()).toBe(201);

  return { context, email };
}

async function seedMovement(context: BrowserContext): Promise<void> {
  const accountsResponse = await context.request.get('/api/v1/accounts');
  expect(accountsResponse.ok()).toBe(true);
  const accounts = (await accountsResponse.json()) as { id: string }[];
  expect(accounts.length).toBeGreaterThan(0);

  const created = await context.request.post('/api/v1/transactions', {
    data: {
      date: '2026-11-01',
      amount: 12.5,
      description: 'Movimiento para borrar',
      type: 'expense',
      accountId: accounts[0].id,
    },
  });
  expect(created.status(), await created.text()).toBe(201);
}

test.describe('borrado de datos y de cuenta', () => {
  test('borra todos los datos desde Preferencias y mantiene la sesión', async ({ browser }) => {
    const { context } = await createUser(browser);
    await seedMovement(context);

    const page = await context.newPage();
    await page.goto('/preferences');

    await page.getByRole('button', { name: 'Borrar todos mis datos' }).click();
    await expect(
      page.getByRole('heading', { name: 'Borrar todos mis datos' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Borrar datos' }).click();

    await expect(
      page.getByText('Datos borrados correctamente', { exact: true })
    ).toBeVisible();

    const accounts = await context.request.get('/api/v1/accounts');
    expect(await accounts.json()).toEqual([]);

    const me = await context.request.get('/api/v1/auth/me');
    expect(me.ok()).toBe(true);

    await context.close();
  });

  test('rechaza borrar la cuenta con una contraseña incorrecta', async ({ browser }) => {
    const { context } = await createUser(browser);

    const page = await context.newPage();
    await page.goto('/preferences');

    await page.getByRole('button', { name: 'Borrar mi cuenta' }).click();
    await page.getByLabel('Contraseña').fill('WrongPass123');
    await page.getByRole('button', { name: 'Borrar cuenta' }).click();

    await expect(
      page.getByText('La contraseña no es correcta')
    ).toBeVisible();

    const me = await context.request.get('/api/v1/auth/me');
    expect(me.ok()).toBe(true);

    await context.close();
  });

  test('borra la cuenta con la contraseña correcta y cierra la sesión', async ({ browser }) => {
    const { context, email } = await createUser(browser);

    const page = await context.newPage();
    await page.goto('/preferences');

    await page.getByRole('button', { name: 'Borrar mi cuenta' }).click();
    await page.getByLabel('Contraseña').fill(PASSWORD);
    await page.getByRole('button', { name: 'Borrar cuenta' }).click();

    await expect(page).toHaveURL(/\/login$/);

    const me = await context.request.get('/api/v1/auth/me');
    expect(me.status()).toBe(401);

    const reRegister = await context.request.post('/api/v1/auth/register', {
      data: { email, password: PASSWORD },
    });
    expect(reRegister.status(), await reRegister.text()).toBe(201);

    await context.close();
  });
});
