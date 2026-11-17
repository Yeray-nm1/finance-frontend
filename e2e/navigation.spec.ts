import { test, expect } from '@playwright/test';

const routes = [
  { path: '/dashboard', heading: 'Dashboard' },
  { path: '/accounts', heading: 'Cuentas bancarias' },
  { path: '/goals', heading: 'Metas de ahorro' },
  { path: '/categories', heading: 'Categorías' },
  { path: '/budgets', heading: 'Presupuestos' },
  { path: '/subscriptions', heading: 'Suscripciones' },
  { path: '/transactions', heading: 'Transacciones' },
  { path: '/preferences', heading: 'Preferencias' },
];

test.describe('navegación de escritorio', () => {
  for (const route of routes) {
    test(`carga ${route.path}`, async ({ page }) => {
      await page.goto(route.path);

      await expect(page).toHaveURL(new RegExp(`${route.path}$`));
      await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible();
      await expect(page.getByRole('complementary', { name: 'Navegacion principal' })).toBeVisible();
    });
  }

  test('navega con el enlace de la barra lateral', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();

    await page.getByRole('link', { name: 'Transacciones' }).click();

    await expect(page).toHaveURL(/\/transactions$/);
    await expect(page.getByRole('heading', { name: 'Transacciones', exact: true })).toBeVisible();
  });
});

test.describe('navegación móvil', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('abre el menú lateral y navega', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Abrir menu' }).click();

    const sidebar = page.getByRole('dialog', { name: 'Navegacion principal' });
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveAttribute('aria-modal', 'true');

    await sidebar.getByRole('link', { name: 'Presupuestos' }).click();

    await expect(page).toHaveURL(/\/budgets$/);
    await expect(page.getByRole('heading', { name: 'Presupuestos', exact: true })).toBeVisible();
    await expect(sidebar).not.toHaveAttribute('aria-modal', 'true');
  });

  test('cierra el menú con Escape', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page.getByRole('heading', { name: 'Transacciones', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const sidebar = page.getByRole('dialog', { name: 'Navegacion principal' });
    await expect(sidebar).toHaveAttribute('aria-modal', 'true');

    await page.keyboard.press('Escape');

    await expect(sidebar).not.toHaveAttribute('aria-modal', 'true');
  });
});
