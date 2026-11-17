import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'móvil pequeño', width: 320, height: 640 },
  { name: 'móvil', width: 375, height: 812 },
  { name: 'escritorio', width: 1280, height: 800 },
];

const pages = [
  { path: '/transactions', heading: 'Transacciones' },
  { path: '/dashboard', heading: 'Dashboard' },
];

for (const viewport of viewports) {
  for (const target of pages) {
    test(`${target.path} no desborda a lo ancho en ${viewport.name} (${viewport.width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(target.path);
      await expect(page.getByRole('heading', { name: target.heading, exact: true })).toBeVisible();

      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth - window.innerWidth,
        body: document.body.scrollWidth - window.innerWidth,
      }));

      expect(overflow.document).toBeLessThanOrEqual(1);
      expect(overflow.body).toBeLessThanOrEqual(1);
    });
  }
}

test('en móvil muestra la lista de tarjetas y oculta la tabla', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/transactions');
  await expect(page.getByRole('heading', { name: 'Transacciones', exact: true })).toBeVisible();

  await expect(page.getByRole('table')).toBeHidden();
  await expect(page.getByLabel('Seleccionar todas las transacciones')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Añadir gasto rápido' })).toBeVisible();
});

test('en escritorio muestra la tabla y oculta la lista móvil', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/transactions');
  await expect(page.getByRole('heading', { name: 'Transacciones', exact: true })).toBeVisible();

  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByLabel('Seleccionar todas las transacciones')).toBeHidden();
});
